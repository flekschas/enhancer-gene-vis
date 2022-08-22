import React from 'react';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import { makeStyles } from '@material-ui/core/styles';

import AntSwitch from '../../AntSwitch';

import {
  useDnaAccessLabelStyle,
  useDnaAccessRowNorm,
} from '../../state/dna-accessibility-state';
import { capitalizeFirstLetter } from '../../utils/string';
import { RidgePlotTrackLabelStyle } from '../../view-config-types';

const useStyles = makeStyles((theme) => ({
  iconRadioLegend: {
    margin: theme.spacing(2, 0, 0.25, 0),
  },
  switch: {
    margin: 0,
  },
}));

const DnaAccessibilitySettings = React.memo(
  function DnaAccessibilitySettings() {
    const [dnaAccessLabelStyle, setDnaAccessLabelStyle] =
      useDnaAccessLabelStyle();
    const [dnaAccessRowNorm, setDnaAccessRowNorm] = useDnaAccessRowNorm();

    const changeDnaAccessLabelStyle =
      (value: RidgePlotTrackLabelStyle) => () => {
        setDnaAccessLabelStyle(value);
      };

    const changeDnaAccessRowNorm = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      setDnaAccessRowNorm(event.target.checked);
    };

    // On every render
    const classes = useStyles();

    return (
      <>
        <Box m={1}>
          <FormControlLabel
            className={classes.switch}
            control={
              <AntSwitch
                checked={dnaAccessRowNorm}
                onChange={changeDnaAccessRowNorm}
                name="true"
              />
            }
            label="Row-wise normalization"
          />
        </Box>
        <Box m={1}>
          <FormControl component="fieldset">
            <FormLabel component="legend" className={classes.iconRadioLegend}>
              Labels
            </FormLabel>
            <RadioGroup
              aria-label="dnaAccessLabelStyle"
              name="dnaAccessLabelStyle"
              value={dnaAccessLabelStyle}
            >
              {Object.values(RidgePlotTrackLabelStyle).map((label) => (
                <FormControlLabel
                  key={label}
                  label={capitalizeFirstLetter(label)}
                  value={label}
                  control={
                    <IconButton
                      size="small"
                      onClick={changeDnaAccessLabelStyle(label)}
                    >
                      {dnaAccessLabelStyle === label ? (
                        <RadioButtonCheckedIcon fontSize="inherit" />
                      ) : (
                        <RadioButtonUncheckedIcon fontSize="inherit" />
                      )}
                    </IconButton>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
      </>
    );
  }
);

export default DnaAccessibilitySettings;
