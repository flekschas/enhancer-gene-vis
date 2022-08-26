import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Chip from '@material-ui/core/Chip';
import SvgIcon from '@material-ui/core/SvgIcon';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import FilterCenterFocusIcon from '@material-ui/icons/FilterCenterFocus';
import { makeStyles } from '@material-ui/core/styles';
import { identity } from '@flekschas/utils';

import useDebounce from './use-debounce';

const useStyles = makeStyles((theme) => ({
  inputRoot: {
    background: 'white !important',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    '&::before': {
      borderBottomWidth: 0,
      boxShadow: '0 1px 0 0 rgba(0, 0, 0, 0)',
      transition: 'boxShadow 0.2s ease',
    },
    '&:hover::before': {
      borderBottomWidth: 0,
      boxShadow: '0 1px 0 0 rgba(0, 0, 0, 1)',
    },
  },
  focused: {
    boxShadow: '0 1px 0 0 rgba(0, 0, 0, 1)',
  },
  input: {
    height: 35,
    padding: '6px 0 6px',
  },
  textFieldRoot: {
    '& .MuiFormLabel-root': {
      color: 'black',
      fontWeight: 'bold',
      transform: 'translate(12px, 21px) scale(1.25)',
    },
    '& .MuiInputLabel-shrink': {
      fontWeight: 'normal',
    },
  },
}));

const fetchJsonFromUrl = async (url, query) => {
  if (typeof url === 'string') {
    const response = await fetch(`${url}&ac=${query || ''}`);
    return response.json();
  }
  const response = await fetch(`${url.url}&ac=${query || ''}`);
  const results = await response.json();
  return results.map((result) => {
    result.type = url.type;
    return result;
  });
};

function GeneIcon(props) {
  return (
    <SvgIcon viewBox="0 0 16 16" {...props}>
      <path d="M5.03 14.378A7.33 7.33 0 003.423 16h2.42a7.762 7.762 0 011.281-.774 13.241 13.241 0 01-1.863-1.016c-.078.054-.156.11-.233.168zM5.766 0l.219.174a8.754 8.754 0 001.636.92l.024.008c.797.24 1.507.627 2.023.933.325.18.674.4 1.024.66 1.825 1.363 2.79 3.22 2.79 5.367 0 2.062-.962 3.89-2.782 5.286-.061.048-.125.094-.186.139a10.45 10.45 0 00-1.895-.955 8.17 8.17 0 001.69-1.162h-3.92a6.191 6.191 0 01-1.199-1.15h6.093a4.054 4.054 0 00.603-1.747H3.839c.072.656.307 1.239.636 1.747h.011c.282.438.628.822.991 1.15H5.47l.74.584c.831.588 1.573.893 1.636.92a9.358 9.358 0 012.847 1.504A7.38 7.38 0 0112.3 16H9.879l-.759-.5a7.876 7.876 0 00-1.256-.594 11.833 11.833 0 01-2.07-1.04l.017-.009c-1.567-.999-3.571-2.851-3.571-5.794 0-2.149.964-4.005 2.79-5.367.076-.058.154-.113.231-.167.495.32 1.143.698 1.863 1.015a7.677 7.677 0 00-1.296.786c-.043.032-.083.066-.125.098h3.318c.535.336.999.727 1.364 1.149H4.598a4.215 4.215 0 00-.721 1.748h7.97l-.038-.195a3.527 3.527 0 00-.306-.904 4.417 4.417 0 00-.378-.65l-.01-.007a5.793 5.793 0 00-1.081-1.13l-.14-.109a7.236 7.236 0 00-.722-.48l-.031-.02a7.942 7.942 0 00-1.276-.607 10.278 10.278 0 01-1.257-.57C5.728 2.218 4.31 1.364 3.281 0h2.486zm6.267 0a7.808 7.808 0 01-1.743 1.707A10.443 10.443 0 008.396.752 8.592 8.592 0 009.592 0h2.442z" />
    </SvgIcon>
  );
}

