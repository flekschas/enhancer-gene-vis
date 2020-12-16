import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import FilterListIcon from '@material-ui/icons/FilterList';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import useDebounce from './use-debounce';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
  },
  checkbox: {
    marginTop: -4,
    marginBottom: -4,
  },
  checkboxLabel: {
    fontSize: '0.9rem',
    marginLeft: -4,
  },
  nestedCheckbox: {
    marginLeft: 4,
  },
}));

export default function CheckboxList({
  options = [],
  groupColorsDark = [],
  groupColorsLight = [],
}) {
  const [optionGroupChecked, setOptionGroupChecked] = useState({});
  const [optionsChecked, setOptionsChecked] = useState({});
  const [optionsFiltered, setOptionsFiltered] = useState(options);
  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebounce(filter, 250);

  const classes = useStyles();

  const isNested = useMemo(() => options.length > 0 && options[0].options, [
    options,
  ]);

  const nestedOptions = useMemo(() => {
    if (isNested) {
      return options.reduce((out, optionGroup) => {
        out[optionGroup.name] = optionGroup.options;
        return out;
      }, {});
    }
    return null;
  }, [isNested, options]);

  useEffect(() => {
    if (debouncedFilter === '') {
      setOptionsFiltered(options);
      return;
    }
    const t0 = performance.now();
    const f = debouncedFilter.toLowerCase();
    const furz = options.map((optionGroup, i) => {
      const o = { ...optionGroup };
      o.options = options[i].options.filter(
        (option) => option.toLowerCase().indexOf(f) >= 0
      );
      return o;
    });
    console.log(`filter took ${performance.now() - t0}`);
    setOptionsFiltered(furz);
  }, [options, debouncedFilter]);

  const optionGroupChangeHandler = useCallback(
    (event) => {
      const newOptionsChecked = { ...optionsChecked };
      nestedOptions[event.target.name].forEach((option) => {
        newOptionsChecked[option] = event.target.checked;
      });
      setOptionGroupChecked({
        ...optionGroupChecked,
        [event.target.name]: event.target.checked,
      });
      setOptionsChecked(newOptionsChecked);
    },
    [nestedOptions, optionsChecked, optionGroupChecked]
  );

  const optionChangeHandler = useCallback(
    (event) => {
      setOptionsChecked({
        ...optionsChecked,
        [event.target.name]: event.target.checked,
      });
    },
    [optionsChecked]
  );

  const filterChangeHandler = useCallback((event) => {
    setFilter(event.target.value);
  }, []);

  return (
    <div className={classes.root}>
      <FormControl variant="outlined" margin="dense" fullWidth>
        <InputLabel htmlFor="filter">
          <Grid container direction="row" alignItems="center">
            <FilterListIcon fontSize="small" />
            <span style={{ marginLeft: 3 }}>Filter</span>
          </Grid>
        </InputLabel>
        <OutlinedInput
          id="filter"
          label={
            <Grid container direction="row" alignItems="center">
              <FilterListIcon fontSize="small" />
              <span style={{ marginLeft: 3 }}>Filter</span>
            </Grid>
          }
          onChange={filterChangeHandler}
          value={filter}
        />
      </FormControl>
      {isNested && (
        <FormGroup>
          {optionsFiltered.map((optionGroup, i) => (
            <React.Fragment key={optionGroup.name}>
              <FormControlLabel
                className={classes.checkbox}
                control={
                  <Checkbox
                    style={{
                      color:
                        (optionGroupChecked[optionGroup.name]
                          ? groupColorsDark[i % groupColorsDark.length]
                          : groupColorsLight[i % groupColorsLight.length]) ||
                        'inherit',
                    }}
                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                    checked={!!optionGroupChecked[optionGroup.name]}
                    onChange={optionGroupChangeHandler}
                    name={optionGroup.name}
                  />
                }
                label={
                  <Typography
                    className={classes.checkboxLabel}
                    noWrap
                    style={{
                      color:
                        groupColorsDark[i % groupColorsDark.length] ||
                        'inherit',
                    }}
                  >
                    <strong>{optionGroup.name}</strong>{' '}
                    <span>({optionGroup.options.length})</span>
                  </Typography>
                }
              />
              {optionGroup.options.map((option) => (
                <FormControlLabel
                  key={option}
                  className={`${classes.checkbox} ${classes.nestedCheckbox}`}
                  control={
                    <Checkbox
                      style={{
                        color:
                          (optionsChecked[option]
                            ? groupColorsDark[i % groupColorsDark.length]
                            : groupColorsLight[i % groupColorsLight.length]) ||
                          'inherit',
                      }}
                      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                      checkedIcon={<CheckBoxIcon fontSize="small" />}
                      checked={!!optionsChecked[option]}
                      onChange={optionChangeHandler}
                      name={option}
                    />
                  }
                  label={
                    <Typography
                      className={classes.checkboxLabel}
                      noWrap
                      style={{
                        color:
                          groupColorsDark[i % groupColorsDark.length] ||
                          'inherit',
                      }}
                    >
                      {option}
                    </Typography>
                  }
                />
              ))}
            </React.Fragment>
          ))}
        </FormGroup>
      )}
    </div>
  );
}
