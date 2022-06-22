declare module 'pub-sub-es' {
  class globalPubSub {
    constructor();
    static subscribe(event: string, callback: Function): void;
    static unsubscribe(event: string, callback: Function): void;
    static publish(event: string, ...args: any[]): void;
  }
}