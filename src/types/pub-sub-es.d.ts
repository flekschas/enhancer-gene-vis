declare module 'pub-sub-es' {
  class globalPubSub {
    constructor();
    static subscribe(
      event: string,
      handler: Function,
      times?: number
    ): { event: string; handler: Function };
    static unsubscribe({ event: string, handler: Function }): void;
    static publish(event: string, ...args: any[]): void;
  }
}
