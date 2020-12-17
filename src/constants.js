export const DRAWER_WIDTH = 240;

export const EPS = 1e-6;

export const SVG_SKELETON = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns="http://www.w3.org/2000/svg" version="1.1" width="_WIDTH_px" height="_HEIGHT_px">
    <g id="enhancer-plot">
    _ENHANCER_
    </g>
    <g id="enhancer-gene-plot" transform="translate(0, _ENHANCER_GENE_Y_)">
    _ENHANCER_GENE_
    </g>
    <g id="dna-accessibility-plot" transform="translate(_DNA_ACCESS_X_, 0)">
    _DNA_ACCESS_
    </g>
</svg>`;

export const DEFAULT_COLOR_MAP = [
  // '#c17da5', // pink
  '#c76526', // red
  '#6fb2e4', // light blue
  '#eee462', // yellow
  '#469b76', // green
  '#3170ad', // dark blue
  '#dca237', // orange
  '#000000', // black
  '#999999', // gray
];

export const DEFAULT_COLOR_MAP_DARK = [
  // '#a1688a', // pink
  '#a65420', // red
  '#4a7798', // light blue
  '#999026', // yellow
  '#3a8162', // green
  '#295d90', // dark blue
  '#b7872e', // orange
  '#000000', // black
  '#666666', // gray
];

export const DEFAULT_COLOR_MAP_LIGHT = [
  // '#f5e9f0', // pink
  '#f6e5db', // red
  '#e7f2fb', // light blue
  '#f2eda9', // yellow
  '#e0eee8', // green
  '#dde7f1', // dark blue
  '#f5e4c4', // orange
  '#d5d5d5', // black
  '#ffffff', // gray
];

export const GENE_SEARCH_URL =
  'https://higlass.io/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA';

export const VARIANT_SEARCH_URL =
  'https://resgen.io/api/v1/suggest/?d=VF5-RDXWTxidGMJU7FeaxA';

export const DEFAULT_STRATIFICATION = {
  categoryField: 10,
  axisShowGroupSeparator: true,
  axisNoGroupColor: false,
  groups: [
    {
      label: 'Mononuclear Phagocytes',
      categories: [
        'THP1_LPS_4hr-Engreitz',
        'THP_pmaLPS_ATAC_6h',
        'CD14-positive_monocyte_treated_with_LPS_4h-Novakovic2016',
        'CD14-positive_monocyte_treated_with_BG_1h-Novakovic2016',
        'CD14-positive_monocyte_treated_with_RPMI_d6-Novakovic2016',
        'THP1-Engreitz',
        'THP_pmaLPS_ATAC_96h',
        'CD14-positive_monocyte_treated_with_BG_d1-Novakovic2016',
        'THP_pmaLPS_ATAC_72h',
        'THP-1_monocyte-VanBortle2017',
        'CD14-positive_monocyte_treated_with_LPS_d1-Novakovic2016',
        'CD14-positive_monocyte-ENCODE',
        'THP_pmaLPS_ATAC_2h',
        'dendritic_cell_treated_with_Lipopolysaccharide_0_ng-mL_for_0_hour-Garber2017',
        'CD14-positive_monocyte_treated_with_RPMI_1h-Novakovic2016',
        'U937_LPS_4hr-Engreitz',
        'CD14-positive_monocyte-Novakovic2016',
        'dendritic_cell_treated_with_Lipopolysaccharide_100_ng-mL_for_6_hour-Garber2017',
        'CD14-positive_monocyte_treated_with_BG_4h-Novakovic2016',
        'THP_pmaLPS_ATAC_0h',
        'HAP1',
        'THP-1_macrophage-VanBortle2017',
        'dendritic_cell_treated_with_Lipopolysaccharide_100_ng-mL_for_1_hour-Garber2017',
        'U937-Engreitz',
        'CD14-positive_monocyte_treated_with_RPMI_d1-Novakovic2016',
        'CD14-positive_monocyte_treated_with_RPMI_4h-Novakovic2016',
        'CD14-positive_monocyte_treated_with_LPS_d6-Novakovic2016',
        'CD14-positive_monocyte_treated_with_LPS_1h-Novakovic2016',
        'THP_pmaLPS_ATAC_24h',
        'THP_pmaLPS_ATAC_1h',
        'dendritic_cell_treated_with_Lipopolysaccharide_100_ng-mL_for_2_hour-Garber2017',
        'CD14-positive_monocyte_treated_with_BG_d6-Novakovic2016',
        'dendritic_cell_treated_with_Lipopolysaccharide_100_ng-mL_for_30_minute-Garber2017',
        'THP_pmaLPS_ATAC_120h',
        'dendritic_cell_treated_with_Lipopolysaccharide_100_ng-mL_for_4_hour-Garber2017',
        'THP_pmaLPS_ATAC_48h',
        'CD14-positive_monocytes-Roadmap',
        'THP_pmaLPS_ATAC_12h', // monoctye
      ],
    },
    {
      label: 'B Cells',
      categories: [
        'Karpas-422-ENCODE', // b-cell cell line
        'BJAB-Engreitz',
        'BJAB_anti-IgM_anti-CD40_4hr-Engreitz',
        'B_cell-ENCODE',
        'OCI-LY7-ENCODE',
        'GM12878-Roadmap',
        'MM.1S-ENCODE',
        'CD19-positive_B_cell-Roadmap',
        'CD8-positive_alpha-beta_T_cell-ENCODE',
      ],
    },
    {
      label: 'T Cells',
      categories: [
        'Jurkat_anti-CD3_PMA_4hr-Engreitz', // t-cell
        'Jurkat-Engreitz',
        'CD3-positive_T_cell-Roadmap',
        'CD4-positive_helper_T_cell-ENCODE',
        'CD8-positive_alpha-beta_T_cell-Corces2016',
        'thymus_fetal-Roadmap',
        'CD4-positive_helper_T_cell-Corces2016',
        'T-cell-ENCODE',
      ],
    },
    {
      label: 'Other haematopoietic cells',
      categories: [
        'spleen-ENCODE',
        'K562-Roadmap',
        'CD56-positive_natural_killer_cells-Roadmap',
        'erythroblast-Corces2016',
        'CD34-positive_mobilized-Roadmap',
        'megakaryocyte-erythroid_progenitor-Corces2016',
        'natural_killer_cell-Corces2016',
        'IMR90-Roadmap',
      ],
    },
    {
      label: 'Fibroblasts',
      categories: [
        'foreskin_fibroblast-Roadmap',
        'fibroblast_of_dermis-Roadmap',
        'fibroblast_of_arm-ENCODE',
        'astrocyte-ENCODE',
        'fibroblast_of_lung-Roadmap',
      ],
    },
    {
      label: 'Epithelial',
      categories: [
        'small_intestine_fetal-Roadmap',
        'epithelial_cell_of_prostate-ENCODE',
        'HCT116-ENCODE',
        'MCF-7-ENCODE',
        'adrenal_gland_fetal-ENCODE',
        'H7',
        'keratinocyte-Roadmap',
        'MCF10A-Ji2017',
        'pancreas-Roadmap',
        'mammary_epithelial_cell-Roadmap',
        'stomach-Roadmap',
        'LoVo',
        'A549_treated_with_ethanol_0.02_percent_for_1_hour-Roadmap',
        'PC-9-ENCODE',
        'H1-hESC-Roadmap',
        'thyroid_gland-ENCODE',
        'HT29',
        'MDA-MB-231',
        'iPS_DF_19.11_Cell_Line-Roadmap',
        'large_intestine_fetal-Roadmap',
        'Panc1-ENCODE',
        'adrenal_gland-ENCODE',
        'MCF10A_treated_with_TAM24hr-Ji2017',
        'trophoblast_cell-ENCODE',
        'H1_BMP4_Derived_Trophoblast_Cultured_Cells-Roadmap',
        'uterus-ENCODE',
        'body_of_pancreas-ENCODE',
        'stomach_fetal-Roadmap',
        'H9-Roadmap',
        'transverse_colon-ENCODE',
        'H1_BMP4_Derived_Mesendoderm_Cultured_Cells-Roadmap',
        'breast_epithelium-ENCODE',
        'induced_pluripotent_stem_cell-ENCODE',
        'LNCAP',
        'H1_Derived_Mesenchymal_Stem_Cells-Roadmap',
        'ovary-Roadmap',
        'sigmoid_colon-ENCODE',
        'skeletal_muscle_myoblast-Roadmap',
        'bipolar_neuron_from_iPSC-ENCODE',
        'coronary_artery_smooth_muscle_cell-Miller2016',
        'SK-N-SH-ENCODE',
        'muscle_of_trunk_fetal-Roadmap',
      ],
    },
    {
      label: 'Other',
      categories: [
        'adipose_tissue-ENCODE',
        'HeLa-S3-Roadmap',
        'hepatocyte-ENCODE',
        'heart_ventricle-ENCODE',
        'spinal_cord_fetal-ENCODE',
        'coronary_artery-ENCODE',
        'HepG2-Roadmap',
        'muscle_of_leg_fetal-Roadmap',
        'gastrocnemius_medialis-ENCODE',
        'brite_adipose-Loft2014',
        'placenta-Roadmap',
        'liver-ENCODE',
        'A673-ENCODE',
        'white_adipose-Loft2014',
        'cardiac_muscle_cell-ENCODE',
        'osteoblast-ENCODE',
        'H1_Derived_Neuronal_Progenitor_Cultured_Cells-Roadmap',
        'endothelial_cell_of_umbilical_vein-Roadmap',
        'NCCIT',
        'myotube_originated_from_skeletal_muscle_myoblast-Roadmap',
        'psoas_muscle-Roadmap',
        'endothelial_cell_of_umbilical_vein_vegf_stim_4_hours-zhang2013',
        'endothelial_cell_of_umbilical_vein_vegf_stim_12_hours-zhang2013',
      ],
    },
  ],
};

export const GROUPED_SAMPLE_OPTIONS = DEFAULT_STRATIFICATION.groups.map(
  (group) => ({
    name: group.label,
    options: group.categories,
  })
);

export const SAMPLE_TO_GROUP = GROUPED_SAMPLE_OPTIONS.reduce(
  (sampleToGroup, group) => {
    group.options.forEach((option) => {
      sampleToGroup[option] = group.name;
    });
    return sampleToGroup;
  },
  {}
);

export const SAMPLES = GROUPED_SAMPLE_OPTIONS.flatMap((group) => group.options);

export const DEFAULT_X_DOMAIN_START = 1761366260;
export const DEFAULT_X_DOMAIN_END = 1761603836;

export const DEFAULT_VIEW_CONFIG_ENHANCER = {
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
            type: 'combined',
            uid: 'chroms-viewport',
            height: 12,
            contents: [
              {
                type: 'horizontal-chromosome-labels',
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
                type: 'viewport-projection-horizontal',
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
            type: 'combined',
            uid: 'genes-tss-viewport',
            height: 48,
            contents: [
              {
                type: 'horizontal-gene-annotations',
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
                type: 'tss',
                uid: 'tss',
                height: 48,
                // server: 'http://localhost:9876/api/v1',
                // tilesetUid: 'RefSeqCurated170308bedCollapsedGeneBoundsTSS500bp',
                server: 'https://resgen.io/api/v1',
                tilesetUid: 'VMZDLKrtQDmJMSjg7Ds4yA',
                options: {
                  fontSize: 9,
                  plusStrandColor: 'black',
                  minusStrandColor: 'black',
                  geneAnnotationHeight: 12,
                  geneLabelPosition: 'outside',
                  geneStrandSpacing: 2,
                },
              },
              {
                uid: 'viewport-details-genes',
                type: 'viewport-projection-horizontal',
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
            type: 'point-annotation',
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
          {
            type: 'stacked-bar',
            // server: 'http://localhost:9876/api/v1',
            // tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2hg19beddb',
            server: 'https://resgen.io/api/v1',
            // tilesetUid: 'P0Ng5fhvQWeO7dlpx0FknA', // all chroms
            // tilesetUid: 'PGXLE50tQyOayNXKUnX4fQ', // just chr10
            // tilesetUid: 'AaJojHeORzKyiag1pSlAag', // bed
            tilesetUid: 'GOxTKzoLSsuw0BaG6eBrXw', // improved bed
            height: 72,
            uid: 'stacked-bars',
            options: {
              binSize: 4,
              axisAlign: 'right',
              axisPositionHorizontal: 'right',
              labelPosition: 'hidden',
              markColor: 'black',
              markColorFocus: '#cc0078',
              markSize: 4,
              markOpacity: 0.33,
              arcStyle: 'indicator',
              indicatorStyle: 'category-rect',
              labelColor: 'black',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              geneField: 6,
              importanceField: 7,
              importanceDomain: [0, 1],
              focusRegion: [
                1680373143 + 81046453 - 25,
                1680373143 + 81046453 + 25,
              ],
              name: 'By Celltype',
              stratification: DEFAULT_STRATIFICATION,
              showMousePosition: true,
              showGlobalMousePosition: true,
              mousePositionColor: 'black',
            },
          },
          {
            type: 'stratified-bed',
            // server: 'http://localhost:9876/api/v1',
            // tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2hg19beddb',
            server: 'https://resgen.io/api/v1',
            // tilesetUid: 'P0Ng5fhvQWeO7dlpx0FknA', // all chroms
            // tilesetUid: 'PGXLE50tQyOayNXKUnX4fQ', // just chr10
            // tilesetUid: 'AaJojHeORzKyiag1pSlAag', // bed
            tilesetUid: 'GOxTKzoLSsuw0BaG6eBrXw', // improved bed
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
              geneField: 6,
              importanceField: 7,
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
            'chroms-viewport',
            'genes-tss-viewport',
            'ibd-snps',
            'stacked-bars',
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
            'ibd-snps',
            'stacked-bars',
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

export const DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY = {
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
            type: 'horizontal-chromosome-labels',
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
            type: 'horizontal-gene-annotations',
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
            uid: 'ibd-snps',
            type: 'point-annotation',
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
          {
            uid: 'dna-accessibility',
            type: 'ridge-plot',
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
              rowSelections: [
                120,
                36,
                54,
                20,
                80,
                35,
                101,
                49,
                44,
                23,
                30,
                66,
                5,
                26,
                15,
                105,
                57,
                56,
                74,
                84,
                79,
                93,
                106,
                107,
                34,
                28,
                25,
                55,
                121,
                94,
                58,
                69,
                67,
                63,
                126,
                71,
                72,
                47,
                11,
                46,
                39,
                113,
                29,
                60,
                45,
                76,
                21,
                103,
                129,
                13,
                128,
                90,
                104,
                32,
                109,
                27,
                9,
                130,
                95,
                86,
                53,
                73,
                50,
                48,
                78,
                14,
                92,
                124,
                31,
                114,
                64,
                88,
                12,
                10,
                38,
                68,
                3,
                111,
                70,
                22,
                61,
                98,
                6,
                123,
                118,
                43,
                37,
                65,
                81,
                62,
                33,
                1,
                24,
                122,
                83,
                75,
                112,
                40,
                97,
                16,
                117,
                87,
                19,
                125,
                7,
                102,
                116,
                77,
                8,
                17,
                82,
                115,
                89,
                119,
                18,
                4,
                108,
                59,
                127,
                91,
                0,
                100,
                85,
                110,
                99,
                2,
                96,
                51,
                41,
                52,
                42,
              ],
              rowIdToCategory: {
                fn: 'replace',
                args: ['.accessibility', ''],
              },
              rowCategories: DEFAULT_STRATIFICATION.groups.reduce(
                (row, group, index) => {
                  const category = {
                    label: group.label,
                    color: group.axisLabelColor,
                    background: group.axisLabelBackground,
                    index,
                  };
                  group.categories.forEach((sample) => {
                    row[sample] = category;
                  });
                  return row;
                },
                {}
              ),
              showRowLabels: true,
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
          includes: ['chroms', 'genes', 'ibd-snps', 'dna-accessibility'],
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
