import { useCallback, useMemo } from 'react';
import { RecoilState, useRecoilState, useRecoilValue } from 'recoil';
import queryString, { ParsedQuery } from 'query-string';

export type QueryStringEncoder<T> = (x: T) => string;
export type QueryStringDecoder<T> = (
  x: string | string[] | null | undefined
) => T;

/**
 * Subscribes to changes to an atom, and provides a function to synchronously
 * modify the Recoil state and window query string state
 *
 * @param key The key to update
 * @param atom The atom to listen to and update
 * @param encoder A function that encodes the atom value as a string
 * @returns A tuple of the atom value and a function to modify it
 */
export function useRecoilQueryString<T>(
  key: string,
  atom: RecoilState<T>,
  encoder: QueryStringEncoder<T>
): [T, (x: T) => void] {
  const [value, setValue] = useRecoilState(atom);

  const onSetValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      setQueryStringValue(key, newValue, encoder);
    },
    [key, encoder, setValue]
  );

  return [value, onSetValue];
}

/**
 * Subscribes to changes to the atom value, and updates the key value in the
 * query string accordingly.
 *
 * @param key The key to update
 * @param atom The atom to listen to changes for
 * @param encoder A function that encodes the atom value as a string
 */
export function useRecoilQueryStringSyncher<T>(
  key: string,
  atom: RecoilState<T>,
  encoder: QueryStringEncoder<T>
): void {
  const value = useRecoilValue(atom);

  useMemo(() => {
    setQueryStringValue(key, value, encoder);
  }, [key, encoder, value]);
}

/**
 * Returns a decoded query string value for a provided key.
 *
 * @param key The query string key to look for
 * @param decoder A function that parses the query string value into a semantic
 *    type
 * @returns The decoded value, if it exists.
 */
export function getQueryStringValue<T>(
  key: string,
  decoder: QueryStringDecoder<T>
): T | null | undefined {
  return decoder(queryString.parse(window.location.search)[key]);
}

/**
 * Sets a query string value into the browser URL.
 *
 * @param key The query string key to set
 * @param value The value to be encoded into the URL for the key
 * @param encoder A function that converts the value to a string
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
