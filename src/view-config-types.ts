export type ViewConfig = {
  editable: boolean;
  trackSourceServers: string[];
  views: View[];
};

export type View = {
  uid: string;
  initialXDomain: [number, number];
  initialYDomain: [number, number];
  genomePositionSearchBox: GenomePositionSearchBox;
  chromInfoPath: string;
  tracks: {
    top?: Track[];
    left?: Track[];
    center?: Track[];
    bottom?: Track[];
    right?: Track[];
  };
  overlays: Overlay[];
  metaTracks: MetaTrack[];
  layout: {
    w: number;
    h: number;
    x: number;
    y: number;
  };
};

export type GenomePositionSearchBox = {
  autocompleteServer: string;
  autocompleteId: string;
  chromInfoServer: string;
  chromInfoId: string;
  visible: boolean;
};

export const enum TrackType {
  /** https://docs.higlass.io/track_types.html#bed-like */
  BEDLIKE = 'bedlike',
  /** https://docs.higlass.io/track_types.html#empty */
  EMPTY = 'empty',
  /** https://docs.higlass.io/track_types.html#gene-annotations */
  GENE_ANNOTATIONS = 'gene-annotations',
  /** https://docs.higlass.io/track_types.html#heatmap */
  HEATMAP = 'heatmap',
  /** https://docs.higlass.io/track_types.html#rotated-2d-heatmap */
  ROTATED_HEATMAP = 'linear-heatmap',
  /** https://docs.higlass.io/track_types.html#linear-2d-rectangle-domain */
  LINEAR_RECTANGLE_DOMAIN = 'linear-2d-rectangle-domains',
  /** https://docs.higlass.io/track_types.html#line */
  LINE = 'line',
  /** https://docs.higlass.io/track_types.html#bar */
  BAR = 'bar',
  /** https://docs.higlass.io/track_types.html#point */
  POINT = 'point',
  /** https://docs.higlass.io/track_types.html#d-heatmap */
  HEATMAP_1D = '1d-heatmap',
  /** https://docs.higlass.io/track_types.html#chromosome-labels */
  CHROMOSOME_LABELS = 'chromosome-labes',
  /** https://docs.higlass.io/track_types.html#chromosome-grid */
  CHROMOSOME_GRID = '2d-chromosome-grid',
  /** https://docs.higlass.io/track_types.html#horizontal-chromosome-grid */
  HORIZONTAL_CHROMOSOME_GRID = 'chromosome-labels',
  /** https://docs.higlass.io/track_types.html#stacked-bars */
  STACKED_BAR = 'stacked-bar',
  /** https://docs.higlass.io/track_types.html#multiple-lines */
  MULTIPLE_LINE = 'basic-multiple-line-chart',
  /** https://docs.higlass.io/track_types.html#multiple-bar-charts */
  MULTIPLE_BAR = 'basic-multiple-bar-chart',
  /** https://docs.higlass.io/track_types.html#d-annotations */
  ANNOTATION_1D = '1d-annotations',
  /** https://docs.higlass.io/track_types.html#multivec */
  MULTIVEC = 'multivec',
  /** https://docs.higlass.io/track_types.html#viewport-projection */
  HORIZONTAL_VIEWPORT_PROJ = 'viewport-projection-horizontal',
  /** https://docs.higlass.io/track_types.html#viewport-projection */
  VERTICAL_VIEWPORT_PROJ = 'viewport-projection-vertical',
  COMBINED = 'combined',
  HORIZONTAL_CHROMOSOME_LABELS = 'horizontal-chromosome-labels',
  HORIZONTAL_GENE_ANNOTATIONS = 'horizontal-gene-annotations',
  TSS = 'tss',
  POINT_ANNOTATION = 'point-annotation',
  ARCS_1D = '1d-arcs',
  STRATIFIED_BED = 'stratified-bed',
}

export type TrackLabelPosition = 'topLeft' | 'topRight' | 'hidden';

export type Alignment = 'left' | 'right';

export type Track =
  | CombinedTrack
  | ViewportProjectionTrack
  | HorizontalGeneAnnotationTrack
  | TranscriptionStartSiteTrack
  | PointAnnotationTrack
  | OneDimensionalArcTrack
  | StackedBarTrack
  | StratifiedBedTrack
  | HorizontalChromosomeLabelTrack;

export type TrackCommon = {
  uid: string;
  height: number;
  server?: string;
  tilesetUid?: string;
};

export type CombinedTrack = {
  type: TrackType.COMBINED;
  uid: string;
  height: number;
  contents: Track[];
};

export type ViewportProjectionTrack = TrackCommon & {
  type: TrackType.HORIZONTAL_VIEWPORT_PROJ;
  /**
   * The uid of the linked view, from which this track will obtain its domain.
   * If null, then the projectionXDomain and/or projectionYDomain properties
   * must be used instead.
   */
  fromViewUid?: string;
  /**
   * The x domain coordinates that define the selected interval. Only used
   *  if fromViewUid is null.
   */
  projectionXDomain?: [number, number];
  /**
   * The y domain coordinates that define the selected interval. Only used
   * if fromViewUid is null.
   */
  projectionYDomain?: [number, number];
  options?: ViewportProjectionTrackOptions;
};

