import { identity } from '@flekschas/utils';
import { atom, RecoilState } from 'recoil';
import {
  booleanQueryStringDecoder,
  booleanQueryStringEncoder,
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';
import { getDefault } from './utils';

const enum EnhancerRegionQueryKey {
  SHOW_INFO = 'eri',
  HIDE_UNFOCUSED = 'erhu',
  COLOR_ENCODING = 'erc',
}

export const enhancerRegionsHideUnfocusedState: RecoilState<boolean> = atom({
  key: 'enhancerRegionsHideUnfocused',
  default: getDefault(
    EnhancerRegionQueryKey.HIDE_UNFOCUSED,
    false,
    booleanQueryStringDecoder
  ),
});

export const enhancerRegionsColorEncodingState: RecoilState<string> = atom({
  key: 'enhancerRegionsColorEncoding',
  default: getDefault(EnhancerRegionQueryKey.COLOR_ENCODING, 'solid', identity),
});

export const enhancerRegionsShowInfoState: RecoilState<boolean> = atom({
  key: 'enhancerRegionsShowInfos',
  default: getDefault(
    EnhancerRegionQueryKey.SHOW_INFO,
    true,
    booleanQueryStringDecoder
  ),
});

export const useEnhancerRegionsShowInfos = () =>
  useRecoilQueryString(
    EnhancerRegionQueryKey.SHOW_INFO,
    enhancerRegionsShowInfoState,
    booleanQueryStringEncoder
  );
export const useEnhancerRegionsShowInfosSyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerRegionQueryKey.SHOW_INFO,
    enhancerRegionsShowInfoState,
    booleanQueryStringEncoder
  );

export const useEnhancerRegionsHideUnfocused = () =>
  useRecoilQueryString(
    EnhancerRegionQueryKey.HIDE_UNFOCUSED,
    enhancerRegionsHideUnfocusedState,
    booleanQueryStringEncoder
  );
export const useEnhancerRegionsHideUnfocusedSyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerRegionQueryKey.HIDE_UNFOCUSED,
    enhancerRegionsHideUnfocusedState,
    booleanQueryStringEncoder
  );

export const useEnhancerRegionsColorEncoding = () =>
  useRecoilQueryString(
    EnhancerRegionQueryKey.COLOR_ENCODING,
    enhancerRegionsColorEncodingState,
    identity
  );
export const useEnhancerRegionsColorEncodingSyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerRegionQueryKey.COLOR_ENCODING,
    enhancerRegionsColorEncodingState,
    identity
  );
