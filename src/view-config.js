import { deepClone, isFunction } from '@flekschas/utils';

import { getIntervalCenter } from './utils';

import { DEFAULT_VARIANT_TRACK_DEF } from './constants';

const getFocusGeneRegion = (viewConfig) => {
  return viewConfig.views[0].overlays[1] &&
    viewConfig.views[0].overlays[1].options.extent &&
    viewConfig.views[0].overlays[1].options.extent.length
    ? [...viewConfig.views[0].overlays[1].options.extent[0]]
    : null;
};

const getFocusVariantRegion = (viewConfig) => {
  const track = viewConfig.views[0].tracks.top[2];
  let focusRegion = null;

  if (track.type === 'combined') {
    if (!track.contents[0]) return focusRegion;
    focusRegion = track.contents[0].options.focusRegion;
  } else {
    focusRegion = track.options.focusRegion;
  }

  return focusRegion ? [...focusRegion] : focusRegion;
};

export const updateViewConfigVariantTracks = (variantTrackConfigs) => (
  viewConfig
) => {
  const track = viewConfig.views[0].tracks.top[2];

  if (track.type === 'combined') {
    track.contents = variantTrackConfigs.reduce((tracks, trackConfig) => {
      const variantTrack = deepClone(DEFAULT_VARIANT_TRACK_DEF);
      if (trackConfig.server && trackConfig.tilesetUid) {
        variantTrack.server = trackConfig.server;
        variantTrack.tilesetUid = trackConfig.tilesetUid;
        variantTrack.uid = `variants-${trackConfig.tilesetUid}`;
        if (trackConfig.label) {
          variantTrack.options.name = trackConfig.label;
        } else {
          // Lets rely on the tileset name
          delete variantTrack.options.name;
        }
        tracks.push(variantTrack);
      } else if (trackConfig.file) {
        variantTrack.data = { type: 'localBed', id: trackConfig.file.name };
        variantTrack.uid = `variants-${trackConfig.file.name}`;
        variantTrack.options.name = trackConfig.label || 'Variants';
        tracks.push(variantTrack);
      }
      return tracks;
    }, []);

    track.height = (track.contents.length > 0) * 32;
  }

  return viewConfig;
};

export const updateViewConfigFocusRegion = (region, trackIdxs = []) => (
  viewConfig
) => {
  const delFocusRegion = (track, focusRegion) => {
    if (track.type === 'combined') {
      track.contents.forEach((childTrack) => {
        delete childTrack.options.focusRegion;
      });
    } else {
      delete track.options.focusRegion;
    }
  };

  const setFocusRegion = (track, focusRegion) => {
    if (track.type === 'combined') {
      track.contents.forEach((childTrack) => {
        childTrack.options.focusRegion = focusRegion;
      });
    } else {
      track.options.focusRegion = focusRegion;
    }
  };

  if (!Array.isArray(region) || region === null) {
    trackIdxs.forEach((trackIdx) => {
      delFocusRegion(viewConfig.views[0].tracks.top[trackIdx]);
    });
    viewConfig.views[0].overlays[0].options.extent = [];
  } else {
    const focusRegion = [region[0] - 0.5, region[1] - 0.5];

    trackIdxs.forEach((trackIdx) => {
      setFocusRegion(viewConfig.views[0].tracks.top[trackIdx], focusRegion);
    });

    viewConfig.views[0].overlays[0].options.extent = [focusRegion];
  }

  return viewConfig;
};

export const updateViewConfigVariantYScale = (yScale) => (viewConfig) => {
  const track = viewConfig.views[0].tracks.top[2];

  if (track.type === 'combined') {
    track.contents.forEach((childTrack) => {
      childTrack.options.valueColumn = yScale === 'pValue' ? 7 : 8;
    });
  } else {
    track.options.valueColumn = yScale === 'pValue' ? 7 : 8;
  }

  return viewConfig;
};

export const updateViewConfigXDomain = (
  newXDomainStart,
  newXDomainEnd,
  { force = false } = {}
) => (viewConfig) => {
  const _force = force === true || (isFunction(force) && force());

  const xDomain = [...viewConfig.views[0].initialXDomain];
  const focusGeneRegion = getFocusGeneRegion(viewConfig);
  const focusVariantRegion = getFocusVariantRegion(viewConfig);

  if (!Number.isNaN(+newXDomainStart)) {
    xDomain[0] = newXDomainStart;
  }
  if (!Number.isNaN(+newXDomainEnd)) {
    xDomain[1] = newXDomainEnd;
  }

  if (focusGeneRegion && !_force) {
    xDomain[0] = focusGeneRegion[0] - 100000;
    xDomain[1] = focusGeneRegion[1] + 100000;
  }

  if (focusVariantRegion && !_force) {
    xDomain[0] = Math.min(xDomain[0], focusVariantRegion[0] - 100000);
    xDomain[1] = Math.max(xDomain[1], focusVariantRegion[1] + 100000);
  }

  viewConfig.views[0].initialXDomain = xDomain;

  return viewConfig;
};

export const updateViewConfigFocusGene = (gene, start, end) => (viewConfig) => {
  const n = viewConfig.views[0].tracks.top.length;

  if (gene) {
    viewConfig.views[0].tracks.top[n - 1].options.focusGene = gene;
    viewConfig.views[0].overlays[1].options.extent = [[start, end]];
  } else {
    delete viewConfig.views[0].tracks.top[n - 1].options.focusGene;
    delete viewConfig.views[0].overlays[1].options.extent;
  }

  return viewConfig;
};

export const getDnaAccessXDomain = (
  focusRegionAbs,
  focusGeneStart,
  focusGeneEnd,
  xDomainStartAbs,
  xDomainEndAbs
) => {
  const enhancerViewRange = xDomainEndAbs - xDomainStartAbs;
  const enhancerViewCenter = xDomainStartAbs + enhancerViewRange / 2;

  if (focusRegionAbs) {
    const focusRegionCenter = getIntervalCenter(focusRegionAbs);
    if (
      enhancerViewRange < 5000 &&
      Math.abs(enhancerViewCenter - focusRegionCenter) < 1000
    ) {
      return [xDomainStartAbs, xDomainEndAbs];
    }
    return [focusRegionAbs[0] - 2500, focusRegionAbs[1] + 2500];
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
