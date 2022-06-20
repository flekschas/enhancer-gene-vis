import React, { useCallback } from 'react';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Switch from '@material-ui/core/Switch';
import { makeStyles } from '@material-ui/core/styles';

import { useVariantYScale } from './state';
import {
  useEnhancerRegionsHideUnfocused,
  useEnhancerRegionsColorEncoding,
} from './state/enhancer-region-state';

const useStyles = makeStyles((theme) => ({
  iconRadioLegend: {
    margin: theme.spacing(2, 0, 0.25, 0),
  },
}));

const EnhancerRegionsInfo = React.memo(function EnhancerRegionsInfo() {
  const [variantYScale, setVariantYScale] = useVariantYScale();
  const [hideUnfocused, setHideUnfocused] = useEnhancerRegionsHideUnfocused();
  const [colorEncoding, setColorEncoding] = useEnhancerRegionsColorEncoding();

  const hideUnfocusedChangeHandler = useCallback(
    (event) => {
      setHideUnfocused(event.target.checked);
    },
    [setHideUnfocused]
  );

  const changeVariantYScale = useCallback(
    (value) => () => {
      setVariantYScale(value);
    },
    [setVariantYScale]
  );

  const changeColorEncoding = useCallback(
    (value) => () => {
      setColorEncoding(value);
    },
    [setColorEncoding]
  );

  const classes = useStyles();

  return (
    <React.Fragment>
      <Box m={1}>
        <FormControlLabel
          control={
            <Switch
              checked={hideUnfocused}
              onChange={hideUnfocusedChangeHandler}
              name="hideUnfocused"
            />
          }
          label="Hide unfocused enhancer regions"
        />
      </Box>
      <Box m={1}>
        <FormControl component="fieldset">
          <FormLabel component="legend" className={classes.iconRadioLegend}>
            Variant y-scale
          </FormLabel>
          <RadioGroup
            aria-label="variantYScale"
            name="variantYScale"
            value={variantYScale}
          >
            <FormControlLabel
              label="p-value"
              value="pValue"
              className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeVariantYScale('pValue')}
                >
                  {variantYScale === 'pValue' ? (
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
              label="Posterior probability"
              value="posteriorProbability"
              className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeVariantYScale('posteriorProbability')}
                >
                  {variantYScale === 'posteriorProbability' ? (
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
      <Box m={1}>
        <FormControl component="fieldset">
          <FormLabel component="legend" className={classes.iconRadioLegend}>
            Matrix colorEncoding
          </FormLabel>
          <RadioGroup
            aria-label="colorEncoding"
            name="colorEncoding"
            value={colorEncoding}
          >
            <FormControlLabel
              label="Solid"
              value="solid"
              className={classes.iconRadio}
              control={
                <IconButton size="small" onClick={changeColorEncoding('solid')}>
                  {colorEncoding === 'solid' ? (
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
              label="Number of predictions"
              value="frequency"
              className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeColorEncoding('frequency')}
                >
                  {colorEncoding === 'frequency' ? (
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
              label="Highest prediction score"
              value="highestImportance"
              className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeColorEncoding('highestImportance')}
                >
                  {colorEncoding === 'highestImportance' ? (
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
              label="Closest prediction score"
              value="closestImportance"
              className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeColorEncoding('closestImportance')}
                >
                  {colorEncoding === 'closestImportance' ? (
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

export default EnhancerRegionsInfo;
