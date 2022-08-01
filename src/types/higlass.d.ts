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
}
