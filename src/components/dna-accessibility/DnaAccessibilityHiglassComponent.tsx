/**
 * @fileoverview
 * Renders the DNA accessibility of all cell samples in a stratified fashion
 * using ridge plots.
 *
 * Modifications to the RidgePlotTrack are done by editing the track's options
 * in the ViewConfig.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { RecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { deepClone, pipe } from '@flekschas/utils';
import { HiGlassApi, HiGlassComponent } from 'higlass';

import { useChromInfo } from '../../ChromInfoProvider';

import { variantYScaleState, dnaAccessXDomainWithAssembly } from '../../state';
import { sampleSelectionState } from '../../state/filter-state';
import {
  DnaAccessibilityTrackInfo,
  dnaAccessLabelStyleState,
  dnaAccessRowNormState,
} from '../../state/dna-accessibility-state';
import { focusRegionAbsWithAssembly } from '../../state/focus-state';
import { variantTracksState } from '../../state/variant-track-state';

import useDebounce from '../../hooks/use-debounce';

import {
  updateViewConfigFocusRegion,
  updateViewConfigVariantYScale,
  updateViewConfigXDomain,
  updateViewConfigVariantTracks,
} from '../../view-config';

import 'higlass/dist/hglib.css';
import {
  RidgePlotTrackLabelStyle,
  RidgePlotTrack,
  ViewConfig,
} from '../../view-config-types';
import {
  Stratification,
  stratificationState,
} from '../../state/stratification-state';
import { createCategoryMap } from './dna-accessibility-fns';
import {
  getOverlayByUid,
  replaceUidInOverlayIncludes,
  TrackOverlayUid,
  TrackUidPrefix,
  getTrackByUid,
} from '../../utils/view-config';

const updateViewConfigDnaAccessibilityTrack =
  (trackInfo: DnaAccessibilityTrackInfo) => (viewConfig: ViewConfig) => {
    const track = getTrackByUid(
      viewConfig,
      TrackUidPrefix.DNA_ACCESSIBILITY
    ) as RidgePlotTrack;
    const overlay = getOverlayByUid(viewConfig, TrackOverlayUid.REGION_FOCUS);
    const oldUid = track.uid;
    const newUid = `${TrackUidPrefix.DNA_ACCESSIBILITY}-${trackInfo.tilesetUid}`;
    track.server = trackInfo.server;
    track.tilesetUid = trackInfo.tilesetUid;
    track.options.name = trackInfo.label;
    track.uid = newUid;
    replaceUidInOverlayIncludes(overlay, oldUid, newUid);
    return viewConfig;
  };

const updateViewConfigDnaAccessLabelStyle =
  (labelStyle: RidgePlotTrackLabelStyle) => (viewConfig: ViewConfig) => {
    const track = getTrackByUid(
      viewConfig,
      TrackUidPrefix.DNA_ACCESSIBILITY
    ) as RidgePlotTrack;
    track.options.showRowLabels = labelStyle;
    return viewConfig;
  };

const updateViewConfigDnaAccessRowNorm =
  (rowNorm: boolean) => (viewConfig: ViewConfig) => {
    const track = getTrackByUid(
      viewConfig,
      TrackUidPrefix.DNA_ACCESSIBILITY
    ) as RidgePlotTrack;
    track.options.rowNormalization = rowNorm;
    return viewConfig;
  };

const updateViewConfigRowSelection =
  (selection: string[]) => (viewConfig: ViewConfig) => {
    const track = getTrackByUid(
      viewConfig,
      TrackUidPrefix.DNA_ACCESSIBILITY
    ) as RidgePlotTrack;
    track.options.rowSelections = selection;
    return viewConfig;
  };

const updateViewConfigStratification =
  (stratification: Stratification) => (viewConfig: ViewConfig) => {
    const track = getTrackByUid(
      viewConfig,
      TrackUidPrefix.DNA_ACCESSIBILITY
    ) as RidgePlotTrack;
    const categoryMap = createCategoryMap(stratification);
    track.options.rowCategories = categoryMap;
    return viewConfig;
  };

type DnaAccessibilityHiglassComponentProps = {
  trackState: RecoilState<DnaAccessibilityTrackInfo>;
  defaultViewConfig: ViewConfig;
  // TODO: Fix when higlass instance is typed
  higlassState: RecoilState<any>;
};
const DnaAccessibilityHiglassComponent = React.memo(
  function DnaAccessibilityHiglassComponent({
    trackState,
    defaultViewConfig,
    higlassState,
  }: DnaAccessibilityHiglassComponentProps) {
    const chromInfo = useChromInfo();

    const setHiglassDnaAccess = useSetRecoilState(higlassState);

    const dnaAccessibilityTrackInfo = useRecoilValue(trackState);
    const sampleSelection = useRecoilValue(sampleSelectionState);
    const labelStyle = useRecoilValue(dnaAccessLabelStyleState);
    const rowNorm = useRecoilValue(dnaAccessRowNormState);
    const variantYScale = useRecoilValue(variantYScaleState);
    const variantTracks = useRecoilValue(variantTracksState);
    const focusRegionAbs = useRecoilValue(
      focusRegionAbsWithAssembly(chromInfo)
    );
    const stratification = useRecoilValue(stratificationState);

    const higlassApi = useRef<HiGlassApi | null>(null);

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
          updateViewConfigDnaAccessibilityTrack(dnaAccessibilityTrackInfo),
          updateViewConfigVariantTracks(variantTracks),
          updateViewConfigFocusRegion(focusRegionAbs, [2]),
          updateViewConfigVariantYScale(variantYScale),
          updateViewConfigDnaAccessLabelStyle(labelStyle),
          updateViewConfigDnaAccessRowNorm(rowNorm),
          updateViewConfigXDomain(...xDomainAbsDb, { force: true }),
          updateViewConfigRowSelection(sampleSelection),
          updateViewConfigStratification(stratification)
        )(deepClone(defaultViewConfig)),
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
        stratification,
        dnaAccessibilityTrackInfo,
      ]
    );

    // On every render
    return (
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
    );
  }
);

export default DnaAccessibilityHiglassComponent;
