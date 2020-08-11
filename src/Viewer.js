import React, { useCallback, useRef, useState } from 'react';
import { HiGlassComponent } from 'higlass';
import { debounce, deepClone, isString, pipe } from '@flekschas/utils';
import AppBar from '@material-ui/core/AppBar';
// import Autocomplete from '@material-ui/core/Autocomplete';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import ClearIcon from '@material-ui/icons/Clear';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import useQueryString from './use-query-string';
import { toAbsPosition } from './utils';

import 'higlass/dist/hglib.css';
import './Viewer.css';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    display: 'flex',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    color: theme.palette.common.black,
    backgroundColor: theme.palette.common.white,
    boxShadow: `0 1px 0 0 ${theme.palette.grey['300']}`,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  textInput: {
    minWidth: '100%',
  },
  toolbar: theme.mixins.toolbar,
  content: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    padding: theme.spacing(1),
    backgroundColor: 'white',
  },
  higlass: {
    flexGrow: 1,
  },
}));

const DEFAULT_STRATIFICATION = {
  categoryField: 10,
  axisShowGroupSeparator: true,
  // axisNoGroupColor: true,
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

const DEFAULT_X_DOMAIN_START = 1761366260;
const DEFAULT_X_DOMAIN_END = 1761603836;

const DEFAULT_VIEW_CONFIG = {
  editable: false,
  trackSourceServers: [
    '//higlass.io/api/v1',
    'https://resgen.io/api/v1/gt/paper-data',
  ],
  views: [
    // {
    //   uid: 'overview',
    //   chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
    //   layout: {
    //     w: 12,
    //     h: 24,
    //     x: 0,
    //     y: 0,
    //   },
    //   initialXDomain: [0, 3095693983],
    //   initialYDomain: [0, 3095693983],
    //   tracks: {
    //     top: [
    //       {
    //         type: 'combined',
    //         uid: 'chroms-viewport',
    //         height: 24,
    //         contents: [
    //           {
    //             type: 'horizontal-chromosome-labels',
    //             tilesetUid: 'ADfY_RtsQR6oKOMyrq6qhw',
    //             height: 24,
    //             server: 'https://resgen.io/api/v1',
    //             uid: 'chroms',
    //             options: {
    //               // tickPositions: 'ends',
    //               color: '#999999',
    //               stroke: 'white',
    //               fontSize: 12,
    //               fontIsLeftAligned: false,
    //               showMousePosition: true,
    //               mousePositionColor: '#000000',
    //             },
    //           },
    //           {
    //             uid: 'viewport-details-chroms',
    //             type: 'viewport-projection-horizontal',
    //             fromViewUid: 'context',
    //             height: 24,
    //             options: {
    //               projectionFillColor: '#cc0078',
    //               projectionStrokeColor: '#cc0078',
    //               projectionFillOpacity: 0.3,
    //               projectionStrokeOpacity: 0.3,
    //               strokeWidth: 1,
    //             },
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // },
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
            height: 50,
            contents: [
              {
                type: 'horizontal-gene-annotations',
                uid: 'genes',
                height: 50,
                server: 'https://resgen.io/api/v1',
                tilesetUid: 'NCifnbrKQu6j-ohVWJLoJw',
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
                type: 'tss',
                uid: 'tss',
                height: 50,
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
                height: 50,
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
            height: 36,
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
              name: 'IBD SNPs',
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
          // {
          //   type: 'horizontal-bar',
          //   uid: 'microglia',
          //   server: 'https://resgen.io/api/v1',
          //   tilesetUid: 'V3eSdmpsQqquMuV-gX8lPw',
          //   height: 36,
          //   options: {
          //     barFillColor: 'black',
          //     align: 'bottom',
          //     labelColor: '[glyph-color]',
          //     labelPosition: 'topLeft',
          //     labelLeftMargin: 0,
          //     labelRightMargin: 0,
          //     labelTopMargin: 0,
          //     labelBottomMargin: 0,
          //     labelShowResolution: false,
          //     axisLabelFormatting: 'scientific',
          //     axisPositionHorizontal: 'right',
          //     valueScaling: 'linear',
          //     trackBorderWidth: 0,
          //     trackBorderColor: 'black',
          //     labelTextOpacity: 0.4,
          //     barOpacity: 1,
          //     name: 'microglia_H3K27ac_pooled',
          //   },
          // },
          {
            type: 'stacked-bar',
            server: 'http://localhost:9876/api/v1',
            tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2chr10',
            // server: 'https://resgen.io/api/v1',
            // tilesetUid: 'P0Ng5fhvQWeO7dlpx0FknA',
            height: 96,
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
            },
          },
          {
            type: 'stratified-bed',
            server: 'http://localhost:9876/api/v1',
            tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2chr10',
            // server: 'https://resgen.io/api/v1',
            // tilesetUid: 'P0Ng5fhvQWeO7dlpx0FknA',
            height: 403,
            uid: 'indicatorByCellTypes',
            options: {
              axisAlign: 'right',
              labelPosition: 'hidden',
              markColor: 'black',
              markColorFocus: '#cc0078',
              markSize: 4,
              markMinWidth: 4,
              markHeight: 3,
              rowHeight: 3,
              markOpacity: 0.33,
              arcStyle: 'indicator',
              indicatorStyle: 'category-rect',
              labelColor: 'black',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
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
            },
          },
        ],
      },
      overlays: [
        {
          uid: 'region-focus',
          includes: [
            'chroms',
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
            strokeWidth: 1,
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
    //   {
    //     uid: 'details',
    //     chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
    //     tracks: {
    //       top: [
    //         {
    //           type: 'horizontal-chromosome-labels',
    //           options: {
    //             // tickPositions: 'ends',
    //             color: '#999999',
    //             stroke: 'white',
    //             fontSize: 10,
    //             fontIsLeftAligned: true,
    //             showMousePosition: false,
    //             mousePositionColor: '#000000',
    //           },
    //           tilesetUid: 'ADfY_RtsQR6oKOMyrq6qhw',
    //           height: 12,
    //           server: 'https://resgen.io/api/v1',
    //           uid: 'chroms',
    //         },
    //         {
    //           type: 'horizontal-gene-annotations',
    //           uid: 'genes',
    //           height: 48,
    //           server: 'https://resgen.io/api/v1',
    //           tilesetUid: 'NCifnbrKQu6j-ohVWJLoJw',
    //           options: {
    //             fontSize: 9,
    //             plusStrandColor: 'black',
    //             minusStrandColor: 'black',
    //             geneAnnotationHeight: 12,
    //             geneLabelPosition: 'outside',
    //             geneStrandSpacing: 2,
    //           },
    //         },
    //         {
    //           type: 'point-annotation',
    //           uid: 'ibd-snps',
    //           // server: 'http://localhost:9876/api/v1',
    //           // tilesetUid: 'IBDCombinedset1-2variantonly-pval',
    //           server: 'https://resgen.io/api/v1',
    //           tilesetUid: 'VF5-RDXWTxidGMJU7FeaxA',
    //           height: 132,
    //           options: {
    //             axisPositionHorizontal: 'right',
    //             markColor: 'black',
    //             markColorFocus: '#cc0078',
    //             markSize: 2,
    //             markOpacity: 0.33,
    //             markOpacityFocus: 0.66,
    //             // axisPositionHorizontal: 'right',
    //             valueColumn: 7,
    //             focusRegion: [
    //               1680373143 + 81046453 - 25,
    //               1680373143 + 81046453 + 25,
    //             ],
    //             name: 'IBD SNPs',
    //             toolTip: {
    //               name: {
    //                 field: 3,
    //               },
    //               value: {
    //                 field: 6,
    //                 numDecimals: 2,
    //               },
    //               other: [
    //                 {
    //                   label: 'Post. Prob.',
    //                   field: 7,
    //                   numDecimals: 2,
    //                 },
    //               ],
    //             },
    //           },
    //         },
    //         {
    //           type: 'multivec',
    //           uid: 'dna-accessibility',
    //           height: 403,
    //           // server: 'http://localhost:9876/api/v1',
    //           // tilesetUid: 'test',
    //           server: 'https://resgen.io/api/v1',
    //           tilesetUid: 'Uz1_tEABQf-uzktblvBKSQ',
    //           options: {
    //             name: 'DNA Accessibility',
    //             labelPosition: 'outerBottom',
    //             labelShowResolution: false,
    //             labelShowAssembly: false,
    //             valueScaling: 'exponential',
    //             colorRange: ['#ffffff', '#000000'],
    //             selectRows: [
    //               120,
    //               36,
    //               54,
    //               20,
    //               80,
    //               35,
    //               101,
    //               49,
    //               44,
    //               23,
    //               30,
    //               66,
    //               5,
    //               26,
    //               15,
    //               105,
    //               57,
    //               56,
    //               74,
    //               84,
    //               79,
    //               93,
    //               106,
    //               107,
    //               34,
    //               28,
    //               25,
    //               55,
    //               121,
    //               94,
    //               58,
    //               69,
    //               67,
    //               63,
    //               126,
    //               71,
    //               72,
    //               47,
    //               11,
    //               46,
    //               39,
    //               113,
    //               29,
    //               60,
    //               45,
    //               76,
    //               21,
    //               103,
    //               129,
    //               13,
    //               128,
    //               90,
    //               104,
    //               32,
    //               109,
    //               27,
    //               9,
    //               130,
    //               95,
    //               86,
    //               53,
    //               73,
    //               50,
    //               48,
    //               78,
    //               14,
    //               92,
    //               124,
    //               31,
    //               114,
    //               64,
    //               88,
    //               12,
    //               10,
    //               38,
    //               68,
    //               3,
    //               111,
    //               70,
    //               22,
    //               61,
    //               98,
    //               6,
    //               123,
    //               118,
    //               43,
    //               37,
    //               65,
    //               81,
    //               62,
    //               33,
    //               1,
    //               24,
    //               122,
    //               83,
    //               75,
    //               112,
    //               40,
    //               97,
    //               16,
    //               117,
    //               87,
    //               19,
    //               125,
    //               7,
    //               102,
    //               116,
    //               77,
    //               8,
    //               17,
    //               82,
    //               115,
    //               89,
    //               119,
    //               18,
    //               4,
    //               108,
    //               59,
    //               127,
    //               91,
    //               0,
    //               100,
    //               85,
    //               110,
    //               99,
    //               2,
    //               96,
    //               51,
    //               41,
    //               52,
    //               42,
    //             ],
    //           },
    //         },
    //       ],
    //     },
    //     layout: {
    //       w: 4,
    //       h: 11,
    //       x: 8,
    //       y: 1,
    //     },
    //     initialXDomain: [
    //       1680373143 + 81046453 - 500,
    //       1680373143 + 81046454 + 500,
    //     ],
    //     initialYDomain: [
    //       1680373143 + 81046453 - 500,
    //       1680373143 + 81046454 + 500,
    //     ],
    //   },
  ],
};

const DEFAULT_HIGLASS_OPTIONS = {
  sizeMode: 'bounded',
  // pixelPreciseMarginPadding: true,
  // containerPaddingX: 0,
  // containerPaddingY: 0,
  // viewMarginTop: 0,
  // viewMarginBottom: 6,
  // viewMarginLeft: 0,
  // viewMarginRight: 0,
  // viewPaddingTop: 3,
  // viewPaddingBottom: 3,
  // viewPaddingLeft: 0,
  // viewPaddingRight: 0,
};

const chrPosUrlEncoder = (chrPos) =>
  chrPos ? chrPos.replace(':', '.') : chrPos;

const chrPosUrlDecoder = (chrPos) =>
  chrPos ? chrPos.replace('.', ':') : chrPos;

const updateXDomainViewConfig = (newXDomainStart, newXDomainEnd) => (
  viewConfig
) => {
  const xDomain = [...viewConfig.views[0].initialXDomain];

  if (!Number.isNaN(+newXDomainStart)) {
    xDomain[0] = newXDomainStart;
  }
  if (!Number.isNaN(+newXDomainEnd)) {
    xDomain[1] = newXDomainEnd;
  }

  viewConfig.views[0].initialXDomain = xDomain;

  return viewConfig;
};

const updateFocusGeneViewConfig = (gene, start, end) => (viewConfig) => {
  const n = viewConfig.views[0].tracks.top.length;

  if (gene) {
    viewConfig.views[0].tracks.top[n - 1].options.focusGene = gene;
    viewConfig.views[0].overlays[1].options.extent = [[start, end]];
  } else {
    delete viewConfig.views[0].tracks.top[n - 1].options.focusGene;
    delete viewConfig.views[0].overlays[1].options.extent;
  }

  return viewConfig;
};

const updateFocusVariantViewConfig = (variantAbsPosition) => (viewConfig) => {
  // const n = viewConfig.views.length;

  const focusRegion = Number.isNaN(+variantAbsPosition)
    ? []
    : [variantAbsPosition - 0.5, variantAbsPosition + 0.5];

  viewConfig.views[0].tracks.top[2].options.focusRegion = focusRegion;
  viewConfig.views[0].tracks.top[4].options.focusRegion = focusRegion;
  // viewConfig.views[0].tracks.top[n - 1].options.focusRegion = focusRegion;
  viewConfig.views[0].overlays[0].options.extent = [focusRegion];

  // const focusDomain = Number.isNaN(+variantAbsPosition)
  //   ? viewConfig.views[1].initialXDomain
  //   : [variantAbsPosition - 500, variantAbsPosition + 500];

  // viewConfig.views[1].initialXDomain = focusDomain;
  // viewConfig.views[1].initialYDomain = focusDomain;

  return viewConfig;
};

const updateVariantYScaleViewConfig = (yScale) => (viewConfig) => {
  viewConfig.views[0].tracks.top[2].options.valueColumn =
    yScale === 'pValue' ? 7 : 8;
  // viewConfig.views[1].tracks.top[2].options.valueColumn =
  //   yScale === 'pValue' ? 7 : 8;

  return viewConfig;
};

const Viewer = (props) => {
  const [focusGene, setFocusGene] = useQueryString('gene', '');
  const [focusVariant, setFocusVariant] = useQueryString(
    'variant',
    'chr10:81046453',
    {
      encoder: chrPosUrlEncoder,
      decoder: chrPosUrlDecoder,
    }
  );
  const [variantYScale, setVariantYScale] = useQueryString(
    'varient-scale',
    'pValue'
  );
  const [xDomainStart, setXDomainStart] = useQueryString(
    'start',
    DEFAULT_X_DOMAIN_START,
    {
      encoder: chrPosUrlEncoder,
      decoder: chrPosUrlDecoder,
    }
  );
  const [xDomainEnd, setXDomainEnd] = useQueryString(
    'end',
    DEFAULT_X_DOMAIN_END,
    {
      encoder: chrPosUrlEncoder,
      decoder: chrPosUrlDecoder,
    }
  );
  const defaultViewConfig = pipe(
    updateFocusGeneViewConfig(focusGene),
    updateFocusVariantViewConfig(toAbsPosition(focusVariant, props.chromInfo)),
    updateVariantYScaleViewConfig(variantYScale),
    updateXDomainViewConfig(
      toAbsPosition(xDomainStart, props.chromInfo),
      toAbsPosition(xDomainEnd, props.chromInfo)
    )
  )(deepClone(DEFAULT_VIEW_CONFIG));

  const [options, setOptions] = useState(DEFAULT_HIGLASS_OPTIONS);
  const [viewConfig, setViewConfig] = useState(defaultViewConfig);
  const higlassApi = useRef(null);

  const updateFocusGeneInHiglass = (name, start, end) => {
    setViewConfig(
      updateFocusGeneViewConfig(name, start, end)(deepClone(viewConfig))
    );
  };

  const clearFocusGene = () => {
    setFocusGene('');
    updateFocusGeneInHiglass();
  };

  const updateFocusVariantInHiglass = (variant) => {
    setViewConfig(
      updateFocusVariantViewConfig(toAbsPosition(variant, props.chromInfo))(
        deepClone(viewConfig)
      )
    );
  };

  const updateFocusVariantInHiglassDb = debounce(
    updateFocusVariantInHiglass,
    500
  );

  const focusVariantChangeHandler = (event) => {
    setFocusVariant(event.target.value);
    updateFocusVariantInHiglassDb(event.target.value);
  };

  const clearFocusVariant = () => {
    setFocusVariant('');
    updateFocusVariantInHiglass('');
  };

  const updateVariantYScaleInHiglass = (yScale) => {
    setViewConfig(updateVariantYScaleViewConfig(yScale)(deepClone(viewConfig)));
  };

  const variantYScaleChangeHandler = (event) => {
    setVariantYScale(event.target.value);
    updateVariantYScaleInHiglass(event.target.value);
  };

  const higlassClickHandler = (event) => {
    if (event.type === 'gene-annotation') {
      setFocusGene(event.payload.name);
      updateFocusGeneInHiglass(
        event.payload.name,
        event.payload.xStart,
        event.payload.xEnd
      );
    } else if (event.type === 'snp') {
      setFocusVariant(`${event.payload.fields[0]}:${event.payload.fields[1]}`);
      updateFocusVariantInHiglass(event.payload.xStart);
    }
  };

  const higlassLocationChangeHandler = (event) => {
    const [newXDomainStart, newXDomainEnd] = event.xDomain.map((absPos) =>
      props.chromInfo.absToChr(absPos).slice(0, 2).join(':')
    );
    setXDomainStart(newXDomainStart);
    setXDomainEnd(newXDomainEnd);
  };
  const higlassLocationChangeHandlerDb = debounce(
    higlassLocationChangeHandler,
    250
  );

  const higlassInitHandler = useCallback((higlassInstance) => {
    if (higlassInstance !== null) {
      higlassApi.current = higlassInstance.api;
      higlassInstance.api.on('click', higlassClickHandler);
      higlassInstance.api.on(
        'location',
        higlassLocationChangeHandlerDb,
        'context'
      );
    }
  }, []);

  const numericalXDomainStart =
    isString(xDomainStart) && xDomainStart.indexOf(':') >= 0
      ? props.chromInfo.chrToAbs([
          xDomainStart.split(':')[0],
          +xDomainStart.split(':')[1],
        ])
      : +xDomainStart;

  const numericalXDomainEnd =
    isString(xDomainEnd) && xDomainEnd.indexOf(':') >= 0
      ? props.chromInfo.chrToAbs([
          xDomainEnd.split(':')[0],
          +xDomainEnd.split(':')[1],
        ])
      : +xDomainEnd;

  const xDomainStartChangeHandler = (event) => {
    setXDomainStart(event.target.value);
  };

  const xDomainEndChangeHandler = (event) => {
    setXDomainEnd(event.target.value);
  };

  const updateXDomain = (event) => {
    if (!higlassApi.current) return;

    const newViewConfig = deepClone(viewConfig);

    const xDomain = [...newViewConfig.views[0].initialXDomain];

    if (!Number.isNaN(+numericalXDomainStart)) {
      xDomain[0] = numericalXDomainStart;
    }
    if (!Number.isNaN(+numericalXDomainEnd)) {
      xDomain[1] = numericalXDomainEnd;
    }

    higlassApi.current.zoomTo(
      'context',
      xDomain[0],
      xDomain[1],
      xDomain[0],
      xDomain[1],
      2000
    );
  };

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" noWrap>
            Enhancer-Promoter Vis
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="left"
      >
        <div className={classes.toolbar} />
        <Divider />
        <Box m={1}>
          <Box m={0}>
            <FormControl variant="outlined" margin="dense" fullWidth>
              <InputLabel htmlFor="x-domain-start">Region Start</InputLabel>
              <OutlinedInput
                id="x-domain-start"
                label="Region Start"
                onChange={xDomainStartChangeHandler}
                value={xDomainStart}
              />
            </FormControl>
          </Box>
          <Box m={0}>
            <FormControl variant="outlined" margin="dense" fullWidth>
              <InputLabel htmlFor="x-domain-end">Region End</InputLabel>
              <OutlinedInput
                id="x-domain-end"
                label="Region End"
                onChange={xDomainEndChangeHandler}
                value={xDomainEnd}
              />
            </FormControl>
          </Box>
          <Box m={0}>
            <Button
              variant="contained"
              margin="dense"
              onClick={updateXDomain}
              fullWidth
              disableElevation
            >
              Go
            </Button>
          </Box>
        </Box>
        <Divider />
        <Box m={1}>
          <Box m={0}>
            <FormControl variant="outlined" margin="dense" fullWidth>
              <InputLabel htmlFor="focus-gene">Focus Gene</InputLabel>
              <OutlinedInput
                id="focus-gene"
                value={focusGene}
                default=""
                label="Focus Gene"
                endAdornment={
                  focusGene && (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear input"
                        onClick={clearFocusGene}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              />
            </FormControl>
          </Box>
          <Box m={0}>
            <FormControl variant="outlined" margin="dense" fullWidth>
              <InputLabel htmlFor="focus-variant">Focus Variant</InputLabel>
              <OutlinedInput
                id="focus-variant"
                value={focusVariant}
                onChange={focusVariantChangeHandler}
                label="Focus Variant"
                default="chr10:81046453"
                endAdornment={
                  focusVariant && (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear input"
                        onClick={clearFocusVariant}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              />
            </FormControl>
          </Box>
        </Box>
        <Box m={1}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Variant y-scale</FormLabel>
            <RadioGroup
              aria-label="variantYScale"
              name="variantYScale"
              value={variantYScale}
              onChange={variantYScaleChangeHandler}
            >
              <FormControlLabel
                label="p-value"
                control={<Radio size="small" />}
                value="pValue"
              />
              <FormControlLabel
                label="Posterior probability"
                control={<Radio size="small" />}
                value="posteriorProbability"
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <div className={classes.higlass}>
          <HiGlassComponent
            ref={higlassInitHandler}
            viewConfig={viewConfig}
            options={options}
          />
        </div>
      </main>
    </div>
  );
};

export default Viewer;
