import { TwigPromise } from "./twig.promise.js";
import { TwigThenable } from "./twig.thenable.js";
const STATE_UNKNOWN = 0;
const STATE_RESOLVED = 1;
const STATE_REJECTED = 2;

function pending(handlers, onResolved, onRejected) {
    const h = [onResolved, onRejected, -2];

    // The promise has yet to be rejected or resolved.
    if (!handlers) {
        handlers = h;
    } else if (handlers[2] === -2) {
        // Only allocate an array when there are multiple handlers
        handlers = [handlers, h];
    } else {
        handlers.push(h);
    }

    return handlers;
}

/**
 * Promise implementation that can handle being resolved at any later time.
 *
 */
class TwigFullPromise {
    constructor() {
        let handlers = null;

        // The state has been changed to either resolve, or reject
        // which means we should call the handler.
        function resolved(onResolved) {
            onResolved(p._value);
        }

        function rejected(onResolved, onRejected) {
            onRejected(p._value);
        }

        let append = function(onResolved, onRejected) {
            handlers = pending(handlers, onResolved, onRejected);
        };

        function changeState(newState, v) {
            if (p._state) {
                return;
            }

            p._value = v;
            p._state = newState;

            append = newState === STATE_RESOLVED ? resolved : rejected;

            if (!handlers) {
                return;
            }

            if (handlers[2] === -2) {
                append(handlers[0], handlers[1]);
                handlers = null;
                return;
            }

            handlers.forEach(h => {
                append(h[0], h[1]);
            });
            handlers = null;
        }

        const p = new TwigThenable((onResolved, onRejected) => {
            const hasResolved = typeof onResolved === "function";

            // Shortcut for resolved twig promises
            if (p._state === STATE_RESOLVED && !hasResolved) {
                return TwigPromise.resolve(p._value);
            }

            if (p._state === STATE_RESOLVED) {
                try {
                    return TwigPromise.resolve(onResolved(p._value));
                } catch (error) {
                    return TwigPromise.reject(error);
                }
            }

            const hasRejected = typeof onRejected === "function";

            return new TwigPromise((resolve, reject) => {
                append(
                    hasResolved
                        ? result => {
                              try {
                                  resolve(onResolved(result));
                              } catch (error) {
                                  reject(error);
                              }
                          }
                        : resolve,
                    hasRejected
                        ? err => {
                              try {
                                  resolve(onRejected(err));
                              } catch (error) {
                                  reject(error);
                              }
                          }
                        : reject
                );
            });
        });

        changeState.promise = p;

        return changeState;
    }
}

export { TwigFullPromise };
