import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress';
import { identity } from '@flekschas/utils';

import useDebounce from './use-debounce';

export default function SearchField(props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState(props.inputValue);
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const loading = open && options.length === 0;

  useEffect(() => {
    let active = true;

    if (!open) return undefined;

    setOptions([]);

    (async () => {
      const response = await fetch(
        `${props.searchUrl}&ac=${debouncedSearchQuery || ''}`
      );
      const geneList = await response.json();

      if (active) {
        setOptions(geneList);
      }
    })();

    return () => {
      active = false;
    };
  }, [props.searchUrl, open, debouncedSearchQuery]);

  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  return (
    <Autocomplete
      onChange={(event, newValue) => {
        props.onChange(newValue);
      }}
      value={props.value}
      onInputChange={(event, newInputValue) => {
        if (event) setSearchQuery(newInputValue);
      }}
      fullWidth={props.fullWidth}
      style={{ width: props.fullWidth ? 'auto' : props.width }}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      getOptionSelected={(option, _value) =>
        option.geneName === _value.geneName
      }
      getOptionLabel={(option) => option.geneName}
      options={props.value && options.length === 0 ? [props.value] : options}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          id={props.id}
          label={props.label}
          variant={props.variant}
          size={props.size}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
}

SearchField.defaultProps = {
  onChange: identity,
  label: '',
  id: '',
  fullWidth: true,
  size: 'small',
  value: null,
  variant: 'outlined',
  width: '10rem',
};

SearchField.propTypes = {
  onChange: PropTypes.func,
  label: PropTypes.string,
  id: PropTypes.string,
  fullWidth: PropTypes.bool,
  searchUrl: PropTypes.string.isRequired,
  size: PropTypes.string,
  value: PropTypes.object,
  variant: PropTypes.string,
  width: PropTypes.string,
};
