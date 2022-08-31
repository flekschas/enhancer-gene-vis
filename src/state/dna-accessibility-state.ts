import { identity } from 'lodash-es';
import { atom, RecoilState } from 'recoil';
import { DEFAULT_DNA_ACCESSIBILITY_TRACK_UID } from '../components/dna-accessibility/constants-dna-accessibility';
import { booleanQueryStringDecoder } from '../utils';
import {
  booleanQueryStringEncoder,
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';
import { RidgePlotTrackLabelStyle } from '../view-config-types';
import { DEFAULT_ENHANCER_REGION_SERVER_ABBR } from './enhancer-region-state';
import {
  getDefault,
  SERVER_URL_TO_TRACK_SOURCE_ABBR,
  TrackSourceAbbr,
  TRACK_SOURCE_ABBR_TO_SERVER_URL,
} from './utils';

const enum DnaAccessibilityQueryKey {
  EXP_TRACK = 'daet',
  PRED_TRACK = 'dapt',
  LABEL_STYLE = 'dals',
  ROW_NORM = 'darn',
  SHOW_INFO = 'dasi',
  SHOW_PRED_TRACK = 'dasp',
}

export type DnaAccessibilityTrackInfo = {
  server: string;
  tilesetUid: string;
  label: string;
};

export const DEFAULT_DNA_ACCESSIBILITY_TRACK_INFO: DnaAccessibilityTrackInfo = {
  server: 'https://resgen.io/api/v1',
  tilesetUid: DEFAULT_DNA_ACCESSIBILITY_TRACK_UID,
  label: 'DNA Accessibility',
};

export function dnaAccessibilityTrackInfoEncoder(
  track: DnaAccessibilityTrackInfo
): string {
  const serverAbbr = SERVER_URL_TO_TRACK_SOURCE_ABBR[track.server];

  if (!track.tilesetUid || !serverAbbr) {
    throw new Error(
      `Invalid DNA accessibility track encoder argument, track must have tilesetUid and valid server: ${track}`
    );
  }

  return [track.tilesetUid, serverAbbr, track.label].join(':');
}

/**
 * Decodes a string representing an enhancer region track back into an Enhancer Track object
 *
 * @param v The variant track string to decode
 * @returns An array containing a single variant track
 */
function dnaAccessibilityTrackInfoDecoder(
  v?: string
): DnaAccessibilityTrackInfo {
  if (!v) throw new Error(`No string provided to variant track decoder`);

  // Example: tilesetId:rg
  const [tilesetUid, serverAbbr = DEFAULT_ENHANCER_REGION_SERVER_ABBR, label] =
    v.split(':');

  const server = TRACK_SOURCE_ABBR_TO_SERVER_URL[serverAbbr as TrackSourceAbbr];

  return {
    server,
    tilesetUid,
    label,
  } as DnaAccessibilityTrackInfo;
}

export const dnaAccessibilityExperimentalTrackState: RecoilState<DnaAccessibilityTrackInfo> =
  atom({
    key: DnaAccessibilityQueryKey.EXP_TRACK,
    default: getDefault(
      DnaAccessibilityQueryKey.EXP_TRACK,
      DEFAULT_DNA_ACCESSIBILITY_TRACK_INFO,
      dnaAccessibilityTrackInfoDecoder
    ),
  });

export const dnaAccessibilityPredictedTrackState: RecoilState<DnaAccessibilityTrackInfo> =
  atom({
    key: DnaAccessibilityQueryKey.PRED_TRACK,
    default: getDefault(
      DnaAccessibilityQueryKey.PRED_TRACK,
      // TODO: Replace when we have a default BPNet prediction track for sample data
      DEFAULT_DNA_ACCESSIBILITY_TRACK_INFO,
      dnaAccessibilityTrackInfoDecoder
    ),
  });

export const dnaAccessLabelStyleState: RecoilState<RidgePlotTrackLabelStyle> =
  atom({
    key: DnaAccessibilityQueryKey.LABEL_STYLE,
    default: getDefault<RidgePlotTrackLabelStyle>(
      DnaAccessibilityQueryKey.LABEL_STYLE,
      RidgePlotTrackLabelStyle.INDICATOR,
      identity
    ),
  });

export const dnaAccessRowNormState: RecoilState<boolean> = atom({
  key: DnaAccessibilityQueryKey.ROW_NORM,
  default: getDefault(
    DnaAccessibilityQueryKey.ROW_NORM,
    true,
    booleanQueryStringDecoder
  ),
});

export const dnaAccessLabelShowInfoState: RecoilState<boolean> = atom({
  key: DnaAccessibilityQueryKey.SHOW_INFO,
  default: getDefault(
    DnaAccessibilityQueryKey.SHOW_INFO,
    true,
    booleanQueryStringDecoder
  ),
});

export const dnaAccessShowPredTrack: RecoilState<boolean> = atom({
  key: DnaAccessibilityQueryKey.SHOW_PRED_TRACK,
  default: getDefault(
    DnaAccessibilityQueryKey.SHOW_PRED_TRACK,
    // TODO: maybe switch to true by default?
    false,
    booleanQueryStringDecoder
  ),
});

export const useDnaAccessibilityExperimentalTrack = () =>
  useRecoilQueryString(
    DnaAccessibilityQueryKey.EXP_TRACK,
    dnaAccessibilityExperimentalTrackState,
    dnaAccessibilityTrackInfoEncoder
  );
export const useDnaAccessibilityExperimentalTrackSyncher = () =>
  useRecoilQueryStringSyncher(
    DnaAccessibilityQueryKey.EXP_TRACK,
    dnaAccessibilityExperimentalTrackState,
    dnaAccessibilityTrackInfoEncoder
  );

export const useDnaAccessibilityPredictionTrack = () =>
  useRecoilQueryString(
    DnaAccessibilityQueryKey.PRED_TRACK,
    dnaAccessibilityExperimentalTrackState,
    dnaAccessibilityTrackInfoEncoder
  );
export const useDnaAccessibilityPredictionTrackSyncher = () =>
  useRecoilQueryStringSyncher(
    DnaAccessibilityQueryKey.PRED_TRACK,
    dnaAccessibilityExperimentalTrackState,
    dnaAccessibilityTrackInfoEncoder
  );

export const useDnaAccessLabelStyle = () =>
  useRecoilQueryString(
    DnaAccessibilityQueryKey.LABEL_STYLE,
    dnaAccessLabelStyleState,
    identity
  );
export const useDnaAccessLabelStyleSyncher = () =>
  useRecoilQueryStringSyncher(
    DnaAccessibilityQueryKey.LABEL_STYLE,
    dnaAccessLabelStyleState,
    identity
  );

export const useDnaAccessRowNorm = () =>
  useRecoilQueryString(
    DnaAccessibilityQueryKey.ROW_NORM,
    dnaAccessRowNormState,
    booleanQueryStringEncoder
  );
export const useDnaAccessRowNormSyncher = () =>
  useRecoilQueryStringSyncher(
    DnaAccessibilityQueryKey.ROW_NORM,
    dnaAccessRowNormState,
    booleanQueryStringEncoder
  );

export const useDnaAccessShowInfos = () =>
  useRecoilQueryString(
    DnaAccessibilityQueryKey.SHOW_INFO,
    dnaAccessLabelShowInfoState,
    booleanQueryStringEncoder
  );
export const useDnaAccessShowInfosSyncher = () =>
  useRecoilQueryStringSyncher(
    DnaAccessibilityQueryKey.SHOW_INFO,
    dnaAccessLabelShowInfoState,
    booleanQueryStringEncoder
  );

export const useDnaAccessShowPredTrack = () =>
  useRecoilQueryString(
    DnaAccessibilityQueryKey.SHOW_PRED_TRACK,
    dnaAccessShowPredTrack,
    booleanQueryStringEncoder
  );
export const useDnaAccessShowPredTrackSyncher = () =>
  useRecoilQueryStringSyncher(
    DnaAccessibilityQueryKey.SHOW_PRED_TRACK,
    dnaAccessShowPredTrack,
    booleanQueryStringEncoder
  );