function GeneOption(props) {
  return (
    <Grid
      key={props.option.geneName}
      container
      direction="row"
      alignItems="center"
    >
      <GeneIcon fontSize="small" />
      <span>{props.option.geneName}</span>
    </Grid>
  );
}

function VariantOption(props) {
  return (
    <Grid
      key={props.option.geneName}
      container
      direction="row"
      alignItems="center"
    >
      <FlashOnIcon fontSize="small" />
      <span>{props.option.geneName}</span>
    </Grid>
  );
}

function RegionOption(props) {
  return (
    <Grid
      key={props.option.geneName}
      container
      direction="row"
      alignItems="center"
    >
      <FilterCenterFocusIcon fontSize="small" />
      <span>{props.option.geneName}</span>
    </Grid>
  );
}

function Option(props) {
  if (props.option.type === 'gene') return <GeneOption option={props.option} />;
  if (props.option.type === 'variant')
    return <VariantOption option={props.option} />;
  if (props.option.type === 'region')
    return <RegionOption option={props.option} />;
  return <div>{props.option.geneName}</div>;
}

function getIcon(icon) {
  switch (icon) {
    case 'gene':
      return <GeneIcon />;

    case 'variant':
      return <FlashOnIcon />;

    case 'region':
      return <FilterCenterFocusIcon />;

    default:
      return undefined;
  }
}

export default function SearchField(props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState(props.inputValue);
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const loading = open && options.length === 0;
  const classes = useStyles();
  const autocompleteClasses = { ...classes };
  delete autocompleteClasses.textFieldRoot;

  const { customSearch, searchUrl } = props;

  useEffect(() => {
    let active = true;

    if (!open) return undefined;

    setOptions([]);

    const whenResults = Array.isArray(searchUrl)
      ? searchUrl.map((url) => fetchJsonFromUrl(url, debouncedSearchQuery))
      : [fetchJsonFromUrl(searchUrl, debouncedSearchQuery)];

    if (customSearch) whenResults.push(customSearch(debouncedSearchQuery));

    Promise.all(whenResults).then((results) => {
      if (active) setOptions(results.flat().filter(identity));
    });

    return () => {
      active = false;
    };
  }, [searchUrl, customSearch, open, debouncedSearchQuery]);

  useEffect(() => {
    if (!open) {
      setOptions([]);
    }
  }, [open]);

  const value =
    props.multiple && !Array.isArray(props.value) ? [props.value] : props.value;

  let autocompleteOptions = value && options.length === 0 ? value : options;
  autocompleteOptions = Array.isArray(autocompleteOptions)
    ? autocompleteOptions
    : [autocompleteOptions];

  return (
    <Autocomplete
      classes={props.larger ? autocompleteClasses : {}}
      multiple={props.multiple}
      onChange={(event, newValue) => {
        props.onChange(newValue);
      }}
      value={value}
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
      getOptionLabel={(option) => (option ? option.geneName : '')}
      options={autocompleteOptions}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          className={props.larger ? classes.textFieldRoot : ''}
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
      renderOption={(option) => <Option option={option} />}
      renderTags={(v, getTagProps) =>
        v.map((option, index) => (
          <Chip
            icon={getIcon(option.type)}
            key={option.geneName}
            label={option.geneName}
            {...getTagProps({ index })}
          />
        ))
      }
    />
  );
}

SearchField.defaultProps = {
  fullWidth: true,
  id: '',
  label: '',
  multiple: false,
  onChange: identity,
  size: 'small',
  value: null,
  variant: 'outlined',
  width: '10rem',
};

SearchField.propTypes = {
  customSearch: PropTypes.func,
  fullWidth: PropTypes.bool,
  id: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  multiple: PropTypes.bool,
  onChange: PropTypes.func,
  searchUrl: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.shape({
          url: PropTypes.string,
          type: PropTypes.string,
        }),
        PropTypes.string,
      ])
    ),
    PropTypes.string,
  ]).isRequired,
  size: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  variant: PropTypes.string,
  width: PropTypes.string,
};
