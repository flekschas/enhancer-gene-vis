import {
  ABC_SCORE_COLUMN,
  BIOSAMPLE_COLUMN,
  DEFAULT_STRATIFICATION,
  EG_TILE_UID,
  EG_TILE_V3,
  GENE_NAME_COLUMN,
  SAMPLES,
} from './constants';

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
  focusRegion: [number, number];
  name: string;
  labelPosition: TrackLabelPosition;
  labelColor: string;
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

export const DEFAULT_X_DOMAIN_START = 1761366260;
export const DEFAULT_X_DOMAIN_END = 1761603836;
export const ENHANCER_START_COLUMN = 1; // V2 & V3
export const TSS_CHROM_COLUMN = EG_TILE_V3 ? 0 : 3;
export const TSS_START_COLUMN = 4; // V2 & V3
export const TSS_END_COLUMN = EG_TILE_V3 ? 4 : 5;
export const DEFAULT_VIEW_CONFIG_ENHANCER: ViewConfig = {
  editable: false,
  trackSourceServers: ['//higlass.io/api/v1'],
  views: [
    {
      uid: 'context',
      genomePositionSearchBox: {
        autocompleteServer: '//higlass.io/api/v1',
        autocompleteId: 'OHJakQICQD6gTD7skx4EWA',
        chromInfoServer: '//higlass.io/api/v1',
        chromInfoId: 'hg19',
        visible: true,
      },
      chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
      tracks: {
        top: [
          {
            type: TrackType.COMBINED,
            uid: 'chroms-viewport',
            height: 12,
            contents: [
              {
                type: TrackType.HORIZONTAL_CHROMOSOME_LABELS,
                options: {
                  // tickPositions: 'ends',
                  color: '#999999',
                  stroke: 'white',
                  fontSize: 10,
                  fontIsLeftAligned: true,
                  showMousePosition: false,
                  mousePositionColor: '#000000',
                },
                tilesetUid: 'ADfY_RtsQR6oKOMyrq6qhw',
                height: 12,
                server: 'https://resgen.io/api/v1',
                uid: 'chroms',
              },
              {
                uid: 'viewport-details-chroms',
                type: TrackType.HORIZONTAL_VIEWPORT_PROJ,
                fromViewUid: 'details',
                height: 12,
                options: {
                  projectionFillColor: '#cc0078',
                  projectionStrokeColor: '#cc0078',
                  projectionFillOpacity: 0.3,
                  projectionStrokeOpacity: 0.3,
                  strokeWidth: 1,
                },
              },
            ],
          },
          {
            type: TrackType.COMBINED,
            uid: 'genes-tss-viewport',
            height: 48,
            contents: [
              {
                type: TrackType.HORIZONTAL_GENE_ANNOTATIONS,
                uid: 'genes',
                height: 48,
                server: 'https://resgen.io/api/v1',
                tilesetUid: 'NCifnbrKQu6j-ohVWJLoJw',
                options: {
                  fontSize: 9,
                  plusStrandColor: 'black',
                  minusStrandColor: 'black',
                  geneAnnotationHeight: 10,
                  geneLabelPosition: 'outside',
                  geneStrandSpacing: 0.5,
                  showMousePosition: true,
                  showGlobalMousePosition: true,
                  mousePositionColor: 'black',
                },
              },
              {
                type: TrackType.TSS,
                uid: 'tss',
                height: 48,
                // server: 'http://localhost:9876/api/v1',
                // tilesetUid: 'RefSeqCurated170308bedCollapsedGeneBoundsTSS500bp',
                server: 'https://resgen.io/api/v1',
                // tilesetUid: 'VMZDLKrtQDmJMSjg7Ds4yA',
                tilesetUid: 'QRtec09sQjuVmUaB_uUFEw', // with scores for prioritization
                options: {
                  fontSize: 9,
                  plusStrandColor: 'black',
                  minusStrandColor: 'black',
                  geneAnnotationHeight: 12,
                  geneLabelPosition: 'outside',
                  geneStrandSpacing: 2,
                  maxPerTile: 25,
                },
              },
              {
                uid: 'viewport-details-genes',
                type: TrackType.HORIZONTAL_VIEWPORT_PROJ,
                fromViewUid: 'details',
                height: 48,
                options: {
                  projectionFillColor: '#cc0078',
                  projectionStrokeColor: '#cc0078',
                  projectionFillOpacity: 0.3,
                  projectionStrokeOpacity: 0.3,
                  strokeWidth: 1,
                },
              },
            ],
          },
          {
            type: TrackType.COMBINED,
            uid: 'variants',
            height: 32,
            contents: [
              {
                type: TrackType.POINT_ANNOTATION,
                uid: 'ibd-snps',
                // server: 'http://localhost:9876/api/v1',
                // tilesetUid: 'IBDCombinedset1-2variantonly-pval',
                server: 'https://resgen.io/api/v1',
                tilesetUid: 'VF5-RDXWTxidGMJU7FeaxA',
                height: 32,
                options: {
                  axisPositionHorizontal: 'right',
                  markColor: 'black',
                  markColorFocus: '#cc0078',
                  markSize: 2,
                  markOpacity: 0.33,
                  markOpacityFocus: 0.66,
                  // axisPositionHorizontal: 'right',
                  valueColumn: 7,
                  focusRegion: [
                    1680373143 + 81046453 - 25,
                    1680373143 + 81046453 + 25,
                  ],
                  name: 'IBD Variants',
                  labelPosition: 'topLeft',
                  labelColor: '#757575',
                  showMousePosition: true,
                  showGlobalMousePosition: true,
                  mousePositionColor: 'black',
                  toolTip: {
                    name: {
                      field: 3,
                    },
                    value: {
                      field: 6,
                      numDecimals: 2,
                    },
                    other: [
                      {
                        label: 'Post. Prob.',
                        field: 7,
                        numDecimals: 2,
                      },
                    ],
                  },
                },
              },
            ],
          },
          {
            type: TrackType.COMBINED,
            uid: 'arcs-stacked-bars',
            height: 72,
            contents: [
              {
                type: TrackType.ARCS_1D,
                uid: 'arcs',
                server: 'https://resgen.io/api/v1',
                tilesetUid: EG_TILE_UID,
                height: 72,
                options: {
                  labelPosition: 'hidden',
                  strokeColor: '#808080',
                  strokeWidth: 1,
                  strokeOpacity: 0.05,
                  arcStyle: 'circle',
                  startField: ENHANCER_START_COLUMN,
                  endField: TSS_START_COLUMN,
                  filter: {
                    set: SAMPLES,
                    field: BIOSAMPLE_COLUMN,
                  },
                },
              },
              {
                type: TrackType.STACKED_BAR,
                // server: 'http://localhost:9876/api/v1',
                // tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2hg19beddb',
                // tilesetUid:
                //   'AllPredictionsAvgHiCABC0015minus150ForABCPaperV3txtsimplifiedgzhg19beddb',
                server: 'https://resgen.io/api/v1',
                // tilesetUid: 'P0Ng5fhvQWeO7dlpx0FknA', // all chroms
                // tilesetUid: 'PGXLE50tQyOayNXKUnX4fQ', // just chr10
                // tilesetUid: 'AaJojHeORzKyiag1pSlAag', // bed
                tilesetUid: EG_TILE_UID,
                height: 72,
                uid: 'stacked-bars',
                options: {
                  binSize: 4,
                  axisAlign: 'right',
                  axisPositionHorizontal: 'right',
                  labelPosition: 'topLeft',
                  markColor: 'black',
                  markColorFocus: '#cc0078',
                  markSize: 4,
                  markOpacity: 0.33,
                  labelColor: 'black',
                  offsetField: TSS_CHROM_COLUMN,
                  startField: TSS_START_COLUMN,
                  endField: TSS_END_COLUMN,
                  importanceField: ABC_SCORE_COLUMN,
                  importanceDomain: [0, 1],
                  focusRegion: [
                    1680373143 + 81046453 - 25,
                    1680373143 + 81046453 + 25,
                  ],
                  name: 'Enhancer regions',
                  stratification: DEFAULT_STRATIFICATION,
                  showMousePosition: true,
                  showGlobalMousePosition: true,
                  mousePositionColor: 'black',
                },
              },
            ],
          },
          {
            type: TrackType.STRATIFIED_BED,
            // server: 'http://localhost:9876/api/v1',
            // tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2hg19beddb',
            // tilesetUid:
            //   'AllPredictionsAvgHiCABC0015minus150ForABCPaperV3txtsimplifiedgzhg19beddb',
            server: 'https://resgen.io/api/v1',
            // tilesetUid: 'P0Ng5fhvQWeO7dlpx0FknA', // all chroms
            // tilesetUid: 'PGXLE50tQyOayNXKUnX4fQ', // just chr10
            // tilesetUid: 'AaJojHeORzKyiag1pSlAag', // bed
            tilesetUid: EG_TILE_UID,
            height: 413,
            uid: 'indicatorByCellTypes',
            options: {
              axisAlign: 'right',
              legendAlign: 'left',
              labelPosition: 'hidden',
              markColor: 'black',
              markColorHighlight: '#bf0071',
              markColorDehighlight: '#bbbbbb',
              markSize: 4,
              markMinWidth: 4,
              markHeight: 3,
              rowHeight: 3,
              markOpacity: 0.33,
              arcStyle: 'indicator',
              indicatorStyle: 'category-rect',
              labelColor: 'black',
              geneField: GENE_NAME_COLUMN,
              importanceField: ABC_SCORE_COLUMN,
              importanceDomain: [0, 1],
              // focusRegion: [
              //   1680373143 + 81046453 - 25,
              //   1680373143 + 81046453 + 25,
              // ],
              name: 'By Celltype',
              axisPositionHorizontal: 'right',
              stratification: DEFAULT_STRATIFICATION,
              showMousePosition: true,
              showGlobalMousePosition: true,
              mousePositionColor: 'black',
            },
          },
        ],
      },
      overlays: [
        {
          uid: 'region-focus',
          includes: [
            'genes-tss-viewport',
            'variants',
            'arcs-stacked-bars',
            'indicatorByCellTypes',
          ],
          options: {
            extent: [[1680373143 + 81046453, 1680373143 + 81046454]],
            minWidth: 3,
            fill: '#cc0078',
            fillOpacity: 0.05,
            strokeWidth: 0,
            outline: '#cc0078',
            outlineOpacity: 0.33,
            outlineWidth: 1,
            outlinePos: ['left', 'right'],
          },
        },
        {
          uid: 'gene-focus',
          includes: ['genes-tss-viewport'],
          options: {
            extent: [],
            minWidth: 3,
            fill: '#cc0078',
            fillOpacity: 0.25,
            stroke: '#cc0078',
            strokeWidth: 0,
            outlineWidth: 0,
          },
        },
        {
          uid: 'tss-overlays',
          includes: [
            'chroms',
            'genes-tss-viewport',
            'variants',
            'arcs-stacked-bars',
            'indicatorByCellTypes',
          ],
          options: {
            extent: [],
            minWidth: 1,
            fill: 'black',
            fillOpacity: 0.05,
            strokeWidth: 0,
            outline: 'black',
            outlineOpacity: 0.1,
            outlineWidth: 1,
            outlinePos: ['left'],
          },
        },
      ],
      metaTracks: [
        {
          uid: 'tss-overlays-meta',
          type: 'annotation-overlay',
          overlaysTrack: 'tss-overlays',
          options: {
            annotationTracks: ['tss'],
          },
        },
      ],
      layout: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
      },
      initialXDomain: [DEFAULT_X_DOMAIN_START, DEFAULT_X_DOMAIN_END],
      initialYDomain: [DEFAULT_X_DOMAIN_START, DEFAULT_X_DOMAIN_END],
    },
  ],
};
