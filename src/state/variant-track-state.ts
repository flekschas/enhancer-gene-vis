import { deepClone } from '@flekschas/utils';
import { atom, RecoilState } from 'recoil';
import {
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';
import { getDefault } from './utils';

type VariantTrack = {
  server: string;
  tilesetUid: string;
  columnPvalue: number;
  columnPosteriorProbability: number;
  markColor: string;
  label: string;
};

const enum VariantTrackAbbr {
  RG = 'rg',
  HG = 'hg',
}

const VARIANT_TRACK_ABBR_TO_SERVER: Record<VariantTrackAbbr, string> = {
  [VariantTrackAbbr.RG]: 'https://resgen.io/api/v1',
  [VariantTrackAbbr.HG]: 'https://higlass.io/api/v1',
};

const VARIANT_TRACK_SERVER_TO_ABBR: Record<
  string,
  VariantTrackAbbr
> = Object.fromEntries(
  Object.entries(VARIANT_TRACK_ABBR_TO_SERVER).map((kvPair) => kvPair.reverse())
);

const DEFAULT_VARIANT_TRACK_SERVER_ABBR = VariantTrackAbbr.RG;
const DEFAULT_VARIANT_TRACK_PVAL_COL = '7';
const DEFAULT_VARIANT_TRACK_PPROB_COL = '8';

export const DEFAULT_VARIANT_TRACKS: VariantTrack[] = [
  {
    server: 'https://resgen.io/api/v1',
    tilesetUid: 'VF5-RDXWTxidGMJU7FeaxA',
    columnPvalue: 7,
    columnPosteriorProbability: 8,
    markColor: 'black',
    label: 'IBD Variants',
  },
];

// TODO: Add strict type definition
export const DEFAULT_VARIANT_TRACK_DEF = {
  type: 'point-annotation',
  height: 32,
  options: {
    axisPositionHorizontal: 'right',
    markColor: 'black',
    markColorFocus: '#cc0078',
    markSize: 2,
    markOpacity: 0.33,
    markOpacityFocus: 0.66,
    valueColumn: 7,
    name: 'Variants',
    labelPosition: 'topLeft',
    labelColor: 'black',
    labelOpacity: 0.33,
    showMousePosition: true,
    showGlobalMousePosition: true,
    mousePositionColor: 'black',
    toolTip: {
      name: {
        field: 3,
      },
      value: {
        field: 6,
        numDecimals: 2,
      },
      other: [
        {
          label: 'Post. Prob.',
          field: 7,
          numDecimals: 2,
        },
      ],
    },
  },
};

/**
 * Encodes a VariantTrack object into a colon-separated list of key properties.
 *
 * @param v The length-one variant track array to encode
 * @returns The encoded string form of the variant track
 */
export function variantTracksEncoder(v: VariantTrack[]): string {
  if (!v || !Array.isArray(v) || v.length > 1) {
    throw new Error(
      `Invalid variant track encoder argument provided, is not array: ${v}`
    );
  }

  const track = v[0];
  const serverAbbr = VARIANT_TRACK_SERVER_TO_ABBR[track.server];

  if (!track.tilesetUid || !serverAbbr) {
    throw new Error(
      `Invalid variant track encoder argument, track must have tilesetUid and valid server: ${v}`
    );
  }

  return [
    track.tilesetUid,
    serverAbbr,
    track.columnPvalue,
    track.columnPosteriorProbability,
  ].join(':');
}

/**
 * Decodes a string representing a variant track back into a length-one VariantTrack array.
 *
 * @param v The variant track string to decode
 * @returns An array containing a single variant track
 */
function variantTracksDecoder(v?: string): VariantTrack[] {
  console.log('Decoding');
  console.log(v);
  if (!v) throw new Error(`No string provided to variant track decoder`);

  // Example: tilesetId:rg:7:8
  const [
    tilesetUid,
    serverAbbr = DEFAULT_VARIANT_TRACK_SERVER_ABBR,
    columnPvalue = DEFAULT_VARIANT_TRACK_PVAL_COL,
    columnPosteriorProbability = DEFAULT_VARIANT_TRACK_PPROB_COL,
  ] = v.split(':');

  const server = VARIANT_TRACK_ABBR_TO_SERVER[serverAbbr as VariantTrackAbbr];

  if (tilesetUid === undefined) return tilesetUid;

  return [
    {
      server,
      tilesetUid,
      columnPvalue: parseInt(columnPvalue, 10),
      columnPosteriorProbability: parseInt(columnPosteriorProbability, 10),
      markColor: 'black',
    } as VariantTrack,
  ];
}

export const variantTracksState: RecoilState<VariantTrack[]> = atom({
  key: 'variantTracks',
  default: getDefault(
    'vt',
    deepClone(DEFAULT_VARIANT_TRACKS),
    variantTracksDecoder
  ),
});

export function useVariantTracks(): [
  VariantTrack[],
  (x: VariantTrack[]) => void
] {
  return useRecoilQueryString('vt', variantTracksState, variantTracksEncoder);
}

export function useVariantTracksSyncher(): void {
  useRecoilQueryStringSyncher('vt', variantTracksState, variantTracksEncoder);
}
