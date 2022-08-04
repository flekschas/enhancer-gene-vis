declare module '@higlass/types' {
  export type HGC = {
      libraries: typeof import('@higlass/libraries');
      services: typeof import('@higlass/services');
      tracks: typeof import('@higlass/tracks');
      utils: typeof import('@higlass/utils');
  };
  export type { Context, Track, TrackOptions, TrackConfig } from '@higlass/tracks';
  export type { ChromInfo } from '@higlass/utils';
  export type { TilesetInfo } from '@higlass/services';
}

declare module '@higlass/common' {
  import type { ScaleContinuousNumeric } from 'd3-scale';

  type ColorRGBA = [number, number, number, number];
  type ColorRGB = [number, number, number]
  type Scale = ScaleContinuousNumeric<number, number>;

  type TilesetInfo = {
      min_pos: number[];
      max_pos: number[];
      max_zoom: number;
      tile_size?: number;
      zoom_step?: number;
      max_length?: number;
      assembly?: string;
      chrom_names?: string;
      chrom_sizes?: string;
      header?: string;
      version?: number;
      coordSystem?: string;
      datatype?: string
      name?: string
      shape: number[]
      resolutions?: number[];
            row_infos?: RowInfo[]
            max_width?: number;
            bins_per_dimension?: number;
  }
  type RowInfo = {
    id: string;
  }
  type TileData = {
      dense: number[];
      shape: number[];
      tilePos: unknown[];
  };
  type Tile = {
      tileData: TileData;
  };
}

declare module '@higlass/libraries' {
  export * as PIXI from 'pixi.js';
  export * as d3Array from 'd3-array';
  export * as d3Axis from 'd3-axis';
  export * as d3Brush from 'd3-brush';
  export * as d3Color from 'd3-color';
  export * as d3Drag from 'd3-drag';
  export * as d3Dsv from 'd3-dsv';
  export * as d3Format from 'd3-format';
  export * as d3Geo from 'd3-geo';
  export * as d3Scale from 'd3-scale';
  export * as d3Selection from 'd3-selection';
  // export * as d3Queue from 'd3-queue';
  // export * as d3Request from 'd3-request';
  export * as d3Transition from 'd3-transition';
  export * as d3Zoom from 'd3-zoom';
  // minimal typing of https://github.com/taskcluster/slugid/blob/main/slugid.js
  export const slugid: {
      nice(): string;
  };
}

declare module '@higlass/services' {
  import type { Scale, TilesetInfo } from '@higlass/common';

  export const tileProxy: {
      calculateResolution(tilesetInfo: TilesetInfo, zoomLevel: number): number;
      calculateTileAndPosInTile(
          tilesetInfo: TilesetInfo,
          maxDim: number,
          dataStartPos: number,
          zoomLevel: number,
          position: number
      ): [tilePosition: number, positionInTile: number];
      calculateTiles(
          zoomLevel: number,
          scale: Scale,
          minX: number,
          maxX: number,
          maxZoom: number,
          maxDim: number
      ): number[];
      calculateTilesFromResolution(
          resolution: number,
          scale: Scale,
          minX: number,
          maxX: number,
          pixelsPerTile?: number
      ): number[];
      calculateTileWidth(tilesetInfo: TilesetInfo, zoomLevel: number, binsPerTile: number): number;
      calculateZoomLevel(
          scale: Scale,
          minX: number,
          maxX: number,
          binsPerTile?: number
      ): number;
      calculateZoomLevelFromResolutions(resolutions: number[], scale: Scale): number;
      // fetchTilesDebounced();
      // json();
      // text();
      // tileDataToPixData();
  };
}

declare module '@higlass/tracks' {
  // TODO(2022-06-28): type out `BarTrack
  type Track = any;
  export const BarTrack: Track;

  import type { ColorRGBA, Scale, TilesetInfo } from '@higlass/common';
  import type { HiGlassTile } from 'higlass';
  import type * as PIXI from 'pixi.js';

