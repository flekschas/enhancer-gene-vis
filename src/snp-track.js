const MAX_RADIUS = 2;
const MAX_RADIUS_EXTENSION = 2;

// const VS = `
//   attribute vec2 aPosition;

//   uniform mat3 projectionMatrix;
//   uniform mat3 translationMatrix;
//   uniform float uPointSize;
//   uniform vec4 uColor;

//   varying vec4 vColor;

//   void main(void)
//   {
//     vColor = uColor;
//     gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
//     gl_PointSize = uPointSize;
//   }
// `;

// const FS_ROUND = `
//   #ifdef GL_OES_standard_derivatives
//   #extension GL_OES_standard_derivatives : enable
//   #endif

//   precision mediump float;

//   varying vec4 vColor;

//   void main() {
//     float r = 0.0, delta = 0.0, alpha = 1.0;
//     vec2 cxy = 2.0 * gl_PointCoord - 1.0;
//     r = dot(cxy, cxy);

//     #ifdef GL_OES_standard_derivatives
//       delta = fwidth(r);
//       alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
//     #endif

//     gl_FragColor = vec4(vColor.rgb, alpha * vColor.a);
//   }
// `;

// const FS_SQUARE = `
//   precision mediump float;
//   varying vec4 vColor;

//   void main() {
//     gl_FragColor = vec4(vColor.rgb, vColor.a);
//   }
// `;

// const DEFAULT_GROUP_COLORS = [
//   '#c17da5',
//   '#c76526',
//   '#dca237',
//   '#eee462',
//   '#469b76',
//   '#3170ad',
//   '#6fb2e4',
//   '#000000',
//   '#999999',
// ];

// const DEFAULT_GROUP_COLORS_DARK = [
//   '#a1688a',
//   '#a65420',
//   '#b7872e',
//   '#9f9841',
//   '#3a8162',
//   '#295d90',
//   '#4a7798',
//   '#000000',
//   '#666666',
// ];

// const DEFAULT_GROUP_COLORS_LIGHT = [
//   '#f5e9f0',
//   '#f6e5db',
//   '#f9f0de',
//   '#fcfbe5',
//   '#e0eee8',
//   '#dde7f1',
//   '#e7f2fb',
//   '#d5d5d5',
//   '#ffffff',
// ];

// const scaleScalableGraphics = (graphics, xScale, drawnAtScale) => {
//   const tileK =
//     (drawnAtScale.domain()[1] - drawnAtScale.domain()[0]) /
//     (xScale.domain()[1] - xScale.domain()[0]);
//   const newRange = xScale.domain().map(drawnAtScale);

//   const posOffset = newRange[0];
//   graphics.scale.x = tileK;
//   graphics.position.x = -posOffset * tileK;
// };

