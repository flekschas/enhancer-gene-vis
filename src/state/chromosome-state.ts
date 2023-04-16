import { identity } from '@flekschas/utils';
import { ChromosomeInfoResult } from 'higlass';
import { atom, RecoilState } from 'recoil';
import {
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';

const enum ChromosomeStateQueryKey {
  REF_GENOME = 'csrg',
}

export const enum RefGenome {
  HG19 = 'hg19',
  HG38 = 'hg38',
}

export const RefGenomeSrc: Record<RefGenome, string> = {
  [RefGenome.HG19]:
    'https://raw.githubusercontent.com/flekschas/enhancer-gene-vis/chrom-info/data/chrom-sizes/hg19.tsv',
  [RefGenome.HG38]:
    'https://raw.githubusercontent.com/flekschas/enhancer-gene-vis/chrom-info/data/chrom-sizes/hg38.tsv',
};

export const refGenomeState: RecoilState<RefGenome> = atom<RefGenome>({
  key: 'refGenome',
  default: RefGenome.HG19,
});

export const chromosomeInfoResultState: RecoilState<
  ChromosomeInfoResult | undefined
> = atom<ChromosomeInfoResult | undefined>({
  key: 'chromosomeInfoResult',
  default: undefined,
});

export const useRefGenomeState = () =>
  useRecoilQueryString(
    ChromosomeStateQueryKey.REF_GENOME,
    refGenomeState,
    identity
  );

export const useRefGenomeStateSyncher = () =>
  useRecoilQueryStringSyncher(
    ChromosomeStateQueryKey.REF_GENOME,
    refGenomeState,
    identity
  );