  type Handler = (data: any) => void;

  type Subscription = { event: string; handler: Handler };

  type PubSub = {
      publish(msg: string, data: any): void;
      subscribe(msg: string, handler: Handler): Subscription;
      unsubscribe(msg: string): void;
  };

  type TrackOptions = Record<string, unknown>;

  interface OnMouseMoveZoomOptions {
      trackId: string;
      data: number;
      absX: number;
      absY: number;
      relX: number;
      relY: number;
      dataX: number;
      dataY: number;
  }

  interface OnMouseMoveZoomOptions1D extends OnMouseMoveZoomOptions {
      orientation: '1d-horizontal' | '1d-vertical';
  }

  interface OnMouseMoveZoomOptions2D extends OnMouseMoveZoomOptions {
      orientation: '2d';
      dataLens: ArrayLike<number>;
      dim: number;
      toRgb: ColorRGBA;
      center: [number, number];
      xRange: [number, number];
      yRange: [number, number];
      isGenomicCoords: boolean;
  }

  export type Context<Options> = {
      id: string;
      viewUid: string;
      pubSub: PubSub;
      scene: PIXI.Graphics;
      dataConfig: DataConfig;
      dataFetcher: DataFetcher;
      getLockGroupExtrema(): [min: number, max: number] | null;
      handleTilesetInfoReceived(tilesetInfo: TilesetInfo): void;
      animate(): void;
      svgElement: HTMLElement;
      isValueScaleLocked(): boolean;
      onValueScaleChanged(): void;
      onTrackOptionsChanged(newOptions: Options): void;
      onMouseMoveZoom(opts: OnMouseMoveZoomOptions1D | OnMouseMoveZoomOptions2D): void;
      chromInfoPath: string;
      isShowGlobalMousePosition(): boolean;
      getTheme(): string;
  };

  export class _Track {
      /* Properites */
      id: string;
      _xScale: Scale;
      _yScale: Scale;
      _refXScale: Scale;
      _refYScale: Scale;
      position: [number, number];
      dimensions: [number, number];
      options: TrackOptions;
      pubSubs: Subscription[];
      /* Constructor */
      constructor(props: { id: string; pubSub: PubSub; getTheme?: () => string });
      /* Methods */
      isWithin(x: number, y: number): boolean;
      getProp<Prop extends keyof this>(prop: Prop): this[Prop];
      getData(): void;
      getDimensions(): this['dimensions'];
      getDimensions(newDimensions: [number, number]): void;
      refXScale(): this['_refXScale'];
      refXScale(scale: Scale): void;
      refYScale(): this['_refYScale'];
      refYScale(scale: Scale): void;
      xScale(): this['_xScale'];
      xScale(scale: Scale): void;
      yScale(): this['_yScale'];
      yScale(scale: Scale): void;
      zoomed(xScale: Scale, yScale: Scale): void;
      draw(): void;
      getPosition(): this['position'];
      setPosition(newPosition: [number, number]): void;
      /**
       * A blank handler for MouseMove / Zoom events. Should be overriden
       * by individual tracks to provide
       */
      defaultMouseMoveHandler(evt: MouseEvent): void;
      remove(): void;
      rerender(options?: TrackOptions, force?: boolean): void;
      /**
       * Whether this track should respond to events at this mouse position.
       *
       * The difference to `isWithin()` is that it can be overwritten if a track is inactive for example.
       */
      respondsToPosition(x: number, y: number): boolean;
      zoomedY<T extends Track>(trackY: T, kMultiplier: number): void;
      movedY(dY: number): void;
  }

  type DataConfig = Record<string, any>;
  type DataFetcher = Record<string, any>;

