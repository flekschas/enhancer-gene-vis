import React, { useCallback, useRef, useState } from 'react';
import { HiGlassComponent } from 'higlass';
import { debounce, deepClone } from '@flekschas/utils';

import { RadioButton, RadioGroup } from './radio';
import { toAbsPosition } from './utils';

import 'higlass/dist/hglib.css';
import './Viewer.css';

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

const DEFAULT_VIEW_CONFIG = {
  editable: true,
  trackSourceServers: [
    '//higlass.io/api/v1',
    'https://resgen.io/api/v1/gt/paper-data',
  ],
  views: [
    {
      uid: 'view1',
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
            type: 'horizontal-gene-annotations',
            uid: 'genes',
            height: 48,
            server: 'https://resgen.io/api/v1',
            tilesetUid: 'NCifnbrKQu6j-ohVWJLoJw',
            options: {
              fontSize: 9,
              labelColor: 'black',
              geneAnnotationHeight: 12,
              geneLabelPosition: 'outside',
              geneStrandSpacing: 2,
            },
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
            // server: 'http://localhost:9876/api/v1',
            // tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2chr10',
            server: 'https://resgen.io/api/v1',
            tilesetUid: 'PGXLE50tQyOayNXKUnX4fQ',
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
            // server: 'http://localhost:9876/api/v1',
            // tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2chr10',
            server: 'https://resgen.io/api/v1',
            tilesetUid: 'PGXLE50tQyOayNXKUnX4fQ',
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
            'genes',
            'ibd-snps',
            'microglia',
            // 'indicatorStart',
            // 'indicatorEnd',
            // 'arcs',
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
          includes: ['genes'],
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
      ],
      layout: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
      },
      initialXDomain: [1761366260, 1761603836],
      initialYDomain: [1761257024, 1761318261],
    },
  ],
};

const DEFAULT_HIGLASS_OPTIONS = {
  sizeMode: 'bounded',
};

const Viewer = (props) => {
  const [focusGene, setFocusGene] = useState('');
  const [focusVariant, setFocusVariant] = useState('chr10:81046453');
  const [variantYScale, setVariantYScale] = useState('pValue');
  const [options, setOptions] = useState(DEFAULT_HIGLASS_OPTIONS);
  const [viewConfig, setViewConfig] = useState(DEFAULT_VIEW_CONFIG);
  const higlassApi = useRef(null);

  const updateFocusGeneInHiglass = (name, start, end) => {
    const newViewConfig = JSON.parse(JSON.stringify(viewConfig));
    const n = newViewConfig.views[0].tracks.top.length;

    if (name) {
      newViewConfig.views[0].tracks.top[n - 1].options.focusGene = name;
      newViewConfig.views[0].overlays[1].options.extent = [[start, end]];
    } else {
      delete newViewConfig.views[0].tracks.top[n - 1].options.focusGene;
      delete newViewConfig.views[0].overlays[1].options.extent;
    }

    setViewConfig(newViewConfig);
  };

  const clearFocusGene = () => {
    setFocusGene('');
    updateFocusGeneInHiglass();
  };

  const updateFocusVariantInHiglass = (variant) => {
    const newViewConfig = deepClone(viewConfig);
    // const n = newViewConfig.views.length;

    const absPosition = toAbsPosition(variant, props.chromInfo);
    const focusRegion = Number.isNaN(+absPosition)
      ? []
      : [absPosition - 0.5, absPosition + 0.5];

    newViewConfig.views[0].tracks.top[2].options.focusRegion = focusRegion;
    newViewConfig.views[0].tracks.top[4].options.focusRegion = focusRegion;
    // newViewConfig.views[0].tracks.top[n - 1].options.focusRegion = focusRegion;
    newViewConfig.views[0].overlays[0].options.extent = [focusRegion];

    setViewConfig(newViewConfig);
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
    const newViewConfig = deepClone(viewConfig);

    newViewConfig.views[0].tracks.top[2].options.valueColumn =
      yScale === 'pValue' ? 7 : 8;

    setViewConfig(newViewConfig);
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

  const higlassInitHandler = useCallback((higlassInstance) => {
    if (higlassInstance !== null) {
      higlassApi.current = higlassInstance.api;
      higlassInstance.api.on('click', higlassClickHandler);
    }
  }, []);

  return (
    <div className="Viewer">
      <aside>
        <div>
          <label htmlFor="focus-gene" className="main-label">
            Focus gene:
          </label>
          <div className="flex-box">
            <input
              type="text"
              id="focus-gene"
              value={focusGene}
              readOnly
              disabled
              placeholder="Click on a gene"
            />
            <button onClick={clearFocusGene}>clear</button>
          </div>
        </div>
        <div>
          <label htmlFor="focus-variant" className="main-label">
            Focus variant:
          </label>
          <div className="flex-box">
            <input
              type="text"
              id="focus-variant"
              value={focusVariant}
              onChange={focusVariantChangeHandler}
              placeholder="chr10:81046453"
            />
            <button onClick={clearFocusVariant}>clear</button>
          </div>
        </div>
        <div>
          <label className="main-label">Variant y-scale:</label>
          <RadioGroup
            name="variantYScale"
            onChange={variantYScaleChangeHandler}
          >
            <RadioButton
              label="p-value"
              value="pValue"
              checked={variantYScale === 'pValue'}
            />
            <RadioButton
              label="Posterior probability"
              value="posteriorProbability"
              checked={variantYScale === 'posteriorProbability'}
            />
          </RadioGroup>
        </div>
      </aside>
      <div className="higlass-container">
        <HiGlassComponent
          ref={higlassInitHandler}
          viewConfig={viewConfig}
          options={options}
        />
      </div>
    </div>
  );
};

export default Viewer;
