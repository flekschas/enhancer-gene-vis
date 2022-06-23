import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { isString } from '@flekschas/utils';

import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';
import EnhancerRegions from './components/enhancer-regions/EnhancerRegions';
import EnhancerGenes from './components/enhancer-genes/EnhancerGenes';
import DnaAccessibility from './DnaAccessibility';
import ModalProvider from './ModalProvider';
import TooltipProvider from './TooltipProvider';

import { useChromInfo } from './ChromInfoProvider';

import {
  focusGeneOptionState,
  focusRegionOptionState,
  useFocusGene,
  useFocusRegion,
  useFocusGeneSyncher,
  useFocusRegionSyncher,
  useDnaAccessLabelStyleSyncher,
  useDnaAccessRowNormSyncher,
  useDnaAccessShowInfosSyncher,
  useXDomainStartWithAssemblySyncher,
  useXDomainEndWithAssemblySyncher,
  useVariantYScaleSyncher,
} from './state';
import {
  useShowWelcomeSyncher,} from './state/app-settings-state';
import { useVariantTracksSyncher } from './state/variant-track-state';
import {
  useEnhancerRegionsShowInfosSyncher,
  useEnhancerRegionsHideUnfocusedSyncher,
  useEnhancerRegionsColorEncodingSyncher,
  useEnhancerRegionsTrackSyncher,
} from './state/enhancer-region-state';
import {
  useEnhancerGenesShowInfosSyncher,
  useEnhancerGenesPaddingSyncher,
  useEnhancerGenesCellEncodingSyncher,
} from './state/enhancer-gene-track-state';

import { GENE_SEARCH_URL, VARIANT_SEARCH_URL } from './constants';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    display: 'flex',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  toolbar: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    padding: theme.spacing(1),
    backgroundColor: 'white',
  },
  grow: {
    flexGrow: 1,
  },
  separator: {
    zIndex: 1,
    margin: `-${theme.spacing(1)}px 0`,
    width: 1,
    background: theme.palette.grey['300'],
  },
  enhancerWrapper: {
    position: 'relative',
    flexGrow: 1,
    margin: '-8px 0 -8px -8px',
  },
  enhancer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflowY: 'auto',
    '&> div': {
      minHeight: '100%',
    },
  },
  enhancerRegions: {
    position: 'relative',
    flexGrow: 1,
  },
  enhancerGenes: {
    position: 'relative',
  },
  dnaAccessibility: {
    position: 'relative',
    width: '20rem',
    margin: '-8px -8px -8px 0',
  },
}));

const AppMain = React.memo(function AppMain() {
  const chromInfo = useChromInfo();

  // Initialize query strings
  useVariantTracksSyncher();
  useEnhancerRegionsTrackSyncher();
  useShowWelcomeSyncher();
  useFocusGeneSyncher();
  useFocusRegionSyncher();
  useDnaAccessLabelStyleSyncher();
  useDnaAccessRowNormSyncher();
  useDnaAccessShowInfosSyncher();
  useEnhancerRegionsShowInfosSyncher();
  useEnhancerRegionsHideUnfocusedSyncher();
  useEnhancerRegionsColorEncodingSyncher();
  useEnhancerGenesShowInfosSyncher();
  useEnhancerGenesPaddingSyncher();
  useEnhancerGenesCellEncodingSyncher();
  useVariantYScaleSyncher();
  useXDomainStartWithAssemblySyncher(chromInfo);
  useXDomainEndWithAssemblySyncher(chromInfo);

  const [focusGene, setFocusGene] = useFocusGene();
  const [focusRegion, setFocusRegion] = useFocusRegion();

  const [focusGeneOption, setFocusGeneOption] = useRecoilState(
    focusGeneOptionState
  );
  const [focusRegionOption, setFocusRegionOption] = useRecoilState(
    focusRegionOptionState
  );

  const clearFocusGene = () => {
    setFocusGene('');
    setFocusGeneOption(null);
  };

  const focusGeneChangeHandler = (newValue) => {
    if (newValue) {
      setFocusGene(newValue.geneName);
      setFocusGeneOption(newValue);
    } else {
      clearFocusGene();
    }
  };

  const clearFocusRegion = () => {
    setFocusRegion('');
    setFocusRegionOption(null);
  };

  const focusRegionChangeHandler = (newValue) => {
    if (newValue) {
      setFocusRegion(newValue.geneName);
      setFocusRegionOption(newValue);
    } else {
      clearFocusRegion();
    }
  };

  const classes = useStyles();

  // Initialize focus gene/variant options
  useEffect(
    () => {
      (async () => {
        if (focusGene && !focusGeneOption) {
          const r = await fetch(`${GENE_SEARCH_URL}&ac=${focusGene}`);
          const results = await r.json();
          const result = results[0];
          if (result) {
            result.type = 'gene';
            focusGeneChangeHandler(results[0]);
          }
        }
        if (focusRegion && isString(focusRegion) && !focusRegionOption) {
          const r = await fetch(`${VARIANT_SEARCH_URL}&ac=${focusRegion}`);
          const results = await r.json();
          const result = results[0];
          if (result) {
            result.type = 'variant';
            focusRegionChangeHandler(results[0]);
          }
        }
      })();
    },
    // Execute only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className={classes.root}>
      <ModalProvider>
        <CssBaseline />
        <AppTopbar />
        <AppSidebar />
        <TooltipProvider>
          <Grid
            container
            direction="column"
            className={classes.content}
            wrap="nowrap"
          >
            <div className={classes.toolbar} />
            <Grid container className={classes.grow} wrap="nowrap">
              <div className={classes.enhancerWrapper}>
                <div className={classes.enhancer}>
                  <Grid container direction="column">
                    <Grid item className={classes.enhancerRegions}>
                      <EnhancerRegions />
                    </Grid>
                    <Grid item className={classes.enhancerGenes}>
                      <EnhancerGenes />
                    </Grid>
                  </Grid>
                </div>
              </div>
              <div className={classes.separator} />
              <div className={classes.dnaAccessibility}>
                <DnaAccessibility />
              </div>
            </Grid>
          </Grid>
        </TooltipProvider>
      </ModalProvider>
    </div>
  );
});

export default AppMain;
