import React, { useMemo } from 'react';
import { useRecoilState } from 'recoil';

import AppBar from '@material-ui/core/AppBar';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';

import SearchField from './SearchField';

import usePrevious from './use-previous';

import {
  focusGeneOptionState,
  focusVariantOptionState,
  useFocusGene,
  useFocusVariant,
} from './state';

import { DRAWER_WIDTH, GENE_SEARCH_URL, VARIANT_SEARCH_URL } from './constants';

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

  const match = query.match(/^chr(\d+):(\d)+$/);
  if (
    match &&
    ((+match[1] > 0 && +match[1] < 23) ||
      +match[1].toLowerCase() === 'x' ||
      +match[1].toLowerCase() === 'y')
  ) {
    return [
      {
        chr: `chr${match[1]}`,
        txStart: +match[2],
        txEnd: +match[2] + 1,
        score: 0,
        geneName: query,
        type: 'nucleotide',
      },
    ];
  }

  return undefined;
};

const AppTopbar = React.memo(function AppTopbar() {
  const [focusGene, setFocusGene] = useFocusGene();
  const [focusVariant, setFocusVariant] = useFocusVariant();
  const [focusGeneOption, setFocusGeneOption] = useRecoilState(
    focusGeneOptionState
  );
  const [focusVariantOption, setFocusVariantOption] = useRecoilState(
    focusVariantOptionState
  );

  const prevFocusGeneOption = usePrevious(focusGeneOption);
  const prevFocusVariantOption = usePrevious(focusVariantOption);

  // Derived State
  const focusGeneVariantOptions = useMemo(
    () => {
      const _focusGeneVariant = [];
      // Add the focus element that has not changed first!
      if (focusGeneOption && focusGeneOption === prevFocusGeneOption)
        _focusGeneVariant.push(focusGeneOption);
      if (focusVariantOption && focusVariantOption === prevFocusVariantOption)
        _focusGeneVariant.push(focusVariantOption);
      // Now add the focused element that has changed!
      if (focusGeneOption && focusGeneOption !== prevFocusGeneOption)
        _focusGeneVariant.push(focusGeneOption);
      if (focusVariantOption && focusVariantOption !== prevFocusVariantOption)
        _focusGeneVariant.push(focusVariantOption);
      return _focusGeneVariant;
    },
    // `prevFocusGeneOption` and `prevFocusVariantOption` are ommitted
    // on purpose to avoid circular updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusGeneOption, focusVariantOption]
  );

  const clearFocusGene = () => {
    setFocusGene('');
    setFocusGeneOption(null);
  };

  const clearFocusVariant = () => {
    setFocusVariant('');
    setFocusVariantOption(null);
  };

  const focusGeneVariantChangeHandler = (newValues) => {
    if (newValues.length) {
      const newFocusElements = {};
      // We only allow exactly two selections
      newValues.slice(newValues.length - 2).forEach((newValue) => {
        switch (newValue.type) {
          case 'gene':
            newFocusElements.gene = newValue;
            if (focusGene !== newValue.geneName) {
              setFocusGene(newValue.geneName);
              setFocusGeneOption(newValue);
            }
            break;

          case 'variant':
            newFocusElements.variant = newValue;
            if (focusVariant !== newValue.geneName) {
              setFocusVariant(newValue.geneName);
              setFocusVariantOption(newValue);
            }
            break;

          default:
            // eslint-disable-next-line no-console
            console.warn('Unknown focus element', newValue);
            break;
        }
      });
      // Unset focus elements
      if (focusGene && !newFocusElements.gene) clearFocusGene();
      if (focusVariant && !newFocusElements.variant) clearFocusVariant();
    } else {
      clearFocusGene();
      clearFocusVariant();
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
                <span style={{ marginLeft: 3 }}>Gene or Variant</span>
              </Grid>
            }
            customSearch={locationSearch}
            searchUrl={[
              { url: GENE_SEARCH_URL, type: 'gene' },
              { url: VARIANT_SEARCH_URL, type: 'variant' },
            ]}
            onChange={focusGeneVariantChangeHandler}
            value={focusGeneVariantOptions}
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
