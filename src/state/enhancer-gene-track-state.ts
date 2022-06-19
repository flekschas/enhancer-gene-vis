import { identity } from '@flekschas/utils';
import { atom } from 'recoil';
import { booleanQueryStringDecoder, useRecoilQueryString, useRecoilQueryStringSyncher } from '../utils/query-string';
import { getDefault } from './utils';


export const enhancerGenesShowInfoState = atom({
  key: 'enhancerGenesShowInfos',
  default: getDefault('egi', true, booleanQueryStringDecoder),
});

export const enhancerGenesPaddingState = atom({
  key: 'enhancerGenesPadding',
  default: getDefault('egp', false, booleanQueryStringDecoder),
});

export const enhancerGenesCellEncodingState = atom({
  key: 'enhancerGenesCellEncoding',
  default: getDefault('egce', 'max-score', identity),
});

export const enhancerGenesSvgState = atom({
  key: 'enhancerGenesSvg',
  default: null,
});

export const useEnhancerGenesShowInfos = () =>
  useRecoilQueryString('egi', enhancerGenesShowInfoState, toString);
export const useEnhancerGenesShowInfosSyncher = () =>
  useRecoilQueryStringSyncher('egi', enhancerGenesShowInfoState, toString);

export const useEnhancerGenesPadding = () =>
  useRecoilQueryString('egp', enhancerGenesPaddingState, toString);
export const useEnhancerGenesPaddingSyncher = () =>
  useRecoilQueryStringSyncher('egp', enhancerGenesPaddingState, toString);

export const useEnhancerGenesCellEncoding = () =>
  useRecoilQueryString('egce', enhancerGenesCellEncodingState, identity);
export const useEnhancerGenesCellEncodingSyncher = () =>
  useRecoilQueryStringSyncher('egce', enhancerGenesCellEncodingState, identity);