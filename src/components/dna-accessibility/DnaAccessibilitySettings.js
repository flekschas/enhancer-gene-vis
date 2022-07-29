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

import { useDnaAccessLabelStyle, useDnaAccessRowNorm } from '../../state/dna-accessibility-state';

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
    const [
      dnaAccessLabelStyle,
      setDnaAccessLabelStyle,
    ] = useDnaAccessLabelStyle();
    const [dnaAccessRowNorm, setDnaAccessRowNorm] = useDnaAccessRowNorm();

    const changeDnaAccessLabelStyle = (value) => () => {
      setDnaAccessLabelStyle(value);
    };

    const changeDnaAccessRowNorm = (event) => {
      setDnaAccessRowNorm(event.target.checked);
    };

    // On every render
    const classes = useStyles();

    return (
      <React.Fragment>
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
              <FormControlLabel
                label="Indicator"
                value="indicator"
                className={classes.iconRadio}
                control={
                  <IconButton
                    size="small"
                    onClick={changeDnaAccessLabelStyle('indicator')}
                  >
                    {dnaAccessLabelStyle === 'indicator' ? (
                      <RadioButtonCheckedIcon
                        className={classes.iconRadioActive}
                        fontSize="inherit"
                      />
                    ) : (
                      <RadioButtonUncheckedIcon fontSize="inherit" />
                    )}
                  </IconButton>
                }
              />
              <FormControlLabel
                label="Text"
                value="text"
                className={classes.iconRadio}
                control={
                  <IconButton
                    size="small"
                    onClick={changeDnaAccessLabelStyle('text')}
                  >
                    {dnaAccessLabelStyle === 'text' ? (
                      <RadioButtonCheckedIcon
                        className={classes.iconRadioActive}
                        fontSize="inherit"
                      />
                    ) : (
                      <RadioButtonUncheckedIcon fontSize="inherit" />
                    )}
                  </IconButton>
                }
              />
              <FormControlLabel
                label="Hidden"
                value="hidden"
                className={classes.iconRadio}
                control={
                  <IconButton
                    size="small"
                    onClick={changeDnaAccessLabelStyle('hidden')}
                  >
                    {dnaAccessLabelStyle === 'hidden' ? (
                      <RadioButtonCheckedIcon
                        className={classes.iconRadioActive}
                        fontSize="inherit"
                      />
                    ) : (
                      <RadioButtonUncheckedIcon fontSize="inherit" />
                    )}
                  </IconButton>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </React.Fragment>
    );
  }
);

export default DnaAccessibilitySettings;
