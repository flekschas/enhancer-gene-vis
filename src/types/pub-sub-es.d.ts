declare module 'pub-sub-es' {
  // No need to type further for declaration file for now?
  type EventStack = object;
  type SubscribeFn = (
    event: string,
    handler: Function,
    times?: number
  ) => SubscribeFnResult;
  // Warning! Copied into `higlass.d.ts` because not sure how to import from sibling declaration file
  type SubscribeFnResult = { event: string; handler: Function };
  type UnsubscribeFn = ({ event: string, handler: Function }) => void;
  type PublishFn = (event: string, news: any, options?: PublishOptions) => void;
  type PublishOptions = {
    isNoGlobalBroadcast: boolean;
    async: boolean;
  };
  type ClearFn = () => void;
  type PubSub = {
    publish: PublishFn;
    subscribe: SubscribeFn;
    unsubscribe: UnsubscribeFn;
    clear: ClearFn;
    stack: EventStack;
  };

  function createPubSub(): {};

  function getEventName(eventName: string, caseInsensitive: boolean): string;
  function subscribe(
    stack: EventStack,
    ref?: { caseInsensitive: boolean }
  ): SubscribeFn;
  function unsubscribe(
    stack: EventStack,
    ref?: { caseInsensitive: boolean }
  ): UnsubscribeFn;
  function publish(
    stack: EventStack,
    ref: { isGlobal: boolean; caseInsensitive: boolean; async: boolean }
  ): PublishFn;
  function createEmptyStack(): EventStack;
  function clear(stack: EventStack): ClearFn;
  function createPubSub(): PubSub;

  class globalPubSub {
    constructor();
    static subscribe: SubscribeFn;
    static unsubscribe: UnsubscribeFn;
    static publish: PublishFn;
  }
}