  export class PixiTrack<Options extends TrackOptions> extends _Track {
      /* Properties */
      delayDrawing: boolean;
      scene: PIXI.Graphics;
      pBase: PIXI.Graphics;
      pMasked: PIXI.Graphics;
      pMask: PIXI.Graphics;
      pMain: PIXI.Graphics;
      pBorder: PIXI.Graphics;
      pBackground: PIXI.Graphics;
      pForeground: PIXI.Graphics;
      pLabel: PIXI.Graphics;
      pMobile: PIXI.Graphics;
      pAxis: PIXI.Graphics;
      pMouseOver: PIXI.Graphics;
      options: Options;
      labelTextFontFamily: string;
      labelTextFontSize: number;
      labelXOffset: number;
      labelText: PIXI.Text;
      errorText: PIXI.Text;
      prevOptions: string;
      flipText?: boolean; // Property never assigned https://github.com/higlass/higlass/blob/develop/app/scripts/PixiTrack.js
      /* Constructor */
      constructor(context: Context<Options>, options: Options);
      /* Methods */
      setMask(position: [number, number], dimensions: [number, number]): void;
      getForeground(): void;
      drawBorder(): void;
      drawError(): void;
      drawBackground(): void;
      getLabelColor(): string;
      getName(): string;
      drawLabel(): void;
      rerender(options: Options, force?: boolean): void;
      exportSVG(): [HTMLElement, HTMLElement];
  }

  export class TiledPixiTrack<Options extends TrackOptions> extends PixiTrack<Options> {
    constructor(context: Context<Options>, options: Options);
    renderVersion: number;
    visibleTiles: Set<any>;
    visibleTileIds: Set<string>;
    renderingTiles: Set<any>;
    fetching: Set<any>;
    scale: {};
    fetchedTiles: {[key: string]: HiGlassTile};
    tileGraphics: {};
    maxZoom: number;
    medianVisibleValue: any;
    backgroundTaskScheduler: import("./utils/background-task-scheduler").BackgroundTaskScheduler;
    continuousScaling: boolean;
    valueScaleMin: number;
    fixedValueScaleMin: number;
    valueScaleMax: number;
    fixedValueScaleMax: number;
    listeners: {};
    animate: any;
    onValueScaleChanged: any;
    prevValueScale: any;
    dataFetcher: any;
    tilesetInfo: TilesetInfo;
    uuid: any;
    trackNotFoundText: PIXI.Text;
    refreshTilesDebounced: Function;
    tilesetUid: any;
    server: any;
    chromInfo: any;
    setError(error: any): void;
    errorTextText: any;
    setFixedValueScaleMin(value: any): void;
    setFixedValueScaleMax(value: any): void;
    checkValueScaleLimits(): void;
    /**
     * Register an event listener for track events. Currently, the only supported
     * event is ``dataChanged``.
     *
     * @param {string} event The event to listen for
     * @param {function} callback The callback to call when the event occurs. The
     *  parameters for the event depend on the event called.
     *
     * @example
     *
     *  trackObj.on('dataChanged', (newData) => {
     *   console.log('newData:', newData)
     *  });
     */
    on(event: string, callback: Function): void;
    off(event: any, callback: any): void;
    /**
     * Return the set of ids of all tiles which are both visible and fetched.
     */
    visibleAndFetchedIds(): string[];
    visibleAndFetchedTiles(): any[];
    /**
     * Set which tiles are visible right now.
     *
     * @param tiles: A set of tiles which will be considered the currently visible
     * tile positions.
     */
    setVisibleTiles(tilePositions: any): void;
    removeOldTiles(): void;
    refreshTiles(): void;
    parentInFetched(tile: any): boolean;
    parentTileId(tile: any): string;
    /**
     * Remove obsolete tiles
     *
     * @param toRemoveIds: An array of tile ids to remove from the list of fetched tiles.
     */
    removeTiles(toRemoveIds: any): void;
    zoomed(newXScale: Scale, newYScale: Scale, k?: number, tx?: number, ty?: number): void;
    /**
     * Check to see if all the visible tiles are loaded.
     *
     * If they are, remove all other tiles.
     */
    areAllVisibleTilesLoaded(): boolean;
    /**
     * Function is called when all tiles that should be visible have
     * been received.
     */
    allTilesLoaded(): void;
    minValue(_: any): any;
    maxValue(_: any): any;
    minRawValue(): any;
    maxRawValue(): any;
    initTile(): void;
    updateTile(): void;
    destroyTile(): void;
    addMissingGraphics(): void;
    /**
     * Change the graphics for existing tiles
     */
    updateExistingGraphics(): void;
    synchronizeTilesAndGraphics(): void;
    loadTileData(tile: any, dataLoader: any): any;
    fetchNewTiles(toFetch: any): void;
    /**
     * We've gotten a bunch of tiles from the server in
     * response to a request from fetchTiles.
     */
    receivedTiles(loadedTiles: any): void;
    /**
     * Draw a tile on some graphics
     */
    drawTile(): void;
    calculateMedianVisibleValue(): any;
    allVisibleValues(): any[];
    minVisibleValue(ignoreFixedScale?: boolean): number;
    minVisibleValueInTiles(ignoreFixedScale?: boolean): number;
    maxVisibleValue(ignoreFixedScale?: boolean): number;
    maxVisibleValueInTiles(ignoreFixedScale?: boolean): number;
    makeValueScale(minValue: any, medianValue: any, maxValue: any, inMargin: any): any[];
  }

