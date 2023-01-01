/**
 * Exception thrown by twig.js.
 */

export default class TwigError {
    message = message;
    name = 'TwigException';
    type = 'TwigException';
    file;

    constructor(message, file = '') {
        this.message = message;
        this.file = file;
    }

    /**
     * Get the string representation of a Twig error.
     */
    toString() {
        return this.name + ': ' + this.message;
    };
}