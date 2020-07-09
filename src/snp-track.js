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

const createSnpTrack = (HGC, ...args) => {
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

    drawPoly(tile, xStartPos, xEndPos, rectY) {
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

      // if (this.valueScale) {
      //   tile.tileData.forEach((td) => {
      //     const v = +td.fields[+this.options.valueColumn - 1];
      //     const y = this.valueScale(v);
      //   });
      // }

      const radius = Math.max(2, xEndPos - xStartPos);

      // tile.rectGraphics.drawPolygon(drawnPoly);
      tile.rectGraphics.drawCircle(
        xStartPos,
        Math.max(radius, Math.min(this.dimensions[1] - radius, rectY)),
        radius
      );

      return drawnPoly;
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

      [base, track] = super.superSVG();

      base.setAttribute('class', 'exported-arcs-track');
      const output = document.createElement('g');

      track.appendChild(output);
      output.setAttribute(
        'transform',
        `translate(${this.position[0]},${this.position[1]})`
      );

      const strokeColor = this.options.strokeColor
        ? this.options.strokeColor
        : 'blue';
      const strokeWidth = this.options.strokeWidth
        ? this.options.strokeWidth
        : 2;

      this.visibleAndFetchedTiles().forEach((tile) => {
        this.polys = [];

        // call drawTile with storePolyStr = true so that
        // we record path strings to use in the SVG
        this.drawTile(tile, true);

        for (const { polyStr, opacity } of this.polys) {
          const g = document.createElement('path');
          g.setAttribute('fill', 'transparent');
          g.setAttribute('stroke', strokeColor);
          g.setAttribute('stroke-width', strokeWidth);
          g.setAttribute('opacity', opacity);

          g.setAttribute('d', polyStr);
          output.appendChild(g);
        }
      });
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
