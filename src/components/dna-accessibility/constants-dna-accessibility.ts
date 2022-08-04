import { DEFAULT_STRATIFICATION } from '../../state/stratification-state';
import {
  CategoryNameToDnaAccessibilityCategoryMap,
  RidgePlotTrackLabelStyle,
  TrackType,
  ViewConfig,
} from '../../view-config-types';
import { createCategoryMap } from './dna-accessibility-fns';

export const DEFAULT_DNA_ACCESSIBILITY_ROW_CATEGORIES: CategoryNameToDnaAccessibilityCategoryMap =
  createCategoryMap(DEFAULT_STRATIFICATION);

export const DEFAULT_DNA_ACCESSIBILITY_ROW_SELECTION = [
  120, 36, 54, 20, 80, 35, 101, 49, 44, 23, 30, 66, 5, 26, 15, 105, 57, 56, 74,
  84, 79, 93, 106, 107, 34, 28, 25, 55, 121, 94, 58, 69, 67, 63, 126, 71, 72,
  47, 11, 46, 39, 113, 29, 60, 45, 76, 21, 103, 129, 13, 128, 90, 104, 32, 109,
  27, 9, 130, 95, 86, 53, 73, 50, 48, 78, 14, 92, 124, 31, 114, 64, 88, 12, 10,
  38, 68, 3, 111, 70, 22, 61, 98, 6, 123, 118, 43, 37, 65, 81, 62, 33, 1, 24,
  122, 83, 75, 112, 40, 97, 16, 117, 87, 19, 125, 7, 102, 116, 77, 8, 17, 82,
  115, 89, 119, 18, 4, 108, 59, 127, 91, 0, 100, 85, 110, 99, 2, 96, 51, 41, 52,
  42,
];

export const DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY: ViewConfig = {
  zoomFixed: false,
  editable: false,
  trackSourceServers: ['//higlass.io/api/v1'],
  views: [
    {
      uid: 'details',
      chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
      tracks: {
        top: [
          {
            uid: 'chroms',
            type: TrackType.HORIZONTAL_CHROMOSOME_LABELS,
            server: 'https://resgen.io/api/v1',
            tilesetUid: 'ADfY_RtsQR6oKOMyrq6qhw',
            height: 17,
            options: {
              // tickPositions: 'ends',
              color: '#999999',
              stroke: 'white',
              fontSize: 10,
              fontIsLeftAligned: true,
              showMousePosition: false,
              mousePositionColor: '#000000',
            },
          },
          {
            uid: 'genes',
            type: TrackType.HORIZONTAL_GENE_ANNOTATIONS,
            server: 'https://resgen.io/api/v1',
            tilesetUid: 'NCifnbrKQu6j-ohVWJLoJw',
            height: 48,
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
            uid: 'dna-accessibility',
            type: TrackType.RIDGE_PLOT,
            // server: 'http://localhost:9876/api/v1',
            // tilesetUid: 'test',
            server: 'https://resgen.io/api/v1',
            tilesetUid: 'Uz1_tEABQf-uzktblvBKSQ',
            // height: 403,
            height: 131 * (24 - 6) + 6,
            options: {
              name: 'DNA Accessibility',
              labelPosition: 'outerBottom',
              labelShowResolution: false,
              labelShowAssembly: false,
              markArea: true,
              markColor: '#444444',
              markResolution: 256,
              valueScaling: 'exponential',
              colorRange: ['#ffffff', '#000000'],
              rowHeight: 24,
              rowPadding: -6,
              rowNormalization: true,
              rowSelections: DEFAULT_DNA_ACCESSIBILITY_ROW_SELECTION,
              rowIdToCategory: {
                fn: 'replace',
                args: ['.accessibility', ''],
              },
              rowCategories: DEFAULT_DNA_ACCESSIBILITY_ROW_CATEGORIES,
              showRowLabels: RidgePlotTrackLabelStyle.INDICATOR,
              rowLabelSize: 10,
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
          includes: ['genes', 'variants', 'dna-accessibility'],
          options: {
            extent: [],
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
      ],
      layout: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
      },
      initialXDomain: [
        1680373143 + 81046453 - 500,
        1680373143 + 81046454 + 500,
      ],
      initialYDomain: [
        1680373143 + 81046453 - 500,
        1680373143 + 81046454 + 500,
      ],
    },
  ],
};
