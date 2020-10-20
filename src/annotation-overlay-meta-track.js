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

      this.annotationDrawnHandlerBound = this.annotationDrawnHandler.bind(this);
      this.tilesDrawnEndHandlerBound = this.tilesDrawnEndHandler.bind(this);

      this.drawnAnnotations = new Map();
      this.tracksDrawingTiles = new Set();

      this.pubSubs = [];

      // Augment annotation tracks
      this.annotationTracks.forEach((track) => {
        track.subscribe('annotationDrawn', this.annotationDrawnHandlerBound);
        track.subscribe('tilesDrawn', this.tilesDrawnEndHandlerBound);
      });
    }

    /**
     * Handles annotation drawn events
     *
     * @param  {String}  event.uid  UID of the view that triggered the event.
     * @param  {Array}  event.viewPos  View position (i.e., [x, y, width, height])
     *   of the drawn annotation on the screen.
     * @param  {Array}  event.dataPos  Data position of the drawn annotation. For
     *   example base pairs (Hi-C), or pixels (gigapixel images), or lng-lat
     *   (geo json).
     */
    annotationDrawnHandler({ xStartAbs, xEndAbs, data }) {
      this.drawnAnnotations.set(data.uid, [xStartAbs, xEndAbs]);
    }

    /**
     * Remove this track.
     */
    remove() {
      this.pubSubs.forEach(pubSub.unsubscribe);
      this.pubSubs = undefined;
      this.annotationTracks.forEach((track) => {
        track.unsubscribe('annotationDrawn', this.annotationDrawnHandlerBound);
      });
    }

    tilesDrawnEndHandler({ uuid }) {
      if (!this.annotationTrackIds.has(uuid)) return;

      this.tracksDrawingTiles.add(uuid);

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
