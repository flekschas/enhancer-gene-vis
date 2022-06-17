import { useCallback, useMemo } from 'react';
import { RecoilState, useRecoilState, useRecoilValue } from 'recoil';
import queryString, { ParsedQuery } from 'query-string';

export type QueryStringEncoder<T> = (x: T) => string;
export type QueryStringDecoder<T> = (
  x: string | string[] | null | undefined
) => T;

export function useRecoilQueryString<T>(
  key: string,
  atom: RecoilState<T>,
  encoder: QueryStringEncoder<T>
) {
  const [value, setValue] = useRecoilState(atom);

  const onSetValue = useCallback(
    (newValue) => {
      setValue(newValue);
      setQueryStringValue(key, newValue, encoder);
    },
    [key, encoder, setValue]
  );

  return [value, onSetValue];
}

export function useRecoilQueryStringSyncher<T>(
  key: string,
  atom: RecoilState<T>,
  encoder: QueryStringEncoder<T>
) {
  const value = useRecoilValue(atom);

  useMemo(() => {
    setQueryStringValue(key, value, encoder);
  }, [key, encoder, value]);
}

export function getQueryStringValue<T>(
  key: string,
  decoder: QueryStringDecoder<T>
): T | null | undefined {
  return decoder(queryString.parse(window.location.search)[key]);
}

/**
 *
 * @param key query parameter key
 * @param value
 * @param encoder
 */
export function setQueryStringValue<T>(
  key: string,
  value: T,
  encoder?: QueryStringEncoder<T>
): void {
  const values: ParsedQuery = queryString.parse(window.location.search);
  const newQsValue = queryString.stringify(
    {
      ...values,
      [key]: encoder ? encoder(value) : value,
    },
    { strict: false }
  );
  const url = `${window.location.origin}${window.location.pathname}?${newQsValue}`;
  window.history.pushState({ path: url }, '', url);
}
