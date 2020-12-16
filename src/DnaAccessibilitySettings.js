import React, { useCallback } from 'react';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import { makeStyles } from '@material-ui/core/styles';

import { useDnaAccessLabelStyle } from './state';

const useStyles = makeStyles((theme) => ({
  iconRadioLegend: {
    margin: theme.spacing(2, 0, 0.25, 0),
  },
}));

const DnaAccessibilitySettings = React.memo(
  function DnaAccessibilitySettings() {
    const [
      dnaAccessLabelStyle,
      setDnaAccessLabelStyle,
    ] = useDnaAccessLabelStyle();

    const changeDnaAccessLabelStyle = useCallback(
      (value) => () => {
        setDnaAccessLabelStyle(value);
      },
      [setDnaAccessLabelStyle]
    );

    // On every render
    const classes = useStyles();

    return (
      <React.Fragment>
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
