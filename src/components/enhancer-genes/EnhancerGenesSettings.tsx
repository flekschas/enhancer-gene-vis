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
  EnhancerGeneCellEncodingType,
  useEnhancerGenesCellEncoding,
  useEnhancerGenesPadding,
} from '../../state/enhancer-gene-track-state';

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

type CellEncodingSettingRenderInfo = {
  type: EnhancerGeneCellEncodingType;
  label: string;
  value: string;
};
const cellEncodingSettings: CellEncodingSettingRenderInfo[] = [
  {
    type: EnhancerGeneCellEncodingType.MAX_SCORE,
    label: 'Max. ABC prediction score',
    value: 'number',
  },
  {
    type: EnhancerGeneCellEncodingType.NUMBER,
    label: 'Abs. number of predictions',
    value: 'number',
  },
  {
    type: EnhancerGeneCellEncodingType.PERCENT,
    label: 'Rel. number of predictions per group',
    value: 'percent',
  },
  {
    type: EnhancerGeneCellEncodingType.DISTRIBUTION,
    label: 'Distribution by prediction score',
    value: 'distribution',
  },
  {
    type: EnhancerGeneCellEncodingType.ARRAY,
    label: 'Sample array',
    value: 'array',
  },
];

const EnhancerGenesSettings = React.memo(function EnhancerGenesSettings() {
  const [cellEncoding, setCellEncoding] = useEnhancerGenesCellEncoding();
  const [padding, setPadding] = useEnhancerGenesPadding();

  const changeCellEncoding = (value: EnhancerGeneCellEncodingType) => () => {
    setCellEncoding(value);
  };

  const changePadding = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPadding(event.target.checked);
  };

  const classes = useStyles();

  return (
    <>
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
            {cellEncodingSettings.map((renderInfo) => (
              <FormControlLabel
                label={renderInfo.label}
                value={renderInfo.value}
                className={classes.iconRadio}
                control={
                  <IconButton
                    size="small"
                    onClick={changeCellEncoding(renderInfo.type)}
                  >
                    {cellEncoding === renderInfo.type ? (
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
            ))}
          </RadioGroup>
        </FormControl>
      </Box>
    </>
  );
});

export default EnhancerGenesSettings;
