declare module '@flekschas/utils' {
  export function identity<T>(x: T): T;
  export function deepClone<T>(x: T): T;
  export function isString(x: any): boolean;
  export function pipe<T>(...fns: Function[]): (x: T) => T;
}
