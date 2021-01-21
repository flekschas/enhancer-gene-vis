import createPubSub from 'pub-sub-es';
import { sortedIndex } from 'lodash-es';

function createTssTrack(HGC, ...args) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"'
    );
  }

  class TssTrack extends HGC.tracks.BedLikeTrack {
    constructor(context, options) {
      super(context, options);

      const { publish, subscribe, unsubscribe } = createPubSub();
      this.publish = publish;
      this.subscribe = subscribe;
      this.unsubscribe = unsubscribe;

      this.collectAnnotationsBound = this.collectAnnotations.bind(this);

      this.updateOptions();
    }

    updateOptions() {
      this.options.maxPerTile = this.options.maxPerTile || 50;
    }

    drawPoly() {}

    renderRows() {}

    collectAnnotations(tile) {
      const zoomLevel = +tile.tileId.split('.')[0];

      this.initialize();

      const focusRegion = this.options.focusRegion || [Infinity, Infinity];

      const annotations = [];

      const rows = [
        ...(tile.plusStrandRows || []),
        ...(tile.minusStrandRows || []),
      ];

      const sortedIdxs = [];
      const sortedValues = [];

      for (let j = 0; j < rows.length; j++) {
        for (let i = 0; i < rows[j].length; i++) {
          const td = rows[j][i].value;
          const geneInfo = td.fields;

          // the returned positions are chromosome-based and they need to
          // be converted to genome-based
          const chrOffset = +td.chrOffset;
          const txStart = +geneInfo[1] + chrOffset;
          const txEnd = +geneInfo[2] + chrOffset;

          const xStartPos = this._xScale(txStart);
          const xEndPos = this._xScale(txEnd);

          // don't draw anything that has already been drawn
          if (
            !(
              zoomLevel in this.drawnRects &&
              td.uid in this.drawnRects[zoomLevel]
            )
          ) {
            if (!this.drawnRects[zoomLevel]) this.drawnRects[zoomLevel] = {};

            const circleDraw = {
              xStartScreen: xStartPos,
              xEndScreen: xEndPos,
              xStartAbs: txStart,
              xEndAbs: txEnd,
              data: td,
              isFocused: txStart <= focusRegion[1] && txEnd >= focusRegion[0],
            };

            const idx = sortedIndex(sortedValues, td.importance);
            sortedValues.splice(idx, 0, td.importance);
            sortedIdxs.splice(idx, 0, annotations.push(circleDraw) - 1);
          }
        }
      }

      if (annotations.length <= this.options.maxPerTile) return annotations;

      return sortedIdxs
        .slice(0, this.options.maxPerTile)
        .map((idx) => annotations[idx]);
    }

    rerender() {
      this.updateOptions();
      this.updateExistingGraphics();
    }

    updateExistingGraphics() {
      super.updateExistingGraphics();
      const annotations = Object.values(this.visibleAndFetchedTiles())
        .map(this.collectAnnotationsBound)
        .reduce(
          (allAnnotations, tileAnnotations) =>
            allAnnotations.concat(tileAnnotations),
          []
        );
      this.publish('tilesDrawn', { uuid: this.uuid, annotations });
    }

    getMouseOverHtml() {
      return '';
    }
  }

  return new TssTrack(...args);
}

createTssTrack.config = {
  type: 'tss',
  datatype: ['bedlike'],
};

export default createTssTrack;
