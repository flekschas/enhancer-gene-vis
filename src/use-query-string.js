import { useState, useCallback } from 'react';
import { useRecoilState } from 'recoil';

import { getQueryStringValue, setQueryStringValue } from './utils';

export default function useQueryStringWithReactState(
  key,
  initialValue,
  { encoder, decoder } = {}
) {
  const _initialValue =
    getQueryStringValue(key, decoder) === undefined
      ? initialValue
      : getQueryStringValue(key, decoder);

  const [value, setValue] = useState(_initialValue);

  const onSetValue = useCallback(
    (newValue) => {
      setValue(newValue);
      setQueryStringValue(key, newValue, encoder);
    },
    [key, encoder]
  );

  // Set initial value
  setQueryStringValue(key, value, encoder);

  return [value, onSetValue];
}

export function useRecoilQueryString(key, atom, { encoder, decoder } = {}) {
  const [value, setValue] = useRecoilState(atom);

  const onSetValue = useCallback(
    (newValue) => {
      setValue(newValue);
      setQueryStringValue(key, newValue, encoder);
    },
    [key, encoder, setValue]
  );

  // Set initial value
  setQueryStringValue(key, value, encoder);

  return [value, onSetValue];
}
