import { memoize } from 'lodash-es';
import { atom, RecoilState, selector } from 'recoil';
import { BIOSAMPLE_COLUMN } from '../constants';

export type Stratification = {
  categoryField: number;
  axisShowGroupSeparator: boolean;
  axisNoGroupColor: boolean;
  groups: StratificationGroup[];
};

export type StratificationGroup = {
  label: string;
  categories: string[];
  color?: string;
  backgroundColor?: string;
};

export type GroupedSampleOption = {
  name: string;
  options: string[];
};

export type SampleGroup = {
  checked: boolean;
  visible: boolean;
  n: number;
  N: number;
};

export const DEFAULT_STRATIFICATION: Stratification = {
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

export const stratificationState: RecoilState<Stratification> = atom({
  key: 'stratificationState',
  default: DEFAULT_STRATIFICATION,
});

export const sampleGroupWithGroup = memoize(
  (group) =>
    atom<SampleGroup>({
      key: `sampleGroup-${group.name}`,
      default: {
        checked: true,
        visible: true,
        n: group.options.length,
        N: group.options.length,
      },
    }),
  (group) => group.name
);

export const sampleGroupSelectionSizesState = selector({
  key: 'sampleGroupSelectionSizes',
  get: ({ get }) =>
    groupedSampleOptions(get(stratificationState)).reduce(
      (sizes: { [key: string]: number }, group) => {
        sizes[group.name] = get(sampleGroupWithGroup(group)).n;
        return sizes;
      },
      {}
    ),
});

export function groupedSampleOptions(
  stratification: Stratification
): GroupedSampleOption[] {
  return stratification.groups.map((group: StratificationGroup) => ({
    name: group.label,
    options: group.categories,
  }));
}

export function sampleToGroup(
  stratification: Stratification
): { [key: string]: string } {
  return groupedSampleOptions(stratification).reduce(
    (sampleToGroupObj: { [key: string]: string }, group) => {
      group.options.forEach((option) => {
        sampleToGroupObj[option] = group.name;
      });
      return sampleToGroupObj;
    },
    {}
  );
}

export function samples(stratification: Stratification): string[] {
  return groupedSampleOptions(stratification).flatMap(
    (group: GroupedSampleOption) => group.options
  );
}

export function sampleIdx(
  stratification: Stratification
): { [key: string]: number } {
  return samples(stratification).reduce(
    (idxs: { [key: string]: number }, sample: string, idx: number) => {
      idxs[sample] = idx;
      return idxs;
    },
    {}
  );
}
