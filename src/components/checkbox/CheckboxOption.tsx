import { FormControlLabel, Checkbox, Typography } from '@material-ui/core';
import React, { useMemo, useCallback, useEffect } from 'react';
import { useRecoilValue, useRecoilState, RecoilState } from 'recoil';
import { SampleFilterState } from '../../state/filter-state';
import {
  GroupedSampleOption,
  SampleGroupCheckedStatus,
  SampleGroupFilterState,
} from '../../state/stratification-state';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import { useCheckboxStyles } from './checkbox-styles';

type CheckboxOptionProps = {
  filterState: RecoilState<string>;
  name: string;
  /** State generator function using the name parameter */
  stateWithName: (name: string) => RecoilState<SampleFilterState>;
  group: GroupedSampleOption;
  /** State generator function using the group parameter */
  stateWithGroup: (
    group: GroupedSampleOption
  ) => RecoilState<SampleGroupFilterState>;
  colorCheckbox: string;
  colorText: string;
};
const CheckboxOption = React.memo(function Option({
  filterState,
  name,
  stateWithName,
  group,
  stateWithGroup,
  colorCheckbox,
  colorText,
}: CheckboxOptionProps) {
  const filter: string = useRecoilValue(filterState);
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
            newGroupState.checked = SampleGroupCheckedStatus.CHECKED;
            break;
          case 0:
            newGroupState.checked = SampleGroupCheckedStatus.NOT_CHECKED;
            break;
          default:
            newGroupState.checked = SampleGroupCheckedStatus.PARTIAL_CHECKED;
            break;
        }
        return newGroupState;
      });
    },
    [setState, setGroupState]
  );

  useEffect(() => {
    if (groupState.checked === SampleGroupCheckedStatus.CHECKED) {
      setState((currState) => ({
        ...currState,
        checked: true,
      }));
    } else if (groupState.checked === SampleGroupCheckedStatus.NOT_CHECKED) {
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

  const classes = useCheckboxStyles();

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

export default CheckboxOption;
