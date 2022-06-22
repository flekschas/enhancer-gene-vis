import { QueryStringDecoder, getQueryStringValue } from '../utils/query-string';

export function getDefault<T>(
  key: string,
  initialValue: T,
  decoder: QueryStringDecoder<T>
) {
  const qVal = getQueryStringValue(key, decoder);
  return qVal === undefined ? initialValue : qVal;
}

export const enum TrackSourceAbbr {
  RG = 'rg',
  HG = 'hg',
}

export const TRACK_SOURCE_ABBR_TO_SERVER_URL: Record<
  TrackSourceAbbr,
  string
> = {
  [TrackSourceAbbr.RG]: 'https://resgen.io/api/v1',
  [TrackSourceAbbr.HG]: 'https://higlass.io/api/v1',
};

export const SERVER_URL_TO_TRACK_SOURCE_ABBR: Record<
  string,
  TrackSourceAbbr
> = Object.fromEntries(
  Object.entries(TRACK_SOURCE_ABBR_TO_SERVER_URL).map((kvPair) =>
    kvPair.reverse()
  )
);