  export class Tiled1DPixiTrack<Options extends TrackOptions> extends TiledPixiTrack<Options> {
    constructor(context: Context<Options>, options: Options);
    onMouseMoveZoom: any;
    isValueScaleLocked: any;
    getLockGroupExtrema: any;
    initTile(tile: any): void;
    tileToLocalId(tile: any): string;
    tileToRemoteId(tile: any): string;
    relevantScale(): any;
    setVisibleTiles(tilePositions: any): void;
    calculateVisibleTiles(): void;
    zoomLevel: any;
    getTilePosAndDimensions(zoomLevel: any, tilePos: any, binsPerTileIn: any): {
        tileX: any;
        tileY: any;
        tileWidth: number;
        tileHeight: number;
    };
    updateTile(tile: any): void;
    scheduleRerender(): void;
    handleRerender(): void;
    getIndicesOfVisibleDataInTile(tile: any): number[];
    /**
     * Return an aggregated visible value. For example, the minimum or maximum.
     *
     * @description
     *   The difference to `minVisibleValueInTiles`
     *   is that the truly visible min or max value is returned instead of the
     *   min or max value of the tile. The latter is not necessarily visible.
     *
     *   For 'min' and 'max' this is identical to minVisibleValue and maxVisibleValue
     *
     * @param  {string} aggregator Aggregation method. Currently supports `min`
     *   and `max` only.
     * @return {number} The aggregated value.
     */
    getAggregatedVisibleValue(aggregator?: string): number;
    /**
     * Get the data value at a relative pixel position
     * @param   {number}  relPos  Relative pixel position, where 0 indicates the
     *   start of the track
     * @return  {number}  The data value at `relPos`
     */
    getDataAtPos(relPos: number): number;
    mouseMoveHandler({ x, y }?: {
        x: any;
        y: any;
    }): void;
    mouseX: any;
    mouseY: any;
    mouseMoveZoomHandler(): void;
    zoomed(...args: any[]): void;
  }

  export class HorizontalTiled1DPixiTrack<Options extends TrackOptions> extends Tiled1DPixiTrack<Options> {
    constructor(context: Context<Options>, options: Options);
    constIndicator: PIXI.Graphics;
    axis: AxisPixi;
    isShowGlobalMousePosition: any;
    hideMousePosition: Function;
    rerender(options: any, force: any): void;
    calculateZoomLevel(): any;
    drawAxis(valueScale: Scale): void;
    mouseMoveZoomHandler(absX?: any, absY?: any): void;
    drawConstIndicator(): void;
  }

