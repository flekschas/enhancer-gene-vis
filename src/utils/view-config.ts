import { Overlay, Track, TrackType, ViewConfig } from '../view-config-types';

/**
 * Should only contain UIDs for "constant" tracks such as combined type tracks.
 * Tracks with dynamic UIDs based on tileset UIDs will not work in an enum.
 */
export const enum CombinedTrackUid {
  ARCS_AND_BARS = 'arcs-stacked-bars',
}

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

export function getTrackByUid(
  viewConfig: ViewConfig,
  uid: string,
  byPrefix: boolean = true
): Track {
  const topTracks = viewConfig.views[0].tracks.top;
  if (!topTracks) {
    throw new Error('No tracks found in top track layout');
  }
  const topTracksFlattened = topTracks
    .map((track) => {
      if (track.type === TrackType.COMBINED) {
        return [track, ...track.contents];
      }
      return track;
    })
    .flat();
  const trackCandidate = byPrefix
    ? topTracksFlattened.find((track) => track.uid.startsWith(uid))
    : topTracksFlattened.find((track) => track.uid === uid);
  if (!trackCandidate) {
    throw new Error(`No track found with uid: ${uid}`);
  }
  return trackCandidate;
}

export function replaceTrackByType(
  trackList: Track[],
  type: TrackType,
  newTrack: Track
) {
  const index = trackList.findIndex((track) => track.type === type);
  trackList[index] = newTrack;
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
