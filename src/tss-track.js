import createPubSub from 'pub-sub-es';

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
    }

    drawPoly(tile, xStartPos, xEndPos, rectY, doubleRadius = false) {
      // prettier-ignore
      const drawnPoly = [
        // left top
        xStartPos, rectY,
        // right top
        xEndPos, rectY,
        // right bottom
        xEndPos, this.dimensions[1],
         // left bottom
        xStartPos, this.dimensions[1]
      ];

      const anchorRadius = 1;
      const radius = 2;

      tile.rectGraphics.drawCircle(
        xStartPos,
        this.finalDotYPos(rectY, anchorRadius),
        radius
      );

      return drawnPoly;
    }

    renderRows(tile, rows, maxRows, startY, endY, fill) {
      const zoomLevel = +tile.tileId.split('.')[0];

      this.initialize();

      const focusRegion = this.options.focusRegion || [Infinity, Infinity];

      const circleDraws = [];
      const circleFocusDraws = [];

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
            };

            if (txStart <= focusRegion[1] && txEnd >= focusRegion[0]) {
              circleFocusDraws.push(circleDraw);
            } else {
              circleDraws.push(circleDraw);
            }
          }
        }

        circleDraws.forEach((circleDraw) => {
          this.publish('annotationDrawn', circleDraw);
        });
      }
    }

    rerender() {
      // Monkey patch because TiledPixiTrack doesn't always fire correctly
      this.draw();
      this.pubSub.publish('TiledPixiTrack.tilesDrawnEnd', { uuid: this.uuid });
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
