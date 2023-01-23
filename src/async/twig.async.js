import {twig} from "../twig.js";
import { TwigPromise } from "./twig.promise.js";
import TwigError from "../TwigError.js";

class TwigAsync { 

     /**
     * Handling of code paths that might either return a promise
     * or a value depending on whether async code is used.
     *
     * @see https://github.com/twigjs/twig.js/blob/master/ASYNC.md#detecting-asynchronous-behaviour
     */
    potentiallyAsyncSlow(that, allowAsync, action) {
        let result = action.call(that);
        let err = null;
        let isAsync = true;

        if (!twig.isPromise(result)) {
            return result;
        }

        result.then(res => {
            result = res;
            isAsync = false;
        }).catch(error => {
            err = error;
        });

        if (err !== null) {
            throw err;
        }

        if (isAsync) {
            throw new TwigError('You are using Twig.js in sync mode in combination with async extensions.');
        }

        return result;
    }

    potentiallyAsync(that, allowAsync, action) {
        if (allowAsync) {
            return TwigPromise.resolve(action.call(that));
        }

        return this.potentiallyAsyncSlow(that, allowAsync, action);
    };


    /**
    * Go over each item in a fashion compatible with Twig.forEach,
    * allow the function to return a promise or call the third argument
    * to signal it is finished.
    *
    * Each item in the array will be called sequentially.
    */
    forEach(arr, callback) {
        const len = arr ? arr.length : 0;
        let index = 0;
        const STATE_RESOLVED = 1;
        function next() {
            let resp = null;

            do {
                if (index === len) {
                    return TwigPromise.resolve();
                }

                resp = callback(arr[index], index);
                index++;
            // While the result of the callback is not a promise or it is
            // a promise that has settled we can use a regular loop which
            // is much faster.
            } while (!resp || !twig.isPromise(resp) || resp._state === STATE_RESOLVED);

            return resp.then(next);
        }

        return next();
    };
};

const AsyncTwig = new TwigAsync();
export {AsyncTwig};