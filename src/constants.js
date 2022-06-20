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

// const EG_TILE_UID = 'GOxTKzoLSsuw0BaG6eBrXw'; // V2
export const EG_TILE_UID = 'e3lpYv5LSIiik7CFtuAMTw'; // V3

export const EG_TILE_V3 = EG_TILE_UID === 'e3lpYv5LSIiik7CFtuAMTw';

export const BIOSAMPLE_COLUMN = EG_TILE_V3 ? 6 : 10;
export const GENE_NAME_COLUMN = EG_TILE_V3 ? 3 : 6;
export const ABC_SCORE_COLUMN = EG_TILE_V3 ? 5 : 7;

export const DEFAULT_STRATIFICATION = {
  categoryField: BIOSAMPLE_COLUMN,
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

export const SAMPLE_IDX = SAMPLES.reduce((idxs, sample, idx) => {
  idxs[sample] = idx;
  return idxs;
}, {});

export const LOCAL_BED_TILESET_INFO_HG19 = {
  zoom_step: 1,
  max_length: 3137161265,
  assembly: 'hg19',
  chrom_names:
    'chr1\tchr2\tchr3\tchr4\tchr5\tchr6\tchr7\tchr8\tchr9\tchr10\tchr11\tchr12\tchr13\tchr14\tchr15\tchr16\tchr17\tchr18\tchr19\tchr20\tchr21\tchr22\tchrX\tchrY\tchrM\tchr6_ssto_hap7\tchr6_mcf_hap5\tchr6_cox_hap2\tchr6_mann_hap4\tchr6_apd_hap1\tchr6_qbl_hap6\tchr6_dbb_hap3\tchr17_ctg5_hap1\tchr4_ctg9_hap1\tchr1_gl000192_random\tchrUn_gl000225\tchr4_gl000194_random\tchr4_gl000193_random\tchr9_gl000200_random\tchrUn_gl000222\tchrUn_gl000212\tchr7_gl000195_random\tchrUn_gl000223\tchrUn_gl000224\tchrUn_gl000219\tchr17_gl000205_random\tchrUn_gl000215\tchrUn_gl000216\tchrUn_gl000217\tchr9_gl000199_random\tchrUn_gl000211\tchrUn_gl000213\tchrUn_gl000220\tchrUn_gl000218\tchr19_gl000209_random\tchrUn_gl000221\tchrUn_gl000214\tchrUn_gl000228\tchrUn_gl000227\tchr1_gl000191_random\tchr19_gl000208_random\tchr9_gl000198_random\tchr17_gl000204_random\tchrUn_gl000233\tchrUn_gl000237\tchrUn_gl000230\tchrUn_gl000242\tchrUn_gl000243\tchrUn_gl000241\tchrUn_gl000236\tchrUn_gl000240\tchr17_gl000206_random\tchrUn_gl000232\tchrUn_gl000234\tchr11_gl000202_random\tchrUn_gl000238\tchrUn_gl000244\tchrUn_gl000248\tchr8_gl000196_random\tchrUn_gl000249\tchrUn_gl000246\tchr17_gl000203_random\tchr8_gl000197_random\tchrUn_gl000245\tchrUn_gl000247\tchr9_gl000201_random\tchrUn_gl000235\tchrUn_gl000239\tchr21_gl000210_random\tchrUn_gl000231\tchrUn_gl000229\tchrUn_gl000226\tchr18_gl000207_random',
  chrom_sizes:
    '249250621\t243199373\t198022430\t191154276\t180915260\t171115067\t159138663\t146364022\t141213431\t135534747\t135006516\t133851895\t115169878\t107349540\t102531392\t90354753\t81195210\t78077248\t59128983\t63025520\t48129895\t51304566\t155270560\t59373566\t16571\t4928567\t4833398\t4795371\t4683263\t4622290\t4611984\t4610396\t1680828\t590426\t547496\t211173\t191469\t189789\t187035\t186861\t186858\t182896\t180455\t179693\t179198\t174588\t172545\t172294\t172149\t169874\t166566\t164239\t161802\t161147\t159169\t155397\t137718\t129120\t128374\t106433\t92689\t90085\t81310\t45941\t45867\t43691\t43523\t43341\t42152\t41934\t41933\t41001\t40652\t40531\t40103\t39939\t39929\t39786\t38914\t38502\t38154\t37498\t37175\t36651\t36422\t36148\t34474\t33824\t27682\t27386\t19913\t15008\t4262',
  tile_size: 1024.0,
  max_zoom: 22,
  max_width: 4294967296.0,
  min_pos: [1],
  max_pos: [3137161265],
  header:
    'chrom1\tstart1\tend1\tchrom2\tstart2\tend2\ttargetGene\tscore\tstrand1\tstrand2\tcellType',
  version: 2,
  coordSystem: '',
};

export const DEFAULT_DNA_ACCESSIBILITY_ROW_SELECTION = [
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
];

export const DEFAULT_DNA_ACCESSIBILITY_ROW_CATEGORIES = DEFAULT_STRATIFICATION.groups.reduce(
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
);

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
            type: 'combined',
            uid: 'variants',
            height: 32,
            contents: [
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
            ],
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
              rowSelections: DEFAULT_DNA_ACCESSIBILITY_ROW_SELECTION,
              rowIdToCategory: {
                fn: 'replace',
                args: ['.accessibility', ''],
              },
              rowCategories: DEFAULT_DNA_ACCESSIBILITY_ROW_CATEGORIES,
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

export const IGNORED_FOCUS_ELEMENTS = new Set(['input', 'textarea']);

export const HIGLASS_PAN_ZOOM = 'panZoom';

export const HIGLASS_SELECT = 'select';
