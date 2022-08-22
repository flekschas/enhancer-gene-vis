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

  if (tilesetUid === undefined) return tilesetUid;

  return {
    server,
    tilesetUid,
    label,
  } as DnaAccessibilityTrackInfo;
}

export const dnaAccessibilityTrackState: RecoilState<DnaAccessibilityTrackInfo> =
  atom({
    key: 'dats',
    default: getDefault(
      'dats',
      DEFAULT_DNA_ACCESSIBILITY_TRACK_INFO,
      dnaAccessibilityTrackInfoDecoder
    ),
  });

export const dnaAccessLabelStyleState: RecoilState<RidgePlotTrackLabelStyle> =
  atom({
    key: 'dnaAccessLabelStyle',
    default: getDefault<RidgePlotTrackLabelStyle>(
      'dal',
      RidgePlotTrackLabelStyle.INDICATOR,
      identity
    ),
  });

export const dnaAccessRowNormState: RecoilState<boolean> = atom({
  key: 'dnaAccessRowNorm',
  default: getDefault('darn', true, booleanQueryStringDecoder),
});

export const dnaAccessLabelShowInfoState: RecoilState<boolean> = atom({
  key: 'dnaAccessLabelShowInfos',
  default: getDefault('dai', true, booleanQueryStringDecoder),
});

export const useDnaAccessibilityTrack = () =>
  useRecoilQueryString(
    'dats',
    dnaAccessibilityTrackState,
    dnaAccessibilityTrackInfoEncoder
  );
export const useDnaAccessibilityTrackSyncher = () =>
  useRecoilQueryStringSyncher(
    'dats',
    dnaAccessibilityTrackState,
    dnaAccessibilityTrackInfoEncoder
  );

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