  export class HorizontalLine1DPixiTrack<Options extends TrackOptions> extends HorizontalTiled1DPixiTrack<Options> {
    constructor(context: Context<Options>, options: Options);
    stopHover(): void;
    /**
     * @param _trackY Unused. Added manually for extensibility of subclasses.
     */
    getMouseOverHtml(trackX: number, _trackY: number): string;
    renderTile(tile: HiGlassTile): void;
    drawTile(tile: HiGlassTile): void;
    valueScale: Scale;
    zoomed(newXScale: Scale, newYScale: Scale): void;
    superSVG(): any[];
  }

  export function getValueScale(scalingType: string, minValue: number, pseudocountIn: any, maxValue: number, defaultScaling: string): any[];

  /* eslint-disable-next-line @typescript-eslint/ban-types */
  type LiteralUnion<T, U = string> = T | (U & {});

  type Orientation = '2d' | '1d-vertical' | '1d-horizontal' | 'whole' | 'any';

  type DataType =
      | 'map-tiles'
      | 'axis'
      | 'x-coord'
      | 'y-coord'
      | 'xy-coord'
      | 'matrix'
      | 'vector'
      | 'multivec'
      | 'bed-value'
      | 'stacked-interval'
      | '1d-projection'
      | '2d-projection'
      | 'gene-annotation'
      | 'arrowhead-domains'
      | '2d-rectangle-domains'
      | 'nothing'
      | '2d-annotations'
      | 'bedpe'
      | 'any'
      | 'chromsizes'
      | '1d-tiles'
      | 'image-tiles'
      | 'bedlike';

  type OptionsInfo<Options> = {
      [Key in keyof Options]?: {
          name: string;
          inlineOptions: Record<string, { name: string; value: Options[Key] }>;
      };
  };

  export type TrackConfig<Options extends TrackOptions> = {
      type: string;
      defaultOptions?: Options;
      availableOptions?: (keyof Options)[];
      name?: string;
      datatype?: readonly LiteralUnion<DataType>[];
      aliases?: string[];
      local?: boolean;
      orientation?: Orientation;
      thumbnail?: Element;
      chromInfoPath?: string;
      optionsInfo?: OptionsInfo<Options>;
  };
}

declare module '@higlass/utils' {
  import type { Scale, ColorRGBA, ColorRGB, TilesetInfo} from '@higlass/common';

  type ChromInfo<Name extends string = string> = {
      cumPositions: { id?: number; pos: number; chr: string }[];
      chrPositions: Record<Name, { pos: number }>;
      chromLengths: Record<Name, number>;
      totalLength: number;
  };

  /**
   * @param context Class context, i.e., `this`.
   * @param is2d If `true` both dimensions of the mouse location should be shown. E.g., on a central track.
   * @param isGlobal  If `true` local and global events will trigger the mouse position drawing.
   * @return  {Function}  Method to remove graphics showing the mouse location.
   */
  export function showMousePosition<T>(context: T, is2d?: boolean, isGlobal?: boolean): () => void;
  export function absToChr(
      absPosition: number,
      chrInfo: Pick<ChromInfo, 'cumPositions' | 'chromLengths'>
  ): [chr: string, chrPositon: number, offset: number, insertPoint: number];
  export function chrToAbs<Name>(
      chrom: Name,
      chromPos: number,
      chromInfo: Pick<ChromInfo<Name>, 'chrPositions'>
  ): number;
  export function colorToHex(colorValue: string): number;
  export function colorToRgba(colorValue: string): ColorRGBA;
  export function pixiTextToSvg(text: import('pixi.js').Text): HTMLElement;
  export function svgLine(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      strokeWidth: number,
      strokeColor: number
  ): HTMLElement;
  export class DenseDataExtrema1D {
      constructor(arr: ArrayLike<number | null>);
      minNonZeroInTile: number;
      maxNonZeroInTile: number;
  }
  export const trackUtils: {
      calculate1DVisibleTiles(
          tilesetInfo: TilesetInfo,
          scale: Scale
      ): [zoomLevel: number, x: number][];
  };
}