const createSnpTrack = function createSnpTrack(HGC, ...args) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"'
    );
  }

  const { range } = HGC.libraries.d3Array;
  const { scaleBand } = HGC.libraries.d3Scale;
  const { tileProxy } = HGC.services;
  const { colorToHex } = HGC.utils;

  class SnpTrack extends HGC.tracks.BedLikeTrack {
    setValueScale() {
      this.valueScale = null;
      if (this.options && this.options.valueColumn) {
        const min = this.options.colorEncodingRange
          ? +this.options.colorEncodingRange[0]
          : this.minVisibleValueInTiles(+this.options.valueColumn);
        const max = this.options.colorEncodingRange
          ? +this.options.colorEncodingRange[1]
          : this.maxVisibleValueInTiles(+this.options.valueColumn);

        if (this.options.valueColumn) {
          [this.valueScale] = this.makeValueScale(
            min,
            this.calculateMedianVisibleValue(+this.options.valueColumn),
            max,
            2
          );
        }
      }
    }

    finalDotYPos(y, r) {
      return Math.max(r, Math.min(this.dimensions[1] - r, y));
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

      const anchorRadius = Math.max(MAX_RADIUS, xEndPos - xStartPos);
      const radius = anchorRadius * (1 + MAX_RADIUS_EXTENSION * doubleRadius);

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

      const rowScale = scaleBand()
        .domain(range(maxRows))
        .range([startY, endY])
        .paddingInner(0);

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
          let yMiddle = rowScale(j) + rowScale.step() / 2;

          if (this.valueScale) {
            yMiddle = this.valueScale(+geneInfo[+this.options.valueColumn - 1]);
          }

          const rectY = yMiddle;
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

            const circleDraw = [xStartPos, xEndPos, rectY, td, txStart, txEnd];

            if (txStart <= focusRegion[1] && txEnd >= focusRegion[0]) {
              circleFocusDraws.push(circleDraw);
            } else {
              circleDraws.push(circleDraw);
            }
          }
        }

        // 1. draw white background to make clicking easier
        tile.rectGraphics.lineStyle(0);
        tile.rectGraphics.beginFill(0xffffff);
        circleDraws.forEach((circleDraw) => {
          this.drawPoly(
            tile,
            circleDraw[0],
            circleDraw[1],
            circleDraw[2],
            true
          );
        });

        // 2. Now draw the normal circles
        let color = this.options.markColor || 'black';
        let opacity = this.options.fillOpacity || 0.3;
        tile.rectGraphics.lineStyle(1, colorToHex(color), opacity);
        tile.rectGraphics.beginFill(colorToHex(color), opacity);
        circleDraws.forEach((circleDraw) => {
          const drawnPoly = this.drawPoly(
            tile,
            circleDraw[0],
            circleDraw[1],
            circleDraw[2]
          );
          this.drawnRects[zoomLevel][circleDraw[4].uid] = [
            drawnPoly,
            {
              start: circleDraw[4],
              end: circleDraw[5],
              value: circleDraw[3],
              tile,
              fill,
            },
            tile.tileId,
          ];
        });

        // 2. Now draw the focused circles
        color = this.options.markColorFocus || 'red';
        opacity = this.options.markOpacityFocus || 0.6;
        tile.rectGraphics.lineStyle(1, colorToHex(color), opacity);
        tile.rectGraphics.beginFill(colorToHex(color), opacity);
        circleFocusDraws.forEach((circleDraw) => {
          const drawnPoly = this.drawPoly(
            tile,
            circleDraw[0],
            circleDraw[1],
            circleDraw[2]
          );
          this.drawnRects[zoomLevel][circleDraw[4].uid] = [
            drawnPoly,
            {
              start: circleDraw[4],
              end: circleDraw[5],
              value: circleDraw[3],
              tile,
              fill,
            },
            tile.tileId,
          ];
        });
        tile.rectGraphics.endFill();
      }

      tile.rectGraphics.interactive = true;
      tile.rectGraphics.buttonMode = true;
      tile.rectGraphics.mouseup = (event) => {
        if (this.hoveringSnp) {
          this.pubSub.publish('app.click', {
            type: 'snp',
            event,
            payload: this.hoveringSnp,
          });
        }
      };

      return [circleDraws, circleFocusDraws];
    }

    /**
     * Shows value and type for each bar
     *
     * @param trackX relative x-coordinate of mouse
     * @param trackY relative y-coordinate of mouse
     * @returns string with embedded values and svg square for color
     */
    getMouseOverHtml(trackX, trackY) {
      this.hoveringSnp = undefined;

      if (!this.tilesetInfo || !this.options.toolTip || !this.valueScale)
        return '';

      const zoomLevel = this.calculateZoomLevel();
      const tileWidth = tileProxy.calculateTileWidth(
        this.tilesetInfo,
        zoomLevel,
        this.tilesetInfo.tile_size
      );

      // the position of the tile containing the query position
      const genomePos = this._xScale.invert(trackX);
      const relTilePos = genomePos / tileWidth;
      const tilePos = Math.floor(relTilePos);
      const tileId = this.tileToLocalId([zoomLevel, tilePos]);
      const fetchedTile = this.fetchedTiles[tileId];

      if (!fetchedTile) return '';

      let minDist = 3;
      fetchedTile.tileData.forEach((item) => {
        const dist = Math.abs(this._xScale(item.xStart) - trackX);
        if (dist < minDist) {
          this.hoveringSnp = item;
          minDist = dist;
        }
      });

      if (!this.hoveringSnp) return '';

      const itemY = this.finalDotYPos(
        this.valueScale(this.hoveringSnp.importance),
        2
      );

      if (
        Math.abs(itemY - (trackY - 1)) >
        MAX_RADIUS * (MAX_RADIUS_EXTENSION + 1)
      )
        return '';

      const name = this.hoveringSnp.fields[this.options.toolTip.name.field];
      const value = (+this.hoveringSnp.fields[
        this.options.toolTip.value.field
      ]).toFixed(this.options.toolTip.value.numDecimals || 2);
      let otherStr = '';

      if (this.options.toolTip.other) {
        this.options.toolTip.other.forEach((other) => {
          const label = other.label || '';
          const v = (+this.hoveringSnp.fields[other.field]).toFixed(
            other.numDecimals || 2
          );
          otherStr += `${label}: ${v};`;
        });
        otherStr = ` (${otherStr.substr(0, otherStr.length - 1)})`;
      }

      return `<div><strong>${name}:</strong> ${value}${otherStr}</div>`;
    }

    /**
     * Export an SVG representation of this track
     *
     * @returns {Array} The two returned DOM nodes are both SVG
     * elements [base,track]. Base is a parent which contains track as a
     * child. Track is clipped with a clipping rectangle contained in base.
     *
     */
    exportSVG() {
      let track = null;
      let base = null;

      [base, track] = super.exportSVG();

      base.setAttribute('class', 'exported-snp-track');
      const output = document.createElement('g');

      track.appendChild(output);
      output.setAttribute(
        'transform',
        `translate(${this.position[0]},${this.position[1]})`
      );

      this.visibleAndFetchedTiles()
        .filter((tile) => tile.plusStrandRows)
        .forEach((tile) => {
          // call drawTile with storePolyStr = true so that
          // we record path strings to use in the SVG
          const [circles, focusedCircles] = this.renderRows(
            tile,
            tile.plusStrandRows,
            tile.plusStrandRows.length,
            0,
            this.dimensions[1],
            'blue'
          );

          circles.forEach((circle) => {
            const c = document.createElement('circle');
            c.setAttribute('fill', this.options.markColor || 'black');
            c.setAttribute('stroke-width', 0);
            c.setAttribute('opacity', this.options.markOpacity || 0.33);
            c.setAttribute('r', this.options.markSize);
            c.setAttribute('cx', circle[0]);
            c.setAttribute('cy', circle[2]);
            output.appendChild(c);
          });

          focusedCircles.forEach((circle) => {
            const c = document.createElement('circle');
            c.setAttribute('fill', this.options.markColorFocus || 'red');
            c.setAttribute('stroke-width', 0);
            c.setAttribute('opacity', this.options.markOpacityFocus || 0.66);
            c.setAttribute('r', this.options.markSize + 1);
            c.setAttribute('cx', circle[0]);
            c.setAttribute('cy', circle[2]);
            output.appendChild(c);
          });
        });

      const gAxis = document.createElement('g');
      gAxis.setAttribute('id', 'axis');

      // append the axis to base so that it's not clipped
      base.appendChild(gAxis);
      gAxis.setAttribute(
        'transform',
        `translate(${this.axis.pAxis.position.x}, ${this.axis.pAxis.position.y})`
      );

      if (
        this.options.axisPositionHorizontal === 'left' ||
        this.options.axisPositionVertical === 'top'
      ) {
        const gDrawnAxis = this.axis.exportAxisLeftSVG(
          this.valueScale,
          this.dimensions[1]
        );
        gAxis.appendChild(gDrawnAxis);
      } else if (
        this.options.axisPositionHorizontal === 'right' ||
        this.options.axisPositionVertical === 'bottom'
      ) {
        const gDrawnAxis = this.axis.exportAxisRightSVG(
          this.valueScale,
          this.dimensions[1]
        );
        gAxis.appendChild(gDrawnAxis);
      }

      return [base, track];
    }
  }

  return new SnpTrack(...args);
};

