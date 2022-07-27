import { deepClone } from '@flekschas/utils';
import { EG_TILE_UID, ABC_SCORE_COLUMN, GENE_NAME_COLUMN } from './constants';
import { DEFAULT_STRATIFICATION } from './state/stratification-state';
import {
  DEFAULT_ENHANCER_GENE_ARC_TRACK,
  DEFAULT_ENHANCER_GENE_STACKED_BAR_TRACK,
  EnhancerGeneTrackInfo,
} from './state/enhancer-region-state';
import { DEFAULT_VARIANT_TRACK_DEF } from './state/variant-track-state';
import { ViewConfig, TrackType, Track } from './view-config-types';

/**
 * Should only contain UIDs for "constant" tracks such as combined type tracks.
 * Tracks with dynamic UIDs based on tileset UIDs will not work in an enum.
 */
export const enum CombinedTrackUid {
  ARCS_AND_BARS = 'arcs-stacked-bars',
}

export const DEFAULT_X_DOMAIN_START = 1761366260;
export const DEFAULT_X_DOMAIN_END = 1761603836;
export const DEFAULT_VIEW_CONFIG_ENHANCER: ViewConfig = {
  editable: false,
  trackSourceServers: ['//higlass.io/api/v1'],
  views: [
    {
      uid: 'context',
      genomePositionSearchBox: {
        autocompleteServer: '//higlass.io/api/v1',
        autocompleteId: 'OHJakQICQD6gTD7skx4EWA',
        chromInfoServer: '//higlass.io/api/v1',
        chromInfoId: 'hg19',
        visible: true,
      },
      chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
      tracks: {
        top: [
          {
            type: TrackType.COMBINED,
            uid: 'chroms-viewport',
            height: 12,
            contents: [
              {
                type: TrackType.HORIZONTAL_CHROMOSOME_LABELS,
                options: {
                  // tickPositions: 'ends',
                  color: '#999999',
                  stroke: 'white',
                  fontSize: 10,
                  fontIsLeftAligned: true,
                  showMousePosition: false,
                  mousePositionColor: '#000000',
                },
                tilesetUid: 'ADfY_RtsQR6oKOMyrq6qhw',
                height: 12,
                server: 'https://resgen.io/api/v1',
                uid: 'chroms',
              },
              {
                uid: 'viewport-details-chroms',
                type: TrackType.HORIZONTAL_VIEWPORT_PROJ,
                fromViewUid: 'details',
                height: 12,
                options: {
                  projectionFillColor: '#cc0078',
                  projectionStrokeColor: '#cc0078',
                  projectionFillOpacity: 0.3,
                  projectionStrokeOpacity: 0.3,
                  strokeWidth: 1,
                },
              },
            ],
          },
          {
            type: TrackType.COMBINED,
            uid: 'genes-tss-viewport',
            height: 48,
            contents: [
              {
                type: TrackType.HORIZONTAL_GENE_ANNOTATIONS,
                uid: 'genes',
                height: 48,
                server: 'https://resgen.io/api/v1',
                tilesetUid: 'NCifnbrKQu6j-ohVWJLoJw',
                options: {
                  fontSize: 9,
                  plusStrandColor: 'black',
                  minusStrandColor: 'black',
                  geneAnnotationHeight: 10,
                  geneLabelPosition: 'outside',
                  geneStrandSpacing: 0.5,
                  showMousePosition: true,
                  showGlobalMousePosition: true,
                  mousePositionColor: 'black',
                },
              },
              {
                type: TrackType.TSS,
                uid: 'tss',
                height: 48,
                // server: 'http://localhost:9876/api/v1',
                // tilesetUid: 'RefSeqCurated170308bedCollapsedGeneBoundsTSS500bp',
                server: 'https://resgen.io/api/v1',
                // tilesetUid: 'VMZDLKrtQDmJMSjg7Ds4yA',
                tilesetUid: 'QRtec09sQjuVmUaB_uUFEw', // with scores for prioritization
                options: {
                  fontSize: 9,
                  plusStrandColor: 'black',
                  minusStrandColor: 'black',
                  geneAnnotationHeight: 12,
                  geneLabelPosition: 'outside',
                  geneStrandSpacing: 2,
                  maxPerTile: 25,
                },
              },
              {
                uid: 'viewport-details-genes',
                type: TrackType.HORIZONTAL_VIEWPORT_PROJ,
                fromViewUid: 'details',
                height: 48,
                options: {
                  projectionFillColor: '#cc0078',
                  projectionStrokeColor: '#cc0078',
                  projectionFillOpacity: 0.3,
                  projectionStrokeOpacity: 0.3,
                  strokeWidth: 1,
                },
              },
            ],
          },
          {
            type: TrackType.COMBINED,
            uid: 'variants',
            height: 32,
            contents: [DEFAULT_VARIANT_TRACK_DEF],
          },
          {
            type: TrackType.COMBINED,
            uid: CombinedTrackUid.ARCS_AND_BARS,
            height: 72,
            contents: [
              DEFAULT_ENHANCER_GENE_ARC_TRACK,
              DEFAULT_ENHANCER_GENE_STACKED_BAR_TRACK,
            ],
          },
          {
            type: TrackType.STRATIFIED_BED,
            // server: 'http://localhost:9876/api/v1',
            // tilesetUid: 'AllPredictionsAvgHiCABC0015minus150ForABCPaperV2hg19beddb',
            // tilesetUid:
            //   'AllPredictionsAvgHiCABC0015minus150ForABCPaperV3txtsimplifiedgzhg19beddb',
            server: 'https://resgen.io/api/v1',
            // tilesetUid: 'P0Ng5fhvQWeO7dlpx0FknA', // all chroms
            // tilesetUid: 'PGXLE50tQyOayNXKUnX4fQ', // just chr10
            // tilesetUid: 'AaJojHeORzKyiag1pSlAag', // bed
            tilesetUid: EG_TILE_UID,
            height: 413,
            uid: 'indicatorByCellTypes',
            options: {
              axisAlign: 'right',
              legendAlign: 'left',
              labelPosition: 'hidden',
              markColor: 'black',
              markColorHighlight: '#bf0071',
              markColorDehighlight: '#bbbbbb',
              markSize: 4,
              markMinWidth: 4,
              markHeight: 3,
              rowHeight: 3,
              markOpacity: 0.33,
              arcStyle: 'indicator',
              indicatorStyle: 'category-rect',
              labelColor: 'black',
              geneField: GENE_NAME_COLUMN,
              importanceField: ABC_SCORE_COLUMN,
              importanceDomain: [0, 1],
              // focusRegion: [
              //   1680373143 + 81046453 - 25,
              //   1680373143 + 81046453 + 25,
              // ],
              name: 'By Celltype',
              axisPositionHorizontal: 'right',
              stratification: DEFAULT_STRATIFICATION,
              showMousePosition: true,
              showGlobalMousePosition: true,
              mousePositionColor: 'black',
            },
          },
        ],
      },
      overlays: [
        {
          uid: 'region-focus',
          includes: [
            'genes-tss-viewport',
            'variants',
            'arcs-stacked-bars',
            'indicatorByCellTypes',
          ],
          options: {
            extent: [[1680373143 + 81046453, 1680373143 + 81046454]],
            minWidth: 3,
            fill: '#cc0078',
            fillOpacity: 0.05,
            strokeWidth: 0,
            outline: '#cc0078',
            outlineOpacity: 0.33,
            outlineWidth: 1,
            outlinePos: ['left', 'right'],
          },
        },
        {
          uid: 'gene-focus',
          includes: ['genes-tss-viewport'],
          options: {
            extent: [],
            minWidth: 3,
            fill: '#cc0078',
            fillOpacity: 0.25,
            stroke: '#cc0078',
            strokeWidth: 0,
            outlineWidth: 0,
          },
        },
        {
          uid: 'tss-overlays',
          includes: [
            'chroms',
            'genes-tss-viewport',
            'variants',
            'arcs-stacked-bars',
            'indicatorByCellTypes',
          ],
          options: {
            extent: [],
            minWidth: 1,
            fill: 'black',
            fillOpacity: 0.05,
            strokeWidth: 0,
            outline: 'black',
            outlineOpacity: 0.1,
            outlineWidth: 1,
            outlinePos: ['left'],
          },
        },
      ],
      metaTracks: [
        {
          uid: 'tss-overlays-meta',
          type: 'annotation-overlay',
          overlaysTrack: 'tss-overlays',
          options: {
            annotationTracks: ['tss'],
          },
        },
      ],
      layout: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
      },
      initialXDomain: [DEFAULT_X_DOMAIN_START, DEFAULT_X_DOMAIN_END],
      initialYDomain: [DEFAULT_X_DOMAIN_START, DEFAULT_X_DOMAIN_END],
    },
  ],
};