declare module 'higlass' {
  function ChromosomeInfo(source: string): Promise<ChromosomeInfoResult>;
  class ChromosomeInfoResult {
    /** Mapping of chromosome to ChromosomePosition object */
    chrPositions: { [key: string]: ChromosomePosition };

    chromLengths: { [key: string]: number };

    cumPositions: ChromosomePosition[];

    totalLength: number;
    absToChr(absPos: number): number[];
  }
  type ChromosomePosition = {
    id: number;
    chr: string;
    pos: number;
  };

  type HiGlassTile = {
    tileId: string;
    remoteId: string;
    graphics: PIXI.Graphics;
    segments: [],
    tileData: HiGlassTileData
  }

  type HiGlassTileData = {
    binXPos: number[];
    coarseShape: number[];
    dense: Float32Array;
    denseDataExtrema: DenseDataExtrema1D
    dtype: string
    maxNonZero: number
    maxValueByRow: number[]
    minNonZero: number
    server: string
    shape: number[]
    tileId: string
    tilePos: number[]
    tilePositionId: string
    tilesetUid: string
    valuesByRow: number[][]
    zoomLevel: number
  }

  type DenseDataExtrema1D = {
    data: number[]
    epsilon: number
    maxNonZeroInTile: number
    minNonZeroInTile: number
    numSubsets: number
    paddedTileSize: number
    subsetMaximums: number[]
    subsetMinimums: number[]
    subsetSize: number
    tileSize: number
  }

  interface HiGlassComponentProps {
    viewConfig: ViewConfig;
    options: HiGlassComponentOptions;
  }
  interface HiGlassComponentOptions {
    sizeMode: HiGlassComponentSizeMode;
    globalMousePosition: boolean;
    pixelPreciseMarginPadding?: true;
    containerPaddingX?: number;
    containerPaddingY?: number;
    viewMarginTop?: number;
    viewMarginBottom?: number;
    viewMarginLeft?: number;
    viewMarginRight?: number;
    viewPaddingTop?: number;
    viewPaddingBottom?: number;
    viewPaddingLeft?: number;
    viewPaddingRight?: number;
  }
  type HiGlassComponentSizeMode = 'bounded' | 'scroll'; // Make string union of any other size modes
  class HiGlassComponent extends React.Component<HiGlassComponentProps> {
    api: HiGlassApi;

    element: Element;
  }

  type HiGlassApiEventType =
    | 'click'
    | 'cursorLocation'
    | 'location'
    | 'rangeSelection'
    | 'viewConfig'
    | 'mouseMoveZoom'
    | 'createSVG';
  type HiGlassApiLocationEventData = {
    xDomain: [number, number];
    xRange: [number, number];
    yDomain: [number, number];
    yRange: [number, number];
  };
  type HiGlassApiClickEventData = {
    type: string;
    event: object;
    payload: any;
  };
  type HiGlassApiRangeSelectionEventData = {
    dataRange: [[number, number], [number, number] | null];
    genomicRange: [
      [string, number, string, number],
      [string, number, string, number] | null
    ];
  };
  // Warning! Copied from `pub-sub-es.d.ts` because not sure how to import from sibling declaration file
  type PubSubSubscribeFnResult = { event: string; handler: Function };
  enum HiGlassApiMouseTool {
    /** Defaults to pan&zoom */
    DEFAULT = 'default',
    SELECT = 'select',
    PAN_ZOOM = 'panZoom',
  }
  class HiGlassApi {
    /**
     * Force integer range selections.
     *
     * @example
     * hgv.activateTool('select'); // Activate select tool
     * hgv.setRangeSelectionToFloat(); // Allow float range selections
     */
    setRangeSelectionToInt(): void;

    getComponent(): HiGlassComponent;

