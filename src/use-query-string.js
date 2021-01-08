import { useCallback, useMemo, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

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

export function useRecoilQueryString(key, atom, encoder) {
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

export function useRecoilQueryStringSyncher(key, atom, encoder) {
  const value = useRecoilValue(atom);

  useMemo(() => {
    setQueryStringValue(key, value, encoder);
  }, [key, encoder, value]);
}
