import { identity } from '@flekschas/utils';
import { atom, RecoilState } from 'recoil';
import {
  booleanQueryStringDecoder,
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';
import { getDefault } from './utils';

const enum EnhancerGeneQueryKey {
  SHOW_INFO = 'egi',
  PADDING = 'egp',
  CELL_ENCODING = 'egce',
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

export const enhancerGenesCellEncodingState: RecoilState<string> = atom({
  key: 'enhancerGenesCellEncoding',
  default: getDefault(
    EnhancerGeneQueryKey.CELL_ENCODING,
    'max-score',
    identity
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
    toString
  );

export const useEnhancerGenesShowInfosSyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerGeneQueryKey.SHOW_INFO,
    enhancerGenesShowInfoState,
    toString
  );

export const useEnhancerGenesPadding = () =>
  useRecoilQueryString(
    EnhancerGeneQueryKey.PADDING,
    enhancerGenesPaddingState,
    toString
  );

export const useEnhancerGenesPaddingSyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerGeneQueryKey.PADDING,
    enhancerGenesPaddingState,
    toString
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
