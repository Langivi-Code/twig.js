import { twig } from "../twig.js";
import { TwigPromise } from "./twig.promise.js";

const STATE_UNKNOWN = 0;
const STATE_RESOLVED = 1;

/**
 * Really small thenable to represent promises that resolve immediately.
 *
 */
class TwigThenable {
    constructor(then, value, state) {
        this.then = then;
        this._value = state ? value : null;
        this._state = state || STATE_UNKNOWN;
    }

    catch(onRejected) {
        // THe promise will not throw, it has already resolved.
        if (this._state === STATE_RESOLVED) {
            return this;
        }

        return this.then(null, onRejected);
    }

    /**
     * The `then` method attached to a Thenable when it has resolved.
     *
     */
    static resolvedThen(onResolved) {
        try {
            return TwigPromise.resolve(onResolved(this._value));
        } catch (error) {
            return TwigPromise.reject(error);
        }
    }
    /**
     * The `then` method attached to a Thenable when it has rejected.
     *
     */
    static rejectedThen(onResolved, onRejected) {
        // Shortcut for rejected twig promises
        if (!onRejected || typeof onRejected !== "function") {
            return this;
        }

        const value = this._value;

        let result;
        try {
            result = onRejected(value);
        } catch (error) {
            result = TwigPromise.reject(error);
        }

        return TwigPromise.resolve(result);
    }
}

export { TwigThenable };
