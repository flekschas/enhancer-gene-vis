import { FormControlLabel, Checkbox, Typography } from '@material-ui/core';
import React, { useCallback } from 'react';
import { RecoilState, useRecoilState } from 'recoil';
import {
  GroupedSampleOption,
  SampleGroupCheckedStatus,
  SampleGroupFilterState,
} from '../../state/stratification-state';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { useCheckboxStyles } from './checkbox-styles';

type CheckboxOptionGroupProps = {
  group: GroupedSampleOption;
  stateWithGroup: (
    group: GroupedSampleOption
  ) => RecoilState<SampleGroupFilterState>;
  colorCheckbox: string;
  colorText: string;
};
const CheckboxOptionGroup = React.memo(function CheckboxOptionGroup({
  group,
  stateWithGroup,
  colorCheckbox,
  colorText,
}: CheckboxOptionGroupProps) {
  const [state, setState] = useRecoilState(stateWithGroup(group));

  const changeHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setState((currState) => ({
        ...currState,
        checked: event.target.checked
          ? SampleGroupCheckedStatus.CHECKED
          : SampleGroupCheckedStatus.NOT_CHECKED,
        n: event.target.checked ? currState.N : 0,
      }));
    },
    [setState]
  );

  const classes = useCheckboxStyles();

  return (
    <FormControlLabel
      className={classes.checkbox}
      control={
        <Checkbox
          style={{ color: colorCheckbox }}
          icon={
            state.checked === SampleGroupCheckedStatus.NOT_CHECKED ? (
              <CheckBoxOutlineBlankIcon fontSize="small" />
            ) : (
              <IndeterminateCheckBoxIcon fontSize="small" />
            )
          }
          checkedIcon={<CheckBoxIcon fontSize="small" />}
          checked={state.checked === SampleGroupCheckedStatus.CHECKED}
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

export default CheckboxOptionGroup;
