import React, { useCallback, useMemo } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { deepClone, pipe } from '@flekschas/utils';
import { HiGlassComponent } from 'higlass';

import { useChromInfo } from './ChromInfoProvider';
import DnaAccessibilityInfo from './DnaAccessibilityInfo';
import DnaAccessibilityHelp from './DnaAccessibilityHelp';
import DnaAccessibilitySettings from './DnaAccessibilitySettings';

import TitleBar from './TitleBar';

import {
  higlassDnaAccessState,
  dnaAccessLabelStyleState,
  focusGeneStartWithAssembly,
  focusGeneEndWithAssembly,
  focusVariantPositionWithAssembly,
  useDnaAccessShowInfos,
  variantYScaleState,
  xDomainEndAbsWithAssembly,
  xDomainStartAbsWithAssembly,
  sampleSelectionState,
} from './state';
import {
  DEFAULT_DNA_ACCESSIBILITY_ROW_SELECTION,
  DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY,
} from './constants';
import useDebounce from './use-debounce';

import {
  updateViewConfigFocusVariant,
  updateViewConfigVariantYScale,
  updateViewConfigXDomain,
} from './view-config';

import 'higlass/dist/hglib.css';

const useStyles = makeStyles((theme) => ({
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

const updateViewConfigDnaAccessLabels = (labels) => (viewConfig) => {
  viewConfig.views[0].tracks.top[3].options.showRowLabels =
    !labels || labels === 'hidden' ? false : labels;
  return viewConfig;
};

const getDnaAccessXDomain = (
  focusVariantPosition,
  focusGeneStart,
  focusGeneEnd,
  xDomainStartAbs,
  xDomainEndAbs
) => {
  const enhancerViewRange = xDomainEndAbs - xDomainStartAbs;
  const enhancerViewCenter = xDomainStartAbs + enhancerViewRange / 2;

  if (focusVariantPosition) {
    if (
      enhancerViewRange < 5000 &&
      Math.abs(enhancerViewCenter - focusVariantPosition) < 1000
    ) {
      return [xDomainStartAbs, xDomainEndAbs];
    }
    return [focusVariantPosition - 2500, focusVariantPosition + 2500];
  }

  if (focusGeneStart && focusGeneEnd) {
    const midPos = focusGeneStart + (focusGeneEnd - focusGeneStart) / 2;

    if (
      enhancerViewRange < 5000 &&
      enhancerViewCenter > focusGeneStart &&
      enhancerViewCenter < focusGeneEnd
    ) {
      return [xDomainStartAbs, xDomainEndAbs];
    }

    return [midPos - 2500, midPos + 2500];
  }

  return [xDomainStartAbs, xDomainEndAbs];
};

const updateViewConfigDnaAccessXDomain = (...args) =>
  updateViewConfigXDomain(...getDnaAccessXDomain(...args), { force: true });

const updateViewConfigRowSelection = (selection) => (viewConfig) => {
  viewConfig.views[0].tracks.top[3].options.rowSelections = DEFAULT_DNA_ACCESSIBILITY_ROW_SELECTION.filter(
    (rowId, i) => selection[i]
  );
  return viewConfig;
};

const DnaAccessibility = React.memo(function DnaAccessibility() {
  const chromInfo = useChromInfo();

  const setHiglassDnaAccess = useSetRecoilState(higlassDnaAccessState);

  const sampleSelection = useRecoilValue(sampleSelectionState);
  const labelStyle = useRecoilValue(dnaAccessLabelStyleState);
  const variantYScale = useRecoilValue(variantYScaleState);
  const focusGeneStart = useRecoilValue(focusGeneStartWithAssembly(chromInfo));
  const focusGeneEnd = useRecoilValue(focusGeneEndWithAssembly(chromInfo));
  const focusVariantPosition = useRecoilValue(
    focusVariantPositionWithAssembly(chromInfo)
  );

  const xDomainStartAbsDb = useDebounce(
    useRecoilValue(xDomainStartAbsWithAssembly(chromInfo)),
    500
  );
  const xDomainEndAbsDb = useDebounce(
    useRecoilValue(xDomainEndAbsWithAssembly(chromInfo)),
    500
  );

  const higlassInitHandler = useCallback(
    (higlassInstance) => {
      if (higlassInstance !== null) {
        setHiglassDnaAccess(higlassInstance.api);
      }
    },
    [setHiglassDnaAccess]
  );

  const viewConfig = useMemo(
    () =>
      pipe(
        updateViewConfigFocusVariant(focusVariantPosition, [2]),
        updateViewConfigVariantYScale(variantYScale),
        updateViewConfigDnaAccessLabels(labelStyle),
        updateViewConfigDnaAccessXDomain(
          focusVariantPosition,
          focusGeneStart,
          focusGeneEnd,
          xDomainStartAbsDb,
          xDomainEndAbsDb
        ),
        updateViewConfigRowSelection(sampleSelection)
      )(deepClone(DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // `xDomainStartAbs` and `xDomainEndAbs` are ommitted on purpose to avoid
      // updating the view-config on every pan or zoom event.
      focusVariantPosition,
      focusGeneStart,
      focusGeneEnd,
      xDomainStartAbsDb,
      xDomainEndAbsDb,
      variantYScale,
      labelStyle,
      chromInfo,
      sampleSelection,
    ]
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
