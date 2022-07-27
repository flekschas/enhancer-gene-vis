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

import { useVariantYScale } from '../../state';
import {
  useEnhancerRegionsHideUnfocused,
  useEnhancerRegionsColorEncoding,
} from '../../state/enhancer-region-state';
import { OpacityEncoding } from '../../view-config-types';

const useStyles = makeStyles((theme) => ({
  iconRadioLegend: {
    margin: theme.spacing(2, 0, 0.25, 0),
  },
}));

type ColorEncodingSettingRenderInfo = {
  type: OpacityEncoding;
  label: string;
};
const colorEncodingSettings: ColorEncodingSettingRenderInfo[] = [
  {
    type: OpacityEncoding.SOLID,
    label: 'Solid',
  },
  {
    type: OpacityEncoding.FREQUENCY,
    label: 'Number of predictions',
  },
  {
    type: OpacityEncoding.HIGHEST_IMPORTANCE,
    label: 'Highest prediction score',
  },
  {
    type: OpacityEncoding.CLOSEST_IMPORTANCE,
    label: 'Closest prediction score',
  },
];

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
    (value: OpacityEncoding) => () => {
      setColorEncoding(value);
    },
    [setColorEncoding]
  );

  const classes = useStyles();

  return (
    <>
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
              // className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeVariantYScale('pValue')}
                >
                  {variantYScale === 'pValue' ? (
                    <RadioButtonCheckedIcon
                      // className={classes.iconRadioActive}
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
              // className={classes.iconRadio}
              control={
                <IconButton
                  size="small"
                  onClick={changeVariantYScale('posteriorProbability')}
                >
                  {variantYScale === 'posteriorProbability' ? (
                    <RadioButtonCheckedIcon
                      // className={classes.iconRadioActive}
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
            {colorEncodingSettings.map((renderInfo) => (
              <FormControlLabel
                label={renderInfo.label}
                value={renderInfo.type}
                // className={classes.iconRadio}
                control={
                  <IconButton
                    size="small"
                    onClick={changeColorEncoding(renderInfo.type)}
                  >
                    {colorEncoding === renderInfo.type ? (
                      <RadioButtonCheckedIcon
                        // className={classes.iconRadioActive}
                        fontSize="inherit"
                      />
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
});

export default EnhancerRegionsInfo;