export const updateViewConfigEnhancerRegionTracks = (
  trackConfig: EnhancerGeneTrackInfo
) => (viewConfig: ViewConfig) => {
  const combinedTrack = getTrackByUid(
    viewConfig,
    CombinedTrackUid.ARCS_AND_BARS
  );
  if (combinedTrack.type === TrackType.COMBINED) {
    const { contents } = combinedTrack;
    const updatedTrack = getUpdatedEnhancerGeneTrack(trackConfig);
    replaceTrackByType(contents, TrackType.ARCS_1D, updatedTrack);
  }
  return viewConfig;
};

export function getUpdatedEnhancerGeneTrack(
  trackConfig: EnhancerGeneTrackInfo
) {
  const enhancerGeneArcTrack = deepClone(DEFAULT_ENHANCER_GENE_ARC_TRACK);
  enhancerGeneArcTrack.server = trackConfig.server;
  enhancerGeneArcTrack.tilesetUid = trackConfig.tilesetUid;
  enhancerGeneArcTrack.uid = `arcs-${trackConfig.tilesetUid}`;
  enhancerGeneArcTrack.options.startField = trackConfig.enhancerStartField;
  enhancerGeneArcTrack.options.endField = trackConfig.tssStartField;
  return enhancerGeneArcTrack;
}

export function getTrackByUid(viewConfig: ViewConfig, uid: string): Track {
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
  const trackCandidate = topTracksFlattened.find((track) => track.uid === uid);
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
