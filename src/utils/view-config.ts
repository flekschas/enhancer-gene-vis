import { Overlay, ViewConfig } from '../view-config-types';

export const enum TrackUidPrefix {
  ARCS = 'arcs-track',
  STACKED_BAR = 'stacked-bar-track',
  STRATIFIED_BED = 'strat-bed-track',
  DNA_ACCESSIBILITY = 'dna-accessibility-track',
}

export const enum TrackOverlayUid {
  REGION_FOCUS = 'region-focus',
  TSS = 'tss',
}

export function getOverlayByUid(
  viewConfig: ViewConfig,
  uid: string,
  viewIndex: number = 0
): Overlay {
  const overlay = viewConfig.views[viewIndex].overlays.find(
    (overlay) => overlay.uid === uid
  );
  if (!overlay) {
    throw new Error(
      `Overlay with uid ${uid} not found in view with index ${viewIndex}`
    );
  }
  return overlay;
}

export function replaceUidInOverlayIncludes(
  overlay: Overlay,
  oldUid: string,
  newUid: string
) {
  const includesArr = overlay.includes;
  const currUidIndex = includesArr.indexOf(oldUid);
  includesArr.splice(currUidIndex, 1, newUid);
}
