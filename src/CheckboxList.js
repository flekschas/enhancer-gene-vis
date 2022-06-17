import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import FilterListIcon from '@material-ui/icons/FilterList';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import useDebounce from './hooks/use-debounce';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
  },
  filterBar: {
    position: 'sticky',
    zIndex: 1,
    top: '8px',
    '&:before': {
      content: '""',
      position: 'absolute',
      zIndex: 0,
      top: '-9px',
      right: '-8px',
      left: '-8px',
      bottom: 0,
      background: 'white',
    },
  },
  checkbox: {
    marginTop: -6,
    marginBottom: -6,
  },
  checkboxLabel: {
    fontSize: '0.8rem',
    marginLeft: -6,
  },
  nestedCheckbox: {
    marginLeft: 4,
  },
  visible: {
    transition: '.3s ease transform, .3s ease height',
    transform: 'scale(1, 1)',
    height: '1.625rem',
  },
  invisible: {
    transition: '.3s ease transform, .3s ease height',
    transform: 'scale(1, 0)',
    height: '0rem',
  },
}));

const Option = React.memo(function Option({
  filterState,
  name,
  stateWithName,
  group,
  stateWithGroup,
  colorCheckbox,
  colorText,
}) {
  const filter = useRecoilValue(filterState);
  const [state, setState] = useRecoilState(stateWithName(name));
  const [groupState, setGroupState] = useRecoilState(stateWithGroup(group));
  const nameLowerCase = useMemo(() => name.toLowerCase(), [name]);

  const changeHandler = useCallback(
    (event) => {
      setState((currState) => ({
        ...currState,
        checked: event.target.checked,
      }));
      setGroupState((currGroupState) => {
        const newGroupState = {
          ...currGroupState,
          n: currGroupState.n + (event.target.checked ? 1 : -1),
        };
        switch (newGroupState.n) {
          case currGroupState.N:
            newGroupState.checked = true;
            break;
          case 0:
            newGroupState.checked = false;
            break;
          default:
            newGroupState.checked = undefined;
            break;
        }
        return newGroupState;
      });
    },
    [setState, setGroupState]
  );

  useEffect(() => {
    if (groupState.checked === true) {
      setState((currState) => ({
        ...currState,
        checked: true,
      }));
    } else if (groupState.checked === false) {
      setState((currState) => ({
        ...currState,
        checked: false,
      }));
    }
  }, [groupState, setState]);

  useEffect(() => {
    setState((currState) => ({
      ...currState,
      visible: !filter.length || nameLowerCase.includes(filter),
    }));
  }, [filter, nameLowerCase, setState]);

  const classes = useStyles();

  return (
    <div className={state.visible ? classes.visible : classes.invisible}>
      <FormControlLabel
        key={name}
        className={`${classes.checkbox} ${classes.nestedCheckbox}`}
        control={
          <Checkbox
            style={{
              color: colorCheckbox,
            }}
            icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
            checkedIcon={<CheckBoxIcon fontSize="small" />}
            checked={state.checked}
            onChange={changeHandler}
            name={name}
          />
        }
        label={
          <Typography
            className={classes.checkboxLabel}
            noWrap
            style={{
              color: colorText,
            }}
          >
            {name}
          </Typography>
        }
      />
    </div>
  );
});

const OptionGroup = React.memo(function OptionGroup({
  group,
  stateWithGroup,
  colorCheckbox,
  colorText,
}) {
  const [state, setState] = useRecoilState(stateWithGroup(group));

  const changeHandler = useCallback(
    (event) => {
      setState((currState) => ({
        ...currState,
        checked: event.target.checked,
        n: event.target.checked ? currState.N : 0,
      }));
    },
    [setState]
  );

  const classes = useStyles();

  return (
    <FormControlLabel
      className={classes.checkbox}
      control={
        <Checkbox
          style={{ color: colorCheckbox }}
          icon={
            state.checked === false ? (
              <CheckBoxOutlineBlankIcon fontSize="small" />
            ) : (
              <IndeterminateCheckBoxIcon fontSize="small" />
            )
          }
          checkedIcon={<CheckBoxIcon fontSize="small" />}
          checked={state.checked === true}
          onChange={changeHandler}
          name={group.name}
        />
      }
      label={
        <Typography
          className={classes.checkboxLabel}
          noWrap
          style={{ color: colorText }}
        >
          <strong>{group.name}</strong>{' '}
          <span>
            ({state.n}/{state.N})
          </span>
        </Typography>
      }
    />
  );
});

const NestedCheckboxList = React.memo(function NestedCheckboxList({
  filterState,
  optionWithName,
  optionGroupWithGroup,
  filterLabel = 'Filter',
  groupedOptions = [],
  optionToGroup = {},
  groupColors = [],
  groupColorsDark = [],
}) {
  const [globalFilter, setGlobalFilter] = useRecoilState(filterState);
  const [filter, setFilter] = useState(globalFilter);
  const filterDb = useDebounce(filter, 350);

  const filterChangeHandler = useCallback(
    (event) => {
      setFilter(event.target.value.toLowerCase());
    },
    [setFilter]
  );

  useEffect(() => {
    setGlobalFilter(filterDb);
  }, [filterDb, setGlobalFilter]);

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <div className={classes.filterBarBg} />
      <FormControl
        className={classes.filterBar}
        variant="outlined"
        margin="dense"
        fullWidth
      >
        <InputLabel htmlFor="filter">
          <Grid container direction="row" alignItems="center">
            <FilterListIcon fontSize="small" />
            <span style={{ marginLeft: 3 }}>{filterLabel}</span>
          </Grid>
        </InputLabel>
        <OutlinedInput
          id="filter"
          label={
            <Grid container direction="row" alignItems="center">
              <FilterListIcon fontSize="small" />
              <span style={{ marginLeft: 3 }}>{filterLabel}</span>
            </Grid>
          }
          onChange={filterChangeHandler}
          value={filter}
        />
      </FormControl>
      <FormGroup>
        {groupedOptions.map((group, i) => (
          <React.Fragment key={group.name}>
            <OptionGroup
              key={group.name}
              group={group}
              stateWithGroup={optionGroupWithGroup}
              colorCheckbox={groupColors[i % groupColors.length] || 'inherit'}
              colorText={
                groupColorsDark[i % groupColorsDark.length] || 'inherit'
              }
            />
            {group.options.map((option) => (
              <Option
                filterState={filterState}
                key={option}
                name={option}
                stateWithName={optionWithName}
                group={group}
                stateWithGroup={optionGroupWithGroup}
                colorCheckbox={groupColors[i % groupColors.length] || 'inherit'}
                colorText={
                  groupColorsDark[i % groupColorsDark.length] || 'inherit'
                }
              />
            ))}
          </React.Fragment>
        ))}
      </FormGroup>
    </div>
  );
});

export default NestedCheckboxList;
