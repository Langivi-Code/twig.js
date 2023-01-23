import { twig } from "../twig.js";
import { TwigThenable } from "./twig.thenable.js";
import { AsyncTwig } from "./twig.async.js";
import { TwigFullPromise } from "./twig.fullpromise.js";

const STATE_UNKNOWN = 0;
const STATE_RESOLVED = 1;
const STATE_REJECTED = 2;

function run(fn, resolve, reject) {
    try {
        fn(resolve, reject);
    } catch (error) {
        reject(error);
    }
}

/**
 * An alternate implementation of a Promise that does not fully follow
 * the spec, but instead works fully synchronous while still being
 * thenable.
 *
 * These promises can be mixed with regular promises at which point
 * the synchronous behaviour is lost.
 */
class TwigPromise {
    constructor(executor) {
        let state = STATE_UNKNOWN;
        let value = null;

        let changeState = function(nextState, nextValue) {
            state = nextState;
            value = nextValue;
        };

        function onReady(v) {
            changeState(STATE_RESOLVED, v);
        }

        function onReject(e) {
            changeState(STATE_REJECTED, e);
        }

        run(executor, onReady, onReject);

        // If the promise settles right after running the executor we can
        // return a Promise with it's state already set.
        //
        // Twig.Promise.resolve and Twig.Promise.reject both use the more
        // efficient `Twig.Thenable` for this purpose.
        if (state === STATE_RESOLVED) {
            return TwigPromise.resolve(value);
        }

        if (state === STATE_REJECTED) {
            return TwigPromise.reject(value);
        }
        // If we managed to get here our promise is going to resolve asynchronous.

        changeState = new TwigFullPromise();

        return changeState.promise;
    }

    static defaultResolved = new TwigThenable(
        TwigThenable.resolvedThen,
        undefined,
        STATE_RESOLVED
    );
    static emptyStringResolved = new TwigThenable(
        TwigThenable.resolvedThen,
        "",
        STATE_RESOLVED
    );

    static resolve(value) {
        if (arguments.length === 0 || typeof value === "undefined") {
            return TwigPromise.defaultResolved;
        }

        if (twig.isPromise(value)) {
            return value;
        }

        // Twig often resolves with an empty string, we optimize for this
        // scenario by returning a fixed promise. This reduces the load on
        // garbage collection.
        if (value === "") {
            return TwigPromise.emptyStringResolved;
        }

        return new TwigThenable(
            TwigThenable.resolvedThen,
            value,
            STATE_RESOLVED
        );
    }

    static reject(e) {
        // `e` should never be a promise.
        return new TwigThenable(TwigThenable.rejectedThen, e, STATE_REJECTED);
    }

    all(promises) {
        const results = new Array(promises.length);

        return AsyncTwig.forEach(promises, (p, index) => {
            if (!twig.isPromise(p)) {
                results[index] = p;
                return;
            }

            if (p._state === STATE_RESOLVED) {
                results[index] = p._value;
                return;
            }

            return p.then(v => {
                results[index] = v;
            });
        }).then(() => {
            return results;
        });
    }
}

export { TwigPromise };
