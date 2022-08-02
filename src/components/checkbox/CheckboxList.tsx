import React, { useCallback, useEffect, useState } from 'react';
import { RecoilState, useRecoilState } from 'recoil';
import CheckboxOption from './CheckboxOption';
import CheckboxOptionGroup from './CheckboxOptionGroup';
import FilterListIcon from '@material-ui/icons/FilterList';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';

import useDebounce from '../../hooks/use-debounce';
import { SampleFilterState } from '../../state/filter-state';
import { GroupedSampleOption, SampleGroupFilterState } from '../../state/stratification-state';
import { useCheckboxStyles } from './checkbox-styles';

type NestedCheckboxListProps = {
  filterState: RecoilState<string>,
  optionWithName: (name: string) => RecoilState<SampleFilterState>,
  optionGroupWithGroup: (group: GroupedSampleOption) => RecoilState<SampleGroupFilterState>,
  filterLabel: string,
  groupedOptions: GroupedSampleOption[],
  optionToGroup: {[key: string]: string},
  groupColors: string[],
  groupColorsDark: string[],
}
const NestedCheckboxList = React.memo(function NestedCheckboxList({
  filterState,
  optionWithName,
  optionGroupWithGroup,
  filterLabel = 'Filter',
  groupedOptions = [],
  optionToGroup = {},
  groupColors = [],
  groupColorsDark = [],
}: NestedCheckboxListProps) {
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

  const classes = useCheckboxStyles();

  return (
    <div className={classes.root}>
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
            <CheckboxOptionGroup
              key={group.name}
              group={group}
              stateWithGroup={optionGroupWithGroup}
              colorCheckbox={groupColors[i % groupColors.length] || 'inherit'}
              colorText={
                groupColorsDark[i % groupColorsDark.length] || 'inherit'
              }
            />
            {group.options.map((option) => (
              <CheckboxOption
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