export type ViewportProjectionTrackOptions = {
  /** The fill color for the brush selection rect element. */
  projectionFillColor?: string;
  /** The stroke color for the brush selection rect element. */
  projectionStrokeColor?: string;
  /** The opacity for the fill of the brush selection rect element. */
  projectionFillOpacity?: number;
  /** The opacity for the stroke of the brush selection rect element. */
  projectionStrokeOpacity?: number;
  /** The stroke width for the brush selection rect element. */
  strokeWidth?: number;
};

export type HorizontalChromosomeLabelTrack = TrackCommon & {
  type: TrackType.HORIZONTAL_CHROMOSOME_LABELS;
  options: HorizontalChromosomeLabelTrackOptions;
};

export type HorizontalChromosomeLabelTrackOptions = {
  color: string;
  stroke: string;
  fontSize: number;
  fontIsLeftAligned: boolean;
  showMousePosition: boolean;
  mousePositionColor: string;
};

export type HorizontalGeneAnnotationTrack = TrackCommon & {
  type: TrackType.HORIZONTAL_GENE_ANNOTATIONS;
  options: HorizontalGeneAnnotationTrackOptions;
};

export type HorizontalGeneAnnotationTrackOptions = {
  fontSize: number;
  plusStrandColor: string;
  minusStrandColor: string;
  geneAnnotationHeight: number;
  geneLabelPosition: string;
  geneStrandSpacing: number;
  showMousePosition: boolean;
  showGlobalMousePosition: boolean;
  mousePositionColor: string;
};

export type TranscriptionStartSiteTrack = TrackCommon & {
  type: TrackType.TSS;
  options: TranscriptionStartSiteTrackTrackOptions;
};

export type TranscriptionStartSiteTrackTrackOptions = {
  fontSize: number;
  plusStrandColor: string;
  minusStrandColor: string;
  geneAnnotationHeight: number;
  geneLabelPosition: string;
  geneStrandSpacing: number;
  maxPerTile: number;
};

export type PointAnnotationTrack = TrackCommon & {
  type: TrackType.POINT_ANNOTATION;
  options: PointAnnotationTrackOptions;
};

export type PointAnnotationTrackOptions = {
  axisPositionHorizontal: Alignment;
  markColor: string;
  markColorFocus: string;
  markSize: number;
  markOpacity: number;
  markOpacityFocus: number;
  valueColumn: number;
  focusRegion?: [number, number];
  name: string;
  labelPosition: TrackLabelPosition;
  labelColor: string;
  labelOpacity?: number;
  showMousePosition: boolean;
  showGlobalMousePosition: boolean;
  mousePositionColor: string;
  toolTip: {
    name: {
      field: number;
    };
    value: {
      field: number;
      numDecimals: number;
    };
    other: [
      {
        label: string;
        field: number;
        numDecimals: number;
      }
    ];
  };
};

export type OneDimensionalArcTrack = TrackCommon & {
  type: TrackType.ARCS_1D;
  options: OneDimensionalArcTrackOptions;
};

export type OneDimensionalArcTrackOptions = {
  labelPosition: TrackLabelPosition;
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
  arcStyle: string;
  startField: number;
  endField: number;
  filter: {
    set: string[];
    field: number;
  };
};

export type StackedBarTrack = TrackCommon & {
  type: TrackType.STACKED_BAR;
  options: StackedBarTrackOptions;
};

export type StackedBarTrackOptions = {
  binSize: number;
  axisAlign: Alignment;
  axisPositionHorizontal: Alignment;
  labelPosition: TrackLabelPosition;
  markColor: string;
  markColorFocus: string;
  markSize: number;
  markOpacity: number;
  labelColor: string;
  offsetField: number;
  startField: number;
  endField: number;
  importanceField: number;
  importanceDomain: [number, number];
  focusRegion: [number, number];
  name: string;
  stratification: Stratification;
  showMousePosition: boolean;
  showGlobalMousePosition: boolean;
  mousePositionColor: string;
};

export type Stratification = {
  categoryField: number;
  axisShowGroupSeparator: boolean;
  axisNoGroupColor: boolean;
  groups: {
    label: string;
    categories: string[];
  }[];
};

export type StratifiedBedTrack = TrackCommon & {
  type: TrackType.STRATIFIED_BED;
  options: StratifiedBedTrackOptions;
};

export type StratifiedBedTrackOptions = {
  axisAlign: Alignment;
  legendAlign: Alignment;
  labelPosition: TrackLabelPosition;
  markColor: string;
  markColorHighlight: string;
  markColorDehighlight: string;
  markSize: number;
  markMinWidth: number;
  markHeight: number;
  rowHeight: number;
  markOpacity: number;
  // TODO: Add union of options when found
  arcStyle: 'indicator';
  // TODO: Add union of options when found
  indicatorStyle: 'category-rect';
  labelColor: string;
  geneField: number;
  importanceField: number;
  importanceDomain: [number, number];
  name: string;
  axisPositionHorizontal: Alignment;
  stratification: Stratification;
  showMousePosition: boolean;
  showGlobalMousePosition: boolean;
  mousePositionColor: string;
};

export type Overlay = {
  uid: string;
  includes: string[];
  options: {
    extent: number[][];
    minWidth: number;
    fill: string;
    fillOpacity: number;
    strokeWidth: number;
    stroke?: string;
    outline?: string;
    outlineOpacity?: number;
    outlineWidth?: number;
    outlinePos?: Alignment[];
  };
};

export type MetaTrack = {
  uid: string;
  type: string;
  overlaysTrack: string;
  options: {
    annotationTracks: string[];
  };
};