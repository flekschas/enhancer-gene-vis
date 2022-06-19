import { QueryStringDecoder, getQueryStringValue } from '../utils/query-string';

export function getDefault<T>(
  key: string,
  initialValue: T,
  decoder: QueryStringDecoder<T>
) {
  const qVal = getQueryStringValue(key, decoder);
  return qVal === undefined ? initialValue : qVal;
}
