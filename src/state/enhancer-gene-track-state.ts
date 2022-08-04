import { identity } from '@flekschas/utils';
import { atom, RecoilState } from 'recoil';
import {
  booleanQueryStringDecoder,
  booleanQueryStringEncoder,
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';
import { getDefault } from './utils';

const enum EnhancerGeneQueryKey {
  SHOW_INFO = 'egi',
  PADDING = 'egp',
  CELL_ENCODING = 'egce',
}

export const enum EnhancerGeneCellEncodingType {
  MAX_SCORE = 'max-score',
  NUMBER = 'number',
  PERCENT = 'percent',
  DISTRIBUTION = 'distribution',
  ARRAY = 'array',
}

export const enhancerGenesShowInfoState: RecoilState<boolean> = atom({
  key: 'enhancerGenesShowInfos',
  default: getDefault(
    EnhancerGeneQueryKey.SHOW_INFO,
    true,
    booleanQueryStringDecoder
  ),
});

export const enhancerGenesPaddingState: RecoilState<boolean> = atom({
  key: 'enhancerGenesPadding',
  default: getDefault(
    EnhancerGeneQueryKey.PADDING,
    false,
    booleanQueryStringDecoder
  ),
});

export const enhancerGenesCellEncodingState: RecoilState<EnhancerGeneCellEncodingType> =
  atom({
    key: 'enhancerGenesCellEncoding',
    default: getDefault(
      EnhancerGeneQueryKey.CELL_ENCODING,
      EnhancerGeneCellEncodingType.MAX_SCORE,
      (string) => string as EnhancerGeneCellEncodingType
    ),
  });

// TODO: Determine type for this atom
export const enhancerGenesSvgState = atom({
  key: 'enhancerGenesSvg',
  default: null,
});

export const useEnhancerGenesShowInfos = () =>
  useRecoilQueryString(
    EnhancerGeneQueryKey.SHOW_INFO,
    enhancerGenesShowInfoState,
    booleanQueryStringEncoder
  );

export const useEnhancerGenesShowInfosSyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerGeneQueryKey.SHOW_INFO,
    enhancerGenesShowInfoState,
    booleanQueryStringEncoder
  );

export const useEnhancerGenesPadding = () =>
  useRecoilQueryString(
    EnhancerGeneQueryKey.PADDING,
    enhancerGenesPaddingState,
    booleanQueryStringEncoder
  );

export const useEnhancerGenesPaddingSyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerGeneQueryKey.PADDING,
    enhancerGenesPaddingState,
    booleanQueryStringEncoder
  );

export const useEnhancerGenesCellEncoding = () =>
  useRecoilQueryString(
    EnhancerGeneQueryKey.CELL_ENCODING,
    enhancerGenesCellEncodingState,
    identity
  );

export const useEnhancerGenesCellEncodingSyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerGeneQueryKey.CELL_ENCODING,
    enhancerGenesCellEncodingState,
    identity
  );
