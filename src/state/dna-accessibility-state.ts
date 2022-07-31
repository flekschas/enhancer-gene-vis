import { identity } from 'lodash-es';
import { atom, RecoilState } from 'recoil';
import { booleanQueryStringDecoder } from '../utils';
import {
  booleanQueryStringEncoder,
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';
import { DnaAccessibilityLabelStyle } from '../view-config-types';
import { getDefault } from './utils';

export const dnaAccessLabelStyleState: RecoilState<DnaAccessibilityLabelStyle> = atom(
  {
    key: 'dnaAccessLabelStyle',
    default: getDefault<DnaAccessibilityLabelStyle>(
      'dal',
      DnaAccessibilityLabelStyle.INDICATOR,
      identity
    ),
  }
);

export const dnaAccessRowNormState: RecoilState<boolean> = atom({
  key: 'dnaAccessRowNorm',
  default: getDefault('darn', true, booleanQueryStringDecoder),
});

export const dnaAccessLabelShowInfoState: RecoilState<boolean> = atom({
  key: 'dnaAccessLabelShowInfos',
  default: getDefault('dai', true, booleanQueryStringDecoder),
});

export const useDnaAccessLabelStyle = () =>
  useRecoilQueryString('dal', dnaAccessLabelStyleState, identity);
export const useDnaAccessLabelStyleSyncher = () =>
  useRecoilQueryStringSyncher('dal', dnaAccessLabelStyleState, identity);

export const useDnaAccessRowNorm = () =>
  useRecoilQueryString(
    'darn',
    dnaAccessRowNormState,
    booleanQueryStringEncoder
  );
export const useDnaAccessRowNormSyncher = () =>
  useRecoilQueryStringSyncher(
    'darn',
    dnaAccessRowNormState,
    booleanQueryStringEncoder
  );

export const useDnaAccessShowInfos = () =>
  useRecoilQueryString(
    'dai',
    dnaAccessLabelShowInfoState,
    booleanQueryStringEncoder
  );
export const useDnaAccessShowInfosSyncher = () =>
  useRecoilQueryStringSyncher(
    'dai',
    dnaAccessLabelShowInfoState,
    booleanQueryStringEncoder
  );
