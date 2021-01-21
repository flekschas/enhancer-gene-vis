function createAnnotationOverlayMetaTrack(HGC, ...args) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"'
    );
  }

  // Services
  const { pubSub } = HGC.services;

  class AnnotationOverlayMetaTrack {
    constructor(context, options) {
      const { definition, getTrackObject, onNewTilesLoaded: animate } = context;

      this.animate = animate;
      this.options = options;

      this.overlaysTrack = getTrackObject(definition.overlaysTrack);

      if (!this.overlaysTrack) {
        console.warn(
          `Overlays track (uid: ${definition.overlaysTrack}) not found`
        );
        return;
      }

      this.annotationTrackIds = new Set();
      this.annotationTracks = definition.options.annotationTracks
        .map((uid) => {
          const track = getTrackObject(uid);

          if (!track) {
            console.warn(`Child track (uid: ${uid}) not found`);
          } else {
            this.annotationTrackIds.add(track.uuid);
          }

          return track;
        })
        .filter((track) => track);

      this.tilesDrawnEndHandlerBound = this.tilesDrawnEndHandler.bind(this);

      this.drawnAnnotations = new Map();
      this.tracksDrawingTiles = new Set();

      this.pubSubs = [];

      // Augment annotation tracks
      this.annotationTracks.forEach((track) => {
        track.subscribe('tilesDrawn', this.tilesDrawnEndHandlerBound);
      });
    }

    /**
     * Remove this track.
     */
    remove() {
      this.pubSubs.forEach(pubSub.unsubscribe);
      this.pubSubs = undefined;
      this.annotationTracks.forEach((track) => {
        track.unsubscribe('tileDrawn', this.annotationsDrawnHandlerBound);
      });
    }

    tilesDrawnEndHandler({ uuid, annotations = [] }) {
      if (!this.annotationTrackIds.has(uuid)) return;

      this.tracksDrawingTiles.add(uuid);

      annotations.forEach(({ xStartAbs, xEndAbs, data }) => {
        this.drawnAnnotations.set(data.uid, [xStartAbs, xEndAbs]);
      });

      if (!(this.tracksDrawingTiles.size % this.annotationTracks.length)) {
        this.updateOverlays();
      }
    }

    updateOverlays() {
      this.overlaysTrack.options.extent = Array.from(
        this.drawnAnnotations.values()
      );
      this.overlaysTrack.draw();
      this.tracksDrawingTiles.clear();
      this.drawnAnnotations.clear();
    }
  }

  return new AnnotationOverlayMetaTrack(...args);
}

createAnnotationOverlayMetaTrack.config = {
  type: 'annotation-overlay',
  availableOptions: ['annotationTracks'],
  defaultOptions: {
    annotationTracks: [],
  },
};

export default createAnnotationOverlayMetaTrack;
