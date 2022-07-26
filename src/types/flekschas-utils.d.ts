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
}
