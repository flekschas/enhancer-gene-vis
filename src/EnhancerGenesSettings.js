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

import AntSwitch from './AntSwitch';

import {
  useEnhancerGenesCellEncoding,
  useEnhancerGenesPadding,
} from './state/enhancer-gene-track-state';

const useStyles = makeStyles((theme) => ({
  iconRadio: {
    padding: theme.spacing(0.5, 0),
    marginLeft: -theme.spacing(1) / 2,
    '& .MuiFormControlLabel-label': {
      lineHeight: 1.2,
    },
  },
  iconRadioActive: {
    color: 'black',
  },
  iconRadioLegend: {
    margin: theme.spacing(2, 0, 0.25, 0),
  },
  switch: {
    margin: 0,
  },
}));

const EnhancerGenesSettings = React.memo(function EnhancerGenesSettings() {
  const [cellEncoding, setCellEncoding] = useEnhancerGenesCellEncoding();
  const [padding, setPadding] = useEnhancerGenesPadding();

  const changeCellEncoding = (value) => () => {
    setCellEncoding(value);
  };

  const changePadding = (event) => {
    setPadding(event.target.checked);
  };

  const classes = useStyles();

  return (
    <React.Fragment>
      <Box m={1}>
        <FormControlLabel
          className={classes.switch}
          control={
            <AntSwitch checked={padding} onChange={changePadding} name="true" />
          }
          label="Gene padding"
        />
      </Box>
      <Box m={1}>
        <FormControl component="fieldset">
          <FormLabel component="legend" className={classes.iconRadioLegend}>
            Gene Cell Encoding
          </FormLabel>
          <RadioGroup
            aria-label="cellEncoding"
            name="cellEncoding"
            value={cellEncoding}
          >
            <FormControlLabel
              label="Max. ABC prediction score"
              value="number"
              className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeCellEncoding('max-score')}
                >
                  {cellEncoding === 'max-score' ? (
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
              label="Abs. number of predictions"
              value="number"
              className={classes.iconRadio}
              control={
                <IconButton size="small" onClick={changeCellEncoding('number')}>
                  {cellEncoding === 'number' ? (
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
              label="Rel. number of predictions per group"
              value="percent"
              className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeCellEncoding('percent')}
                >
                  {cellEncoding === 'percent' ? (
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
              label="Distribution by prediction score"
              value="distribution"
              className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeCellEncoding('distribution')}
                >
                  {cellEncoding === 'distribution' ? (
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
              label="Sample array"
              value="array"
              className={classes.iconRadio}
              control={
                <IconButton size="small" onClick={changeCellEncoding('array')}>
                  {cellEncoding === 'array' ? (
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
});

export default EnhancerGenesSettings;
