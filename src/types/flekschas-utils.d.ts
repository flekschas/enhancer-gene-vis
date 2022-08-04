declare module '@flekschas/utils' {
  export function identity<T>(x: T): T;
  export function deepClone<T>(x: T): T;
  export function isString(x: any): boolean;
  export function pipe<T>(...fns: Function[]): (x: T) => T;

  /**
   * Debounce a function call.
   *
   * @description
   * Function calls are delayed by `wait` milliseconds and only one out of
   * multiple function calls is executed.
   *
   * @param {function} fn - Function to be debounced
   * @param {number} wait - Number of milliseconds to debounce the function call.
   * @return {function} Debounced function
   */
  export function debounce(fn: Function, wait: number): Function;
  export function isParentOf(x: Element, y: Element): boolean;
  export function sum(arr: number[]): number;

  /**
   * Get the maximum number of a vector while ignoring NaNs
   *
   * @description
   * This version is muuuch faster than `Math.max(...v)`.
   *
   * @param {array} v - Numerical vector
   * @return {number} The largest number
   */
  export function maxNan(arr: number[]): number;

  /**
   * Gets the max vector by combining the maximum value at each index
   * of the numeric arrays. Can be thought of as a max operation along
   * axis 0 in numpy.
   *
   * @param {array} m - Array of vectors
   * @return {array} Max vector
   */
  export function maxVector(arr: number[][]): number[];

  /**
   * Get the mean of a vector while ignoring NaNs
   *
   * @description
   * Roughly 30% slower than `mean()`
   *
   * @param {array} v - Numerical vector
   * @return {number} The mean
   */
  export function meanNan(arr: number[]): number;

  /**
   * Get the minimum number of a vector while ignoring NaNs
   *
   * @description
   * This version is muuuch faster than `Math.min(...v)` and support longer
   * vectors than 256^2, which is a limitation of `Math.min.apply(null, v)`.
   *
   * @param {array} v - Numerical vector
   * @return {number} The smallest number
   */
  export function minNan(arr: number[]): number;

  /**
   * Get the sum of a vector while ignoring NaNs
   *
   * @description
   *
   *
   * @param {array} v - Numerical vector
   * @return {number} The sum
   */
  export function sumNan(arr: number[]): number;
}
