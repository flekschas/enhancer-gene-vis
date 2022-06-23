declare module 'higlass' {
  function ChromosomeInfo(source: string): Promise<ChromosomeInfoResult>
  class ChromosomeInfoResult {
    // static constructor(source: string): Promise<ChromosomeInfo>;
    chromosome: string;
    totalLength?: number;
  }
}