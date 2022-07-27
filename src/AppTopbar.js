import React, { useMemo } from 'react';
import { useRecoilState } from 'recoil';

import AppBar from '@material-ui/core/AppBar';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';

import SearchField from './SearchField';

import usePrevious from './hooks/use-previous';

import {
  focusGeneOptionState,
  // focusVariantOptionState,
  focusRegionOptionState,
  useFocusGene,
  // useFocusVariant,
  useFocusRegion,
} from './state/focus-state';

import { DRAWER_WIDTH, GENE_SEARCH_URL, VARIANT_SEARCH_URL } from './constants';

import { isChrRange } from './utils';

const useStyles = makeStyles((theme) => ({
  appBar: {
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    marginLeft: DRAWER_WIDTH,
    color: theme.palette.common.black,
    backgroundColor: theme.palette.common.white,
    boxShadow: `0 1px 0 0 ${theme.palette.grey['300']}`,
  },
  toolbarExtra: {
    paddingLeft: 0,
    paddingRight: 0,
    alignItems: 'flex-end',
  },
}));

const locationSearch = async (query) => {
  if (!query) return undefined;

  const match = isChrRange(query);

  if (!match) return undefined;

  const startChr = match[1];
  const startPos = +match[2];
  const endChr = match[7] || match[1];

  let endPos =
    match[8] ||
    (match[4] === '~' || match[4] === '+' ? startPos + +match[5] : +match[5]);

  endPos = Number.isNaN(endPos) ? startPos + 1 : endPos;

  if (startChr && startPos && endChr && endPos) {
    return [
      {
        chrStart: `chr${startChr}`,
        chrEnd: `chr${endChr}`,
        txStart: startPos,
        txEnd: endPos,
        geneName: query,
        type: 'region',
      },
    ];
  }

  return undefined;
};

const AppTopbar = React.memo(function AppTopbar() {
  const [focusGene, setFocusGene] = useFocusGene();
  // const [focusVariant, setFocusVariant] = useFocusVariant();
  const [focusRegion, setFocusRegion] = useFocusRegion();

  const [focusGeneOption, setFocusGeneOption] = useRecoilState(
    focusGeneOptionState
  );
  const [focusRegionOption, setFocusRegionOption] = useRecoilState(
    focusRegionOptionState
  );

  const prevFocusGeneOption = usePrevious(focusGeneOption);
  // const prevFocusVariantOption = usePrevious(focusVariantOption);
  const prevFocusRegionOption = usePrevious(focusRegionOption);

  // Derived State
  const focusOptions = useMemo(
    () => {
      const _focusOptions = [];
      // At first we add the focus element that has not changed!
      if (focusGeneOption && focusGeneOption === prevFocusGeneOption)
        _focusOptions.push(focusGeneOption);
      if (focusRegionOption && focusRegionOption === prevFocusRegionOption)
        _focusOptions.push(focusRegionOption);
      // Subsequently, we add the focused element that has changed!
      if (focusGeneOption && focusGeneOption !== prevFocusGeneOption)
        _focusOptions.push(focusGeneOption);
      if (focusRegionOption && focusRegionOption !== prevFocusRegionOption)
        _focusOptions.push(focusRegionOption);
      return _focusOptions;
    },
    // `prevFocusGeneOption` and `prevFocusVariantOption` are ommitted
    // on purpose to avoid circular updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusGeneOption, focusRegionOption]
  );

  const clearFocusGene = () => {
    setFocusGene('');
    setFocusGeneOption(null);
  };

  const clearFocusRegion = () => {
    setFocusRegion('');
    setFocusRegionOption(null);
  };

  const focusOptionChangeHandler = (newOptions) => {
    if (newOptions.length) {
      const newFocusElements = {};
      // We only allow exactly two options!
      newOptions.slice(newOptions.length - 2).forEach((newOption) => {
        switch (newOption.type) {
          case 'gene':
            newFocusElements.gene = newOption;
            if (focusGene !== newOption.geneName) {
              setFocusGene(newOption.geneName);
              setFocusGeneOption(newOption);
            }
            break;

          case 'variant':
            newFocusElements.variant = newOption;
            if (focusRegion !== newOption.geneName) {
              setFocusRegion(newOption.geneName);
              setFocusRegionOption(newOption);
            }
            break;

          case 'region':
            newFocusElements.region = newOption;
            if (focusRegion !== newOption.geneName) {
              setFocusRegion([
                `${newOption.chrStart}:${newOption.txStart}`,
                `${newOption.chrEnd}:${newOption.txEnd}`,
              ]);
              setFocusRegionOption(newOption);
            }
            break;

          default:
            // eslint-disable-next-line no-console
            console.warn('Unknown focus element', newOption);
            break;
        }
      });
      // Unset focus elements
      if (focusGene && !newFocusElements.gene) clearFocusGene();
      if (focusRegion && !newFocusElements.region && !newFocusElements.variant)
        clearFocusRegion();
    } else {
      clearFocusGene();
      clearFocusRegion();
    }
  };

  const classes = useStyles();

  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar
        classes={{
          root: classes.toolbarExtra,
        }}
      >
        <FormControl fullWidth>
          <SearchField
            label={
              <Grid container direction="row" alignItems="center">
                <SearchIcon fontSize="small" />
                <span style={{ marginLeft: 3 }}>Gene, Variant, or Region</span>
              </Grid>
            }
            customSearch={locationSearch}
            searchUrl={[
              { url: GENE_SEARCH_URL, type: 'gene' },
              { url: VARIANT_SEARCH_URL, type: 'variant' },
            ]}
            onChange={focusOptionChangeHandler}
            value={focusOptions}
            variant="filled"
            larger
            fullWidth
            multiple
          />
        </FormControl>
      </Toolbar>
    </AppBar>
  );
});

export default AppTopbar;