const icon =
  '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="1.5"><path d="M4 2.1L.5 3.5v12l5-2 5 2 5-2v-12l-5 2-3.17-1.268" fill="none" stroke="currentColor"/><path d="M10.5 3.5v12" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-dasharray="1,2,0,0"/><path d="M5.5 13.5V6" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-width=".9969299999999999" stroke-dasharray="1.71,3.43,0,0"/><path d="M9.03 5l.053.003.054.006.054.008.054.012.052.015.052.017.05.02.05.024 4 2 .048.026.048.03.046.03.044.034.042.037.04.04.037.04.036.042.032.045.03.047.028.048.025.05.022.05.02.053.016.053.014.055.01.055.007.055.005.055v.056l-.002.056-.005.055-.008.055-.01.055-.015.054-.017.054-.02.052-.023.05-.026.05-.028.048-.03.046-.035.044-.035.043-.038.04-4 4-.04.037-.04.036-.044.032-.045.03-.046.03-.048.024-.05.023-.05.02-.052.016-.052.015-.053.012-.054.01-.054.005-.055.003H8.97l-.053-.003-.054-.006-.054-.008-.054-.012-.052-.015-.052-.017-.05-.02-.05-.024-4-2-.048-.026-.048-.03-.046-.03-.044-.034-.042-.037-.04-.04-.037-.04-.036-.042-.032-.045-.03-.047-.028-.048-.025-.05-.022-.05-.02-.053-.016-.053-.014-.055-.01-.055-.007-.055L4 10.05v-.056l.002-.056.005-.055.008-.055.01-.055.015-.054.017-.054.02-.052.023-.05.026-.05.028-.048.03-.046.035-.044.035-.043.038-.04 4-4 .04-.037.04-.036.044-.032.045-.03.046-.03.048-.024.05-.023.05-.02.052-.016.052-.015.053-.012.054-.01.054-.005L8.976 5h.054zM5 10l4 2 4-4-4-2-4 4z" fill="currentColor"/><path d="M7.124 0C7.884 0 8.5.616 8.5 1.376v3.748c0 .76-.616 1.376-1.376 1.376H3.876c-.76 0-1.376-.616-1.376-1.376V1.376C2.5.616 3.116 0 3.876 0h3.248zm.56 5.295L5.965 1H5.05L3.375 5.295h.92l.354-.976h1.716l.375.975h.945zm-1.596-1.7l-.592-1.593-.58 1.594h1.172z" fill="currentColor"/></svg>';

createSnpTrack.config = {
  type: 'point-annotation',
  datatype: ['arcs', 'bedlike'],
  orientation: '1d',
  name: 'Arcs1D',
  thumbnail: new DOMParser().parseFromString(icon, 'text/xml').documentElement,
  availableOptions: [
    'arcStyle',
    'flip1D',
    'labelPosition',
    'labelColor',
    'labelTextOpacity',
    'labelBackgroundOpacity',
    'strokeColor',
    'strokeWidth',
    'trackBorderWidth',
    'trackBorderColor',
  ],
  defaultOptions: {
    arcStyle: 'ellipse',
    flip1D: 'no',
    labelColor: 'black',
    labelPosition: 'hidden',
    strokeColor: 'black',
    strokeWidth: 1,
    trackBorderWidth: 0,
    trackBorderColor: 'black',
  },
  optionsInfo: {
    arcStyle: {
      name: 'Arc Style',
      inlineOptions: {
        circle: {
          name: 'Circle',
          value: 'circle',
        },
        ellipse: {
          name: 'Ellipse',
          value: 'ellipse',
        },
      },
    },
  },
};

export default createSnpTrack;
