declare module '@flekschas/utils' {
  export function identity<T>(x: T): T;
  export function deepClone<T>(x: T): T;
}
