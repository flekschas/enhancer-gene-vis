import { identity } from '@flekschas/utils';
import { atom, RecoilState } from 'recoil';
import {
  ABC_SCORE_COLUMN,
  BIOSAMPLE_COLUMN,
  EG_TILE_UID,
  EG_TILE_V3,
  GENE_NAME_COLUMN,
} from '../constants';
import {
  booleanQueryStringDecoder,
  booleanQueryStringEncoder,
  numericQueryStringDecoder,
  numericQueryStringEncoder,
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';
import {
  OneDimensionalArcTrack,
  OpacityEncoding,
  StackedBarTrack,
  Track,
  TrackType,
} from '../view-config-types';
import { DEFAULT_STRATIFICATION, samples } from './stratification-state';
import {
  getDefault,
  SERVER_URL_TO_TRACK_SOURCE_ABBR,
  TrackSourceAbbr,
  TRACK_SOURCE_ABBR_TO_SERVER_URL,
} from './utils';

export type EnhancerGeneTrackInfo = {
  file?: File;
  server: string;
  tilesetUid: string;
  offsetField: number;
  enhancerStartField: number;
  geneNameField: number;
  tssStartField: number;
  tssEndField: number;
  importanceField: number;
  label: string;
};

const enum EnhancerRegionQueryKey {
  SHOW_INFO = 'eri',
  HIDE_UNFOCUSED = 'erhu',
  COLOR_ENCODING = 'erc',
  TRACK = 'ert',
  ARC_STROKE_OPACITY = 'erso',
}

export const DEFAULT_ENHANCER_REGION_SERVER_ABBR = TrackSourceAbbr.RG;
export const ENHANCER_START_COLUMN: number = 1; // V2 & V3
export const TSS_CHROM_COLUMN: number = EG_TILE_V3 ? 0 : 3;
export const TSS_START_COLUMN: number = 4; // V2 & V3
export const TSS_END_COLUMN: number = EG_TILE_V3 ? 4 : 5;
export const DEFAULT_ARC_TRACK_OPACITY = 0.05;
export const DEFAULT_ENHANCER_GENE_INFO: EnhancerGeneTrackInfo = {
  server: 'https://resgen.io/api/v1',
  tilesetUid: EG_TILE_UID,
  enhancerStartField: ENHANCER_START_COLUMN,
  offsetField: TSS_CHROM_COLUMN,
  tssStartField: TSS_START_COLUMN,
  tssEndField: TSS_END_COLUMN,
  importanceField: ABC_SCORE_COLUMN,
  geneNameField: GENE_NAME_COLUMN,
  label: 'Enhancer regions',
};
export const DEFAULT_ENHANCER_GENE_ARC_TRACK: OneDimensionalArcTrack = {
  type: TrackType.ARCS_1D,
  uid: 'arcs',
  server: 'https://resgen.io/api/v1',
  tilesetUid: EG_TILE_UID,
  height: 72,
  options: {
    labelPosition: 'hidden',
    strokeColor: '#808080',
    strokeWidth: 1,
    strokeOpacity: DEFAULT_ARC_TRACK_OPACITY,
    arcStyle: 'circle',
    startField: ENHANCER_START_COLUMN,
    endField: TSS_START_COLUMN,
    filter: {
      set: samples(DEFAULT_STRATIFICATION),
      field: BIOSAMPLE_COLUMN,
    },
  },
};
export const DEFAULT_ENHANCER_GENE_STACKED_BAR_TRACK: StackedBarTrack = {
  type: TrackType.STACKED_BAR,
  // server: 'http://localhost:9876/api/v1',
  // tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2hg19beddb',
  // tilesetUid:
  //   'AllPredictionsAvgHiCABC0015minus150ForABCPaperV3txtsimplifiedgzhg19beddb',
  server: 'https://resgen.io/api/v1',
  // tilesetUid: 'P0Ng5fhvQWeO7dlpx0FknA', // all chroms
  // tilesetUid: 'PGXLE50tQyOayNXKUnX4fQ', // just chr10
  // tilesetUid: 'AaJojHeORzKyiag1pSlAag', // bed
  tilesetUid: EG_TILE_UID,
  height: 72,
  uid: 'stacked-bars',
  options: {
    binSize: 4,
    axisAlign: 'right',
    axisPositionHorizontal: 'right',
    labelPosition: 'topLeft',
    markColor: 'black',
    markColorFocus: '#cc0078',
    markSize: 4,
    markOpacity: 0.33,
    labelColor: 'black',
    offsetField: TSS_CHROM_COLUMN,
    startField: TSS_START_COLUMN,
    endField: TSS_END_COLUMN,
    importanceField: ABC_SCORE_COLUMN,
    importanceDomain: [0, 1],
    focusRegion: [1680373143 + 81046453 - 25, 1680373143 + 81046453 + 25],
    name: 'Enhancer regions',
    stratification: DEFAULT_STRATIFICATION,
    showMousePosition: true,
    showGlobalMousePosition: true,
    mousePositionColor: 'black',
  },
};

/**
 * Encodes a Enhancer Region Track object into a colon-separated list of key properties.
 *
 * @param track The enhancer region track to encode
 * @returns The encoded string form of the variant track
 */
export function enhancerRegionTrackEncoder(
  track: EnhancerGeneTrackInfo
): string {
  const serverAbbr = SERVER_URL_TO_TRACK_SOURCE_ABBR[track.server];

  if (!track.tilesetUid || !serverAbbr) {
    throw new Error(
      `Invalid variant track encoder argument, track must have tilesetUid and valid server: ${track}`
    );
  }

  return [
    track.tilesetUid,
    serverAbbr,
    track.enhancerStartField,
    track.tssStartField,
    track.tssEndField,
    track.offsetField,
    track.geneNameField,
    track.importanceField,
    track.label,
  ].join(':');
}

/**
 * Decodes a string representing an enhancer region track back into an Enhancer Track object
 *
 * @param v The variant track string to decode
 * @returns An array containing a single variant track
 */
function enhancerRegionTrackDecoder(v?: string): EnhancerGeneTrackInfo {
  if (!v) throw new Error(`No string provided to variant track decoder`);

  // Example: tilesetId:rg
  const [
    tilesetUid,
    serverAbbr = DEFAULT_ENHANCER_REGION_SERVER_ABBR,
    enhancerStartField = ENHANCER_START_COLUMN,
    startField = TSS_START_COLUMN,
    endField = TSS_END_COLUMN,
    offsetField = TSS_CHROM_COLUMN,
    geneNameField = GENE_NAME_COLUMN,
    importanceField = ABC_SCORE_COLUMN,
    label,
  ] = v.split(':');

  const server = TRACK_SOURCE_ABBR_TO_SERVER_URL[serverAbbr as TrackSourceAbbr];

  if (tilesetUid === undefined) return tilesetUid;

  return {
    server,
    tilesetUid,
    enhancerStartField: parseInt(enhancerStartField.toString(), 10),
    tssStartField: parseInt(startField.toString(), 10),
    tssEndField: parseInt(endField.toString(), 10),
    offsetField: parseInt(offsetField.toString(), 10),
    geneNameField: parseInt(geneNameField.toString(), 10),
    importanceField: parseInt(importanceField.toString(), 10),
    label,
  } as EnhancerGeneTrackInfo;
}

export const enhancerRegionsTrackState: RecoilState<EnhancerGeneTrackInfo> =
  atom({
    key: EnhancerRegionQueryKey.TRACK,
    default: getDefault(
      EnhancerRegionQueryKey.TRACK,
      DEFAULT_ENHANCER_GENE_INFO,
      enhancerRegionTrackDecoder
    ),
  });

export const enhancerRegionsHideUnfocusedState: RecoilState<boolean> = atom({
  key: 'enhancerRegionsHideUnfocused',
  default: getDefault(
    EnhancerRegionQueryKey.HIDE_UNFOCUSED,
    false,
    booleanQueryStringDecoder
  ),
});

export const enhancerRegionsColorEncodingState: RecoilState<OpacityEncoding> =
  atom({
    key: 'enhancerRegionsColorEncoding',
    default: getDefault(
      EnhancerRegionQueryKey.COLOR_ENCODING,
      OpacityEncoding.SOLID,
      (v) => v as OpacityEncoding
    ),
  });

export const enhancerRegionsShowInfoState: RecoilState<boolean> = atom({
  key: 'enhancerRegionsShowInfos',
  default: getDefault(
    EnhancerRegionQueryKey.SHOW_INFO,
    true,
    booleanQueryStringDecoder
  ),
});

export const enhancerRegionsArcStrokeOpacityState: RecoilState<number> = atom({
  key: 'enhancerRegionsArcStrokeOpacity',
  default: getDefault(
    EnhancerRegionQueryKey.ARC_STROKE_OPACITY,
    DEFAULT_ARC_TRACK_OPACITY,
    numericQueryStringDecoder
  ),
});

export const useEnhancerRegionsTrack = () =>
  useRecoilQueryString(
    EnhancerRegionQueryKey.TRACK,
    enhancerRegionsTrackState,
    enhancerRegionTrackEncoder
  );
export const useEnhancerRegionsTrackSyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerRegionQueryKey.TRACK,
    enhancerRegionsTrackState,
    enhancerRegionTrackEncoder
  );

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

export const useEnhancerRegionsArcTrackOpacity = () =>
  useRecoilQueryString(
    EnhancerRegionQueryKey.ARC_STROKE_OPACITY,
    enhancerRegionsArcStrokeOpacityState,
    numericQueryStringEncoder
  );
export const useEnhancerRegionsArcTrackOpacitySyncher = () =>
  useRecoilQueryStringSyncher(
    EnhancerRegionQueryKey.ARC_STROKE_OPACITY,
    enhancerRegionsArcStrokeOpacityState,
    numericQueryStringEncoder
  );
