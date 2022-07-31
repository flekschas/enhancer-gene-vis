import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { deepClone, pipe } from '@flekschas/utils';
import { HiGlassApi, HiGlassComponent } from 'higlass';

import { useChromInfo } from '../../ChromInfoProvider';
import DnaAccessibilityInfo from './DnaAccessibilityInfo';
import DnaAccessibilityHelp from './DnaAccessibilityHelp';
import DnaAccessibilitySettings from './DnaAccessibilitySettings';

import TitleBar from '../../TitleBar';

import {
  higlassDnaAccessState,
  sampleSelectionState,
  variantYScaleState,
  dnaAccessXDomainWithAssembly,
} from '../../state';
import {
  dnaAccessLabelStyleState,
  dnaAccessRowNormState,
  useDnaAccessShowInfos,
} from '../../state/dna-accessibility-state';
import { focusRegionAbsWithAssembly } from '../../state/focus-state';
import { variantTracksState } from '../../state/variant-track-state';

import {
  DEFAULT_DNA_ACCESSIBILITY_ROW_SELECTION,
  DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY,
} from './constants-dna-accessibility';
import useDebounce from '../../hooks/use-debounce';

import {
  updateViewConfigFocusRegion,
  updateViewConfigVariantYScale,
  updateViewConfigXDomain,
  updateViewConfigVariantTracks,
} from '../../view-config';

import 'higlass/dist/hglib.css';
import { DnaAccessibilityLabelStyle, RidgePlotTrack, ViewConfig } from '../../view-config-types';
import { getTrackByUid } from '../../view-config-typed';

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

const updateViewConfigDnaAccessLabelStyle = (
  labelStyle: DnaAccessibilityLabelStyle
) => (viewConfig: ViewConfig) => {
  const track = getTrackByUid(
    viewConfig,
    'dna-accessibility'
  ) as RidgePlotTrack;
  track.options.showRowLabels = labelStyle;
  return viewConfig;
};

const updateViewConfigDnaAccessRowNorm = (rowNorm: boolean) => (
  viewConfig: ViewConfig
) => {
  const track = getTrackByUid(
    viewConfig,
    'dna-accessibility'
  ) as RidgePlotTrack;
  track.options.rowNormalization = rowNorm;
  return viewConfig;
};

const updateViewConfigRowSelection = (selection: boolean[]) => (
  viewConfig: ViewConfig
) => {
  const track = getTrackByUid(
    viewConfig,
    'dna-accessibility'
  ) as RidgePlotTrack;
  track.options.rowSelections = DEFAULT_DNA_ACCESSIBILITY_ROW_SELECTION.filter(
    (rowId, i) => selection[i]
  );
  return viewConfig;
};

const DnaAccessibility = React.memo(function DnaAccessibility() {
  const chromInfo = useChromInfo();

  const setHiglassDnaAccess = useSetRecoilState(higlassDnaAccessState);

  const sampleSelection = useRecoilValue(sampleSelectionState);
  const labelStyle = useRecoilValue(dnaAccessLabelStyleState);
  const rowNorm = useRecoilValue(dnaAccessRowNormState);
  const variantYScale = useRecoilValue(variantYScaleState);
  const variantTracks = useRecoilValue(variantTracksState);
  const focusRegionAbs = useRecoilValue(focusRegionAbsWithAssembly(chromInfo));

  const higlassApi = useRef<HiGlassApi|null>(null);

  const xDomainAbsDb = useDebounce(
    useRecoilValue(dnaAccessXDomainWithAssembly(chromInfo)),
    500
  );

  const higlassInitHandler = useCallback(
    (higlassInstance) => {
      if (higlassInstance !== null) {
        setHiglassDnaAccess(higlassInstance.api);
        higlassApi.current = higlassInstance.api;
      }
    },
    [setHiglassDnaAccess]
  );

  const viewConfig = useMemo(
    () =>
      pipe(
        updateViewConfigVariantTracks(variantTracks),
        updateViewConfigFocusRegion(focusRegionAbs, [2]),
        updateViewConfigVariantYScale(variantYScale),
        updateViewConfigDnaAccessLabelStyle(labelStyle),
        updateViewConfigDnaAccessRowNorm(rowNorm),
        updateViewConfigXDomain(...xDomainAbsDb, { force: true }),
        updateViewConfigRowSelection(sampleSelection)
      )(deepClone(DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // `xDomainStartAbs` and `xDomainEndAbs` are ommitted on purpose to avoid
      // updating the view-config on every pan or zoom event.
      variantTracks,
      focusRegionAbs,
      xDomainAbsDb,
      variantYScale,
      labelStyle,
      sampleSelection,
      rowNorm,
    ]
  );

  // Unmount
  useEffect(
    () => () => {
      if (higlassApi.current) {
        higlassApi.current.destroy();
      }
    },
    // Execute only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // On every render
  const classes = useStyles();

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
      <Grid item container direction="column" className={classes.grow}>
        <HiGlassComponent
          ref={higlassInitHandler}
          viewConfig={viewConfig}
          options={{
            sizeMode: 'scroll',
            pixelPreciseMarginPadding: true,
            containerPaddingX: 0,
            containerPaddingY: 0,
            viewMarginTop: 0,
            viewMarginBottom: 0,
            viewMarginLeft: 0,
            viewMarginRight: 0,
            viewPaddingTop: 0,
            viewPaddingBottom: 0,
            viewPaddingLeft: 0,
            viewPaddingRight: 16,
            globalMousePosition: true,
          }}
        />
      </Grid>
    </Grid>
  );
});

export default DnaAccessibility;
