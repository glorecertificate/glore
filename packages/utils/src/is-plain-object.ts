/**
 * Checks if the provided value is a plain object.
 * A plain object is an object created by the `Object` constructor or one with a null prototype.
 */
export const isPlainObject = <T>(x: T) => Object.prototype.toString.call(x) === '[object Object]'