    /**
     * Some tools needs conflicting mouse events such as mousedown or mousemove. To
     * avoid complicated triggers for certain actions HiGlass supports different mouse
     * tools for different interactions. The default mouse tool enables pan&zoom. The
     * only other mouse tool available right now is ``select``, which lets you brush
     * on to a track to select a range for annotating regions.
     *
     * @param {string} [mouseTool='']  Select a mouse tool to use. Currently there
     * only 'default' and 'select' are available.
     *
     * @example
     *
     * hgv.activateTool('select'); // Select tool is active
     * hgv.activateTool(); // Default pan&zoom tool is active
     */
    activateTool(tool?: HiGlassApiMouseTool): void;

    /**
     * Cancel a subscription.
     *
     * @param {string} event One of the available events
     * @param {object|string} listenerId The id of the listener to unsubscribe or an object containing the listenerId in the 'callback' property
     * @param {string} viewId The viewId to unsubscribe it from (not strictly necessary except for 'location' events)
     * The variables used in the following examples are coming from the examples of ``on()``.
     *
     * @example
     *
     * hgv.off('location', listener, 'viewId1');
     * hgv.off('rangeSelection', rangeListener);
     * hgv.off('viewConfig', viewConfigListener);
     * hgv.off('mouseMoveZoom', mmz);
     * hgv.off('wheel', wheelListener);
     * hgv.off('createSVG');
     * hgv.off('geneSearch', geneSearchListener);
     */
    off(event: string, listenerId: object | string, viewId?: string): void;

    /**
     * Destroy HiGlass instance
     */
    destroy(): void;

