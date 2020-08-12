import { useState, useCallback } from 'react';
import { getQueryStringValue, setQueryStringValue } from './utils';

function useQueryString(key, initialValue, { encoder, decoder } = {}) {
  const [value, setValue] = useState(
    getQueryStringValue(key, decoder) || initialValue
  );
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

export default useQueryString;
