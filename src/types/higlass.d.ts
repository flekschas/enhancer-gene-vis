declare module 'higlass' {
  function ChromosomeInfo(source: string): Promise<ChromosomeInfoResult>;
  class ChromosomeInfoResult {
    /** Mapping of chromosome to ChromosomePosition object */
    chrPositions: {[key: string]: ChromosomePosition};
    chromLengths: {[key: string]: number};
    cumPositions: ChromosomePosition[];
    totalLength: number;
  }
  type ChromosomePosition = {
    id: number;
    chr: string;
    pos: number;
  }
}
