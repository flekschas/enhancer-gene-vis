import { FormControlLabel, Checkbox, Typography } from "@material-ui/core";
import React, { useMemo, useCallback, useEffect } from "react";
import { useRecoilValue, useRecoilState, RecoilState } from "recoil";

type OptionProps = {
  filterState: RecoilState<string>,
  name: string,
  stateWithName,
  group,
  stateWithGroup,
  colorCheckbox,
  colorText,
}
export const Option = React.memo(function Option({
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