    /**
     * Subscribe to events
     *
     *
     * HiGlass exposes the following event, which one can subscribe to via this method:
     *
     * - location
     * - rangeSelection
     * - viewConfig
     * - mouseMoveZoom
     *
     * **Event types**
     *
     * ``click``: Returns clicked objects. (Currently only clicks on 1D annotations are captured.)
     *
     * .. code-block:: javascript
     *
     *     {
     *       type: 'annotation',
     *       event: { ... },
     *       payload: [230000000, 561000000]
     *     }
     *
     * ``cursorLocation:`` Returns an object describing the location under the cursor
     *
     * .. code-block:: javascript
     *
     *    {
     *        absX: 100,
     *        absY: 200,
     *        relX: 50,
     *        relY: 150,
     *        relTrackX: 50,
     *        relTrackY: 100,
     *        dataX: 10000,
     *        dataY: 123456,
     *        isFrom2dTrack: false,
     *        isFromVerticalTrack: false,
     *    }
     *
     * ``location:`` Returns an object describing the visible region
     *
     * .. code-block:: javascript
     *
     *    {
     *        xDomain: [1347750580.3773856, 1948723324.787681],
     *        xRange: [0, 346],
     *        yDomain: [1856870481.5391564, 2407472678.0075483],
     *        yRange: [0, 317]
     *    }
     *
     * ``rangeSelection:`` Returns a BED- (1D) or BEDPE (2d) array of the selected data and
     * genomic range (if chrom-sizes are available)
     *
     * .. code-block:: javascript
     *
     *  // Global output
     *  {
     *    dataRange: [...]
     *    genomicRange: [...]
     *  }
     *
     *  // 1D data range
     *  [[1218210862, 1528541001], null]
     *
     *  // 2D data range
     *  [[1218210862, 1528541001], [1218210862, 1528541001]]
     *
     *  // 1D or BED-like array
     *  [["chr1", 249200621, "chrM", 50000], null]
     *
     *  // 2D or BEDPE-like array
     *  [["chr1", 249200621, "chr2", 50000], ["chr3", 197972430, "chr4", 50000]]
     *
     * ``viewConfig:`` Returns the current view config (as a string).
     *  This event is published upon interactions including:
     *  - Saving in the view config editor modal.
     *  - Panning and zooming in views, which update view object ``initialXDomain`` and ``initialYDomain`` values.
     *  - Brushing in ``viewport-projection-`` tracks containing null ``fromViewUid`` fields, which update track object ``projectionXDomain`` and ``projectionYDomain`` values.
     *
     * ``mouseMoveZoom:`` Returns the location and data at the mouse cursor's
     * screen location.
     *
     * .. code-block:: javascript
     *
     *  {
     *    // Float value of the hovering track
     *    data,
     *    // Absolute x screen position of the cursor in px
     *    absX,
     *    // Absolute y screen position of the cursor in px
     *    absY,
     *    // X screen position of the cursor in px relative to the track extent.
     *    relX,
     *    // Y screen position of the cursor in px relative to the track extent.
     *    relY,
     *    // Data x position of the cursor relative to the track's data.
     *    dataX,
     *    // Data y position of the cursor relative to the track's data.
     *    dataY,
     *    // Track orientation, i.e., '1d-horizontal', '1d-vertical', or '2d'
     *    orientation: '1d-horizontal',
     *
     *    // The following properties are only returned when hovering 2D tracks:
     *    // Raw Float32Array
     *    dataLens,
     *    // Dimension of the lens, e.g., 3 (the lens is squared so `3` corresponds
     *    // to a 3x3 matrix represented by an array of length 9)
     *    dim,
     *    // Function for converting the raw data values to rgb values
     *    toRgb,
     *    // Center position of the data or genomic position (as a BED array)
     *    center,
     *    // Range of the x data or genomic position (as a BEDPE array)
     *    xRange,
     *    // Range of the y data or genomic position (as a BEDPE array)
     *    yRange,
     *    // If `true` `center`, `xRange`, and `yRange` are given in genomic positions
     *    isGenomicCoords
     *  }
     *
     * ``createSVG:`` Set a callback to obtain the current exported SVG DOM node,
     *                and potentially return a manipulated SVG DOM node.
     *
     * @param {string} event One of the events described below
     *
     * @param {function} callback A callback to be called when the event occurs
     *
     * @param {string} viewId The view ID to listen to events
     *
     * @example
     *
     * let locationListenerId;
     * hgv.on(
     *   'location',
     *   location => console.log('Here we are:', location),
     *   'viewId1',
     *   listenerId => locationListenerId = listenerId
     * );
     *
     * const rangeListenerId = hgv.on(
     *   'rangeSelection',
     *   range => console.log('Selected', range)
     * );
     *
     * const viewConfigListenerId = hgv.on(
     *   'viewConfig',
     *   range => console.log('Selected', range)
     * );
     *
     * const mmz = event => console.log('Moved', event);
     * hgv.on('mouseMoveZoom', mmz);
     *
     * const wheelListener = event => console.log('Wheel', event);
     * hgv.on('wheel', wheelListener);
     *
     * hgv.on('createSVG', (svg) => {
     *    const circle = document.createElement('circle');
     *    circle.setAttribute('cx', 100);
     *    circle.setAttribute('cy', 100);
     *    circle.setAttribute('r', 50);
     *    circle.setAttribute('fill', 'green');
     *    svg.appendChild(circle);
     *    return svg;
     * });
     *
     * const geneSearchListener = event => {
     *    console.log('Gene searched', event.geneSymbol);
     *    console.log('Range of the gene', event.range);
     *    console.log('Center of the gene', event.centerX);
     * }
     * hgv.on('geneSearch', geneSearchListener);
     */
    on(
      event: HiGlassApiEventType,
      callback: Function,
      viewId?: string,
      callbackId?: string
    ): PubSubSubscribeFnResult;
  }

  type HiGlassPluginInfo = {
    chromosomes: HiGlassChromosomes;
    libraries: HiGLassLibraries;
    tracks: HiGlassTracks;
    dataFetchers;
    factories;
    services;
    utils;
    configs;
    // Defined globally by webpack.
    VERSION: string;
  };


}
