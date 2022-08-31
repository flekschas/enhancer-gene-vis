/**
 * @fileoverview
 * Renders the DNA accessibility of all cell samples in a stratified fashion
 * using ridge plots.
 *
 * Modifications to the RidgePlotTrack are done by editing the track's options
 * in the ViewConfig.
 */
import React from 'react';
import { useRecoilValue } from 'recoil';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import DnaAccessibilityInfo from './DnaAccessibilityInfo';
import DnaAccessibilityHelp from './DnaAccessibilityHelp';
import DnaAccessibilitySettings from './DnaAccessibilitySettings';

import TitleBar from '../../TitleBar';

import {
  higlassDnaAccessExpState,
  higlassDnaAccessPredState,
} from '../../state';
import {
  dnaAccessibilityExperimentalTrackState,
  useDnaAccessShowInfos,
  dnaAccessShowPredTrack,
  dnaAccessibilityPredictedTrackState,
} from '../../state/dna-accessibility-state';

import 'higlass/dist/hglib.css';
import DnaAccessibilityHiglassComponent from './DnaAccessibilityHiglassComponent';
import { DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY } from './constants-dna-accessibility';

const useStyles = makeStyles((_theme) => ({
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  grow: {
    flexGrow: 1,
  },
}));

const DnaAccessibility = React.memo(function DnaAccessibility() {
  const shouldShowPredTrack = useRecoilValue(dnaAccessShowPredTrack);

  // On every render
  const classes = useStyles();
  const experimentalTrackFragment = (
    <DnaAccessibilityHiglassComponent
      trackState={dnaAccessibilityExperimentalTrackState}
      higlassState={higlassDnaAccessExpState}
      defaultViewConfig={DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY}
    />
  );
  const predictionTrackFragment = (
    <DnaAccessibilityHiglassComponent
      trackState={dnaAccessibilityPredictedTrackState}
      higlassState={higlassDnaAccessPredState}
      defaultViewConfig={DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY}
    />
  );
  return (
    <Grid container direction="column" className={classes.root}>
      <TitleBar
        id="dna-accessibility"
        title="DNA Accessibility"
        useShowInfo={useDnaAccessShowInfos}
        Info={DnaAccessibilityInfo}
        Help={DnaAccessibilityHelp}
        Settings={DnaAccessibilitySettings}
      />

      {shouldShowPredTrack ? (
        <Grid item container className={classes.grow}>
          <Grid item container direction="column" className={classes.grow} md>
            {experimentalTrackFragment}
          </Grid>
          <Grid item container direction="column" className={classes.grow} md>
            {predictionTrackFragment}
          </Grid>
        </Grid>
      ) : (
        <Grid item container direction="column" className={classes.grow}>
          {experimentalTrackFragment}
        </Grid>
      )}
    </Grid>
  );
});

export default DnaAccessibility;
