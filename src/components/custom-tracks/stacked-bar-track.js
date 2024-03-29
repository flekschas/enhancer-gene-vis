import {
  DEFAULT_COLOR_MAP,
  DEFAULT_COLOR_MAP_DARK,
  DEFAULT_COLOR_MAP_LIGHT,
} from '../../constants';
import { createColorTexture } from '../../utils';

const DEFAULT_TILE_SIZE = 1024;

const DEFAULT_BIN_SIZE = 8; // 8 "tile-pixels" make up one bin by default

const VS = `
precision mediump float;
attribute vec2 aPosition;
attribute float aColorIdx;
attribute float aFocused;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform sampler2D uColorMapTex;
uniform float uColorMapTexRes;
uniform sampler2D uColorMapFocusTex;
uniform float uColorMapFocusTexRes;

varying vec4 vColor;
varying vec4 vColorFocused;
varying float vFocused;

void main(void)
{
  // Half a texel (i.e., pixel in texture coordinates)
  float eps = 0.5 / uColorMapTexRes;
  float colorRowIndex = floor((aColorIdx + eps) / uColorMapTexRes);
  vec2 colorTexIndex = vec2(
    (aColorIdx / uColorMapTexRes) - colorRowIndex + eps,
    (colorRowIndex / uColorMapTexRes) + eps
  );
  vColor = texture2D(uColorMapTex, colorTexIndex);

  float eps2 = 0.5 / uColorMapFocusTexRes;
  float colorRowIndex2 = floor((aColorIdx + eps2) / uColorMapFocusTexRes);
  vec2 colorTexIndex2 = vec2(
    (aColorIdx / uColorMapFocusTexRes) - colorRowIndex2 + eps2,
    (colorRowIndex2 / uColorMapFocusTexRes) + eps2
  );
  vColorFocused = texture2D(uColorMapFocusTex, colorTexIndex2);

  vFocused = aFocused;

  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
}
`;

const FS = `
  precision mediump float;

  varying vec4 vColor;
  varying vec4 vColorFocused;
  varying float vFocused;

  void main() {
    float isNotFocused = 1.0 - vFocused;

    float r = vColor.r * isNotFocused + vColorFocused.r * vFocused;
    float g = vColor.g * isNotFocused + vColorFocused.g * vFocused;
    float b = vColor.b * isNotFocused + vColorFocused.b * vFocused;

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

const getHistMax = (fetchedTiles) =>
  fetchedTiles.reduce(
    (histMax, tile) => Math.max(histMax, tile.histogramMax),
    0
  );

const scaleScalableGraphics = (graphics, xScale, drawnAtScale) => {
  const tileK =
    (drawnAtScale.domain()[1] - drawnAtScale.domain()[0]) /
    (xScale.domain()[1] - xScale.domain()[0]);
  const newRange = xScale.domain().map(drawnAtScale);

  const posOffset = newRange[0];
  graphics.scale.x = tileK;
  graphics.position.x = -posOffset * tileK;
};

// prettier-ignore
const segmentToPosition = (segment) => [
  segment.xStart, segment.yStart,
  segment.xEnd, segment.yStart,
  segment.xEnd, segment.yEnd,
  segment.xStart, segment.yStart,
  segment.xStart, segment.yEnd,
  segment.xEnd, segment.yEnd,
];

const segmentToColorIdx = (segment) => [
  segment.colorIdx,
  segment.colorIdx,
  segment.colorIdx,
  segment.colorIdx,
  segment.colorIdx,
  segment.colorIdx,
];

const segmentToFocused = (segment) => [
  segment.focused,
  segment.focused,
  segment.focused,
  segment.focused,
  segment.focused,
  segment.focused,
];

const createStackedBarTrack = function createStackedBarTrack(HGC, ...args) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"'
    );
  }

  const { PIXI } = HGC.libraries;
  const { scaleLinear, scaleLog } = HGC.libraries.d3Scale;
  const { tileProxy } = HGC.services;
  const { colorToHex } = HGC.utils;

  const opacityLogScale = scaleLog()
    .domain([1, 10])
    .range([0.1, 1])
    .clamp(true);

  const toRgbNorm = (color) =>
    HGC.utils
      .colorToRgba(color)
      .slice(0, 3)
      .map((x) => Math.min(1, Math.max(0, x / 255)));

  class StackedBarTrack extends HGC.tracks.HorizontalLine1DPixiTrack {
    constructor(context, options) {
      super(context, options);

      this.updateOptions();

      this.pLoading = new PIXI.Graphics();
      this.pLoading.position.x = 0;
      this.pLoading.position.y = 0;
      this.pMasked.addChild(this.pLoading);

      this.loadIndicator = new PIXI.Text('Loading data...', {
        fontSize: this.labelSize || 10,
        fill: 0x808080,
      });
      this.pLoading.addChild(this.loadIndicator);
    }

    initTile(tile) {
      tile.histogramMax = 0;
      this.updateTileFocusMap(tile);
    }

    updateTileHistogram(tile) {
      const { tileX, tileWidth } = this.getTilePosAndDimensions(
        tile.tileData.zoomLevel,
        tile.tileData.tilePos
      );
      const binSize = tileWidth / this.numBins;

      tile.binXPos = new Float32Array(this.numBins + 1);
      tile.histogram1d = new Float32Array(this.numBins);
      tile.histogram2d = new Float32Array(this.numBins * this.numGroups);
      tile.histogram2dNumPred = new Uint8Array(this.numBins * this.numGroups);

      let max = 0;

      // Determine bin boundaries
      for (let i = 0; i <= this.numBins; i++) {
        tile.binXPos[i] = tileX + binSize * i;
      }

      const categoryBinHash = new Map();
      const maxBinId = this.numBins - 1;

      tile.tileData.filter(this.itemFilter).forEach((item) => {
        const group = this.categoryToGroup.get(
          item.fields[this.categoryField].toLowerCase()
        );
        const binStart = Math.max(
          0,
          Math.min(
            maxBinId,
            Math.round((this.getStart(item) - tileX) / binSize)
          )
        );
        const binEnd = Math.max(
          0,
          Math.min(maxBinId, Math.round((this.getEnd(item) - tileX) / binSize))
        );
        const numBins = Math.abs(binEnd - binStart);
        const score = this.getImportance(item);
        const category = this.getCategory(item);
        const base = group * this.numBins;

        for (let i = 0; i <= numBins; i++) {
          const bin = binStart + i;
          const histIdx = base + bin;

          const binHash = categoryBinHash.get(category) || {};

          // Make sure we count multiple enhancer predictions of the same
          // biosample and bin only once (i.e., summing up)
          if (!binHash[bin]) {
            binHash[bin] = binHash[bin] || score > 0;
            tile.histogram2dNumPred[histIdx] += binHash[bin];
            categoryBinHash.set(category, binHash);
          }

          tile.histogram2d[histIdx] += score;
          tile.histogram1d[bin] += score;

          max = Math.max(max, tile.histogram1d[bin]);
        }
      });

      tile.histogramMax = max;
    }

    updateHistograms() {
      Object.values(this.fetchedTiles).forEach(
        this.updateTileHistogram.bind(this)
      );
    }

    updateTileFocusMap(tile) {
      tile.focusMap = new Float32Array(this.numBins);

      const { tileX, tileWidth } = this.getTilePosAndDimensions(
        tile.tileData.zoomLevel,
        tile.tileData.tilePos
      );

      if (
        tileX <= this.focusRegion[1] &&
        tileX + tileWidth >= this.focusRegion[0]
      ) {
        const binSize = tileWidth / this.numBins;

        const binStart = Math.max(
          0,
          Math.round((this.focusRegion[0] - tileX) / binSize)
        );
        const binEnd = Math.min(
          this.numBins - 1,
          Math.round((this.focusRegion[1] - tileX) / binSize)
        );
        const numBins = Math.abs(binEnd - binStart);

        for (let i = 0; i <= numBins; i++) {
          tile.focusMap[i] = 1;
        }
      }
    }

    updateFocusMap() {
      Object.values(this.fetchedTiles).forEach(
        this.updateTileFocusMap.bind(this)
      );
    }

    updateStratificationOption() {
      if (!this.options.stratification) {
        this.categoryField = undefined;
        this.categoryToGroup = undefined;
        this.groupToColor = undefined;
        this.numGroups = 0;
        this.numFilteredGroups = 0;
        this.numCategories = 0;
        this.groupLabels = [];
        return;
      }

      this.categoryField = this.options.stratification.categoryField;
      this.getCategory = (item) =>
        item.fields[this.categoryField].toLowerCase();
      this.categoryToGroup = new Map();
      this.categoryToY = new Map();
      this.groupToColor = new Map();

      this.groupSizes = this.options.stratification.groups.map(
        (group) =>
          group.categories.filter((category) => this.valueFilter(category))
            .length
      );
      this.filteredGroups = this.options.stratification.groups.filter(
        (group, i) => this.groupSizes[i] > 0
      );
      this.numGroups = this.options.stratification.groups.length;
      this.numFilteredGroups = this.filteredGroups.length;
      this.numCategories = this.groupSizes.reduce(
        (numCategories, groupSize) => numCategories + groupSize,
        0
      );
      this.groupLabels = this.options.stratification.groups.map(
        (group, i) => group.label || `Group ${i}`
      );

      let k = 0;
      this.options.stratification.groups.forEach((group, i) => {
        this.groupToColor.set(i, [
          colorToHex(
            group.color || DEFAULT_COLOR_MAP[i % DEFAULT_COLOR_MAP.length]
          ),
          colorToHex(
            group.backgroundColor ||
              DEFAULT_COLOR_MAP_LIGHT[i % DEFAULT_COLOR_MAP_LIGHT.length]
          ),
        ]);
        group.categories
          .filter((category) => this.valueFilter(category))
          .forEach((category, j) => {
            this.categoryToGroup.set(category.toLowerCase(), i);
            this.categoryToY.set(category.toLowerCase(), k + j);
          });
        k += this.groupSizes[i];
      });

      this.groupLabelsPixiText = this.groupLabels.map(
        (label, i) =>
          new PIXI.Text(label, {
            fontSize: this.labelSize,
            // fill: this.labelColor,
            align: this.axisAlign === 'right' ? 'right' : 'left',
            fill: colorToHex(
              this.options.stratification.groups[i].axisLabelColor ||
                DEFAULT_COLOR_MAP_DARK[i % DEFAULT_COLOR_MAP_DARK.length]
            ),
          })
      );
    }

    updateOptions() {
      this.axisAlign = this.options.axisAlign || 'left';

      this.labelColor = colorToHex(this.options.labelColor || 'black');

      this.labelSize = this.options.labelSize || 12;

      this.colorMap = this.options.colorMap || [...DEFAULT_COLOR_MAP];

      this.colorMapRgbNorm = this.colorMap.map(toRgbNorm);

      [this.colorMapTex, this.colorMapTexRes] = createColorTexture(
        PIXI,
        this.colorMapRgbNorm
      );

      this.colorMapFocus = this.options.colorMapFocus || [
        ...DEFAULT_COLOR_MAP_DARK,
      ];

      this.colorMapFocusRgbNorm = this.colorMapFocus.map(toRgbNorm);

      [this.colorMapFocusTex, this.colorMapFocusTexRes] = createColorTexture(
        PIXI,
        this.colorMapFocusRgbNorm
      );

      this.markColor = colorToHex(this.options.markColor || 'black');

      this.markColorRgbNorm = this.options.markColor
        ? toRgbNorm(this.options.markColor)
        : [0, 0, 0];

      this.markOpacity = Number.isNaN(+this.options.markOpacity)
        ? 1
        : Math.min(1, Math.max(0, +this.options.markOpacity));

      this.markSize = this.options.markSize || 2;

      this.markColorFocus = colorToHex(this.options.markColorFocus || 'red');

      this.markColorFocusRgbNorm = this.options.markColorFocus
        ? toRgbNorm(this.options.markColorFocus)
        : [1, 0, 0];

      this.markOpacityFocus = Number.isNaN(+this.options.markOpacityFocus)
        ? this.markOpacity
        : Math.min(1, Math.max(0, +this.options.markOpacityFocus));

      this.markSizeFocus = this.options.markSizeFocus || this.markSize;

      this.binSize = this.options.binSize || DEFAULT_BIN_SIZE;

      this.numBins = this.tilesetInfo
        ? Math.round(this.tilesetInfo.tile_size / this.binSize)
        : DEFAULT_TILE_SIZE / this.binSize;

      this.getOffset =
        !Number.isNaN(+this.options.offsetField) &&
        this.options.offsetField >= 0
          ? (item) => this.chromOffsets[item.fields[this.options.offsetField]]
          : () => 0;

      this.getStart =
        !Number.isNaN(+this.options.startField) && this.options.startField >= 0
          ? (item) =>
              this.getOffset(item) + +item.fields[this.options.startField]
          : (item) => item.xStart;

      this.getEnd =
        !Number.isNaN(+this.options.endField) && this.options.endField >= 0
          ? (item) => this.getOffset(item) + +item.fields[this.options.endField]
          : (item) => item.xEnd;

      this.getImportance = this.options.importanceField
        ? (item) => +item.fields[this.options.importanceField]
        : () => 1;

      const importanceDomain = this.options.importanceDomain || [1000, 1];

      this.filterSet =
        this.options.filter && this.options.filter.set
          ? this.options.filter.set.reduce((s, include) => {
              s.add(include);
              return s;
            }, new Set())
          : null;

      this.filterField = this.options.filter && this.options.filter.field;

      this.valueFilter = this.filterSet
        ? (value) => this.filterSet.has(value)
        : () => true;

      this.itemFilter =
        this.valueFilter && this.filterField
          ? (item) => this.valueFilter(item.fields[this.filterField])
          : () => true;

      const opacityLinearScale = scaleLinear()
        .domain(importanceDomain)
        .range([1, 10]);

      this.opacityScale = (x) => opacityLogScale(opacityLinearScale(x));

      this.focusRegion = this.options.focusRegion
        ? this.options.focusRegion
        : [Infinity, Infinity];

      this.focusGene = this.options.focusGene
        ? this.options.focusGene.toLowerCase()
        : undefined;

      this.minImportance = this.options.minImportance || 0;

      this.updateStratificationOption();

      this.updateFocusMap();
      this.updateHistograms();
      this.updateScales();
    }

    updateLoadIndicator() {
      const [left, top] = this.position;
      this.pLoading.position.x = left + 6;
      this.pLoading.position.y = top + 6;

      if (this.fetching.size) {
        this.pLoading.addChild(this.loadIndicator);
      } else {
        this.pLoading.removeChild(this.loadIndicator);
      }
    }

    computeChromOffets() {
      if (!this.tilesetInfo) return;
      let chroms;
      let chromSizes;
      if (this.tilesetInfo.chromsizes) {
        // New Resgen format
        chroms = this.tilesetInfo.chromsizes.map((size) => size[0]);
        chromSizes = this.tilesetInfo.chromsizes.map((size) => size[1]);
      } else {
        // Normal HiGlass format
        chroms = this.tilesetInfo.chrom_names.split('\t');
        chromSizes = this.tilesetInfo.chrom_sizes
          .split('\t')
          .map((size) => +size);
      }
      // eslint-disable-next-line prefer-destructuring
      this.chromOffsets = chroms.reduce(
        ([offsets, cumSum], chrom, i) => {
          offsets[chrom] = cumSum;
          return [offsets, cumSum + chromSizes[i]];
        },
        [{}, 0]
      )[0];
    }

    refreshTiles(...brgs) {
      super.refreshTiles(...brgs);
      this.computeChromOffets();
      this.updateLoadIndicator();
      if (this.tilesetInfo) {
        const oldNumBins = this.numBins;
        this.numBins = Math.round(this.tilesetInfo.tile_size / this.binSize);
        if (oldNumBins !== this.numBins) {
          this.updateHistograms();
          this.updateScales();
        }
      }
    }

    rerender(newOptions) {
      this.options = newOptions;
      this.updateOptions();
      this.updateExistingGraphics();
    }

    updateScales() {
      const fetchedTiles = Object.values(this.fetchedTiles);

      if (!fetchedTiles.length) return;

      const [, height] = this.dimensions;

      this.histMax = getHistMax(fetchedTiles);

      this.heightScale = scaleLinear()
        .domain([0, this.histMax])
        .range([height, 0]);

      this.valueScale = this.heightScale;

      this.valueScaleInverted = scaleLinear()
        .domain([0, this.histMax])
        .range([0, height]);
    }

    histToSegments(tile) {
      const segments = [];

      for (let i = 0; i < this.numBins; i++) {
        let cumHeight = 0;
        if (tile.histogram1d[i] > 0) {
          for (let j = 0; j < this.numGroups; j++) {
            const height = tile.histogram2d[j * this.numBins + i];

            if (height) {
              segments.push({
                xStart: this._xScale(tile.binXPos[i]),
                xEnd: this._xScale(tile.binXPos[i + 1]),
                yStart: this.heightScale(cumHeight),
                yEnd: this.heightScale(cumHeight + height),
                colorIdx: j % this.colorMap.length,
                focused: tile.focusMap[i],
              });

              cumHeight += height;
            }
          }
        }
      }

      return segments;
    }

    renderStackedBars() {
      this.drawnAtScale = scaleLinear()
        .domain([...this.xScale().domain()])
        .range([...this.xScale().range()]);

      const segments = Object.values(this.fetchedTiles).flatMap(
        this.histToSegments.bind(this)
      );

      const positions = new Float32Array(segments.flatMap(segmentToPosition));
      const colorIdxs = new Float32Array(segments.flatMap(segmentToColorIdx));
      const focused = new Float32Array(segments.flatMap(segmentToFocused));

      const uniforms = new PIXI.UniformGroup({
        uColorMapTex: this.colorMapTex,
        uColorMapTexRes: this.colorMapTexRes,
        uColorMapFocus: this.colorMapFocusTex,
        uColorMapFocusTexRes: this.colorMapFocusTexRes,
      });

      const shader = PIXI.Shader.from(VS, FS, uniforms);

      const geometry = new PIXI.Geometry();
      geometry.addAttribute('aPosition', positions, 2);
      geometry.addAttribute('aColorIdx', colorIdxs, 1);
      geometry.addAttribute('aFocused', focused, 1);

      const mesh = new PIXI.Mesh(
        geometry,
        shader,
        new PIXI.State(),
        PIXI.DRAW_MODES.TRIANGLES
      );

      const newGraphics = new PIXI.Graphics();
      newGraphics.addChild(mesh);

      // eslint-disable-next-line
      this.pMain.x = this.position[0];

      if (this.indicatorPointGraphics) {
        this.pMain.removeChild(this.indicatorPointGraphics);
      }

      this.pMain.addChild(newGraphics);
      this.indicatorPointGraphics = newGraphics;

      scaleScalableGraphics(
        this.indicatorPointGraphics,
        this._xScale,
        this.drawnAtScale
      );

      this.draw();
      this.animate();
    }

    renderTrack() {
      this.drawAxis(this.valueScaleInverted);
      this.renderStackedBars();
    }

    hasFetchedTiles() {
      return Object.values(this.fetchedTiles).length;
    }

    // Called whenever a new tile comes in
    updateExistingGraphics() {
      this.updateLoadIndicator();
      if (!this.hasFetchedTiles()) return;
      this.updateHistograms();
      this.updateScales();
      this.renderTrack();
    }

    /**
     * Shows value and type for each bar
     *
     * @param trackX relative x-coordinate of mouse
     * @param trackY relative y-coordinate of mouse
     * @returns string with embedded values and svg square for color
     */
    getMouseOverHtml(trackX, trackY) {
      if (!this.tilesetInfo) return '';

      const zoomLevel = this.calculateZoomLevel();
      const tileWidth = tileProxy.calculateTileWidth(
        this.tilesetInfo,
        zoomLevel,
        this.tilesetInfo.tile_size
      );

      // the position of the tile containing the query position
      const relTilePos = this._xScale.invert(trackX) / tileWidth;
      const tilePos = Math.floor(relTilePos);
      const tileId = this.tileToLocalId([zoomLevel, tilePos]);
      const fetchedTile = this.fetchedTiles[tileId];

      if (!fetchedTile) return '';

      const relPos = relTilePos - tilePos;
      const binXPos = Math.floor(this.numBins * relPos);

      const rowCumSum = [];
      const rowNumPred = [];
      let totalPred = 0;
      let sum = 0;
      for (let i = 0; i < this.numGroups; i++) {
        sum += fetchedTile.histogram2d[i * this.numBins + binXPos];
        const numPred =
          fetchedTile.histogram2dNumPred[i * this.numBins + binXPos];
        rowNumPred.push(numPred);
        totalPred += numPred;
        rowCumSum.push(sum);
      }

      const relYPos = this.heightScale.invert(trackY);
      const group = rowCumSum.findIndex((cumHeight) => cumHeight > relYPos);

      if (group >= 0) {
        const [color, bg] = this.groupToColor.get(group);
        const colorHex = `#${color.toString(16)}`;
        const bgHex = `#${bg.toString(16)}`;
        const value =
          fetchedTile.histogram2dNumPred[group * this.numBins + binXPos];
        return `<div style="margin: -0.25rem; padding: 0 0.25rem; background: ${bgHex}"><strong style="color: ${colorHex};">${this.groupLabels[group]}:</strong> ${value} of ${totalPred} samples</div>`;
      }

      return '';
    }

    setPosition(newPosition) {
      super.setPosition(newPosition);

      [this.pMain.position.x, this.pMain.position.y] = this.position;
    }

    zoomed(newXScale, newYScale) {
      this.xScale(newXScale);
      this.yScale(newYScale);

      if (this.indicatorPointGraphics) {
        scaleScalableGraphics(
          this.indicatorPointGraphics,
          newXScale,
          this.drawnAtScale
        );
      }

      this.refreshTiles();
      this.draw();
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

      base.setAttribute('class', 'exported-stacked-bar-track');
      const output = document.createElement('g');

      track.appendChild(output);
      output.setAttribute(
        'transform',
        `translate(${this.position[0]},${this.position[1]})`
      );

      const segments = Object.values(this.fetchedTiles).flatMap(
        this.histToSegments.bind(this)
      );

      segments.forEach(({ xStart, xEnd, yStart, yEnd, colorIdx }) => {
        const r = document.createElement('rect');

        r.setAttribute('x', xEnd);
        r.setAttribute('y', yEnd);
        r.setAttribute('width', Math.abs(xEnd - xStart));
        r.setAttribute('height', Math.abs(yEnd - yStart));
        r.setAttribute('fill', this.colorMap[colorIdx]);
        r.setAttribute('stroke-width', 0);

        output.appendChild(r);
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

  return new StackedBarTrack(...args);
};

const icon =
  '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="1.5"><path d="M4 2.1L.5 3.5v12l5-2 5 2 5-2v-12l-5 2-3.17-1.268" fill="none" stroke="currentColor"/><path d="M10.5 3.5v12" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-dasharray="1,2,0,0"/><path d="M5.5 13.5V6" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-width=".9969299999999999" stroke-dasharray="1.71,3.43,0,0"/><path d="M9.03 5l.053.003.054.006.054.008.054.012.052.015.052.017.05.02.05.024 4 2 .048.026.048.03.046.03.044.034.042.037.04.04.037.04.036.042.032.045.03.047.028.048.025.05.022.05.02.053.016.053.014.055.01.055.007.055.005.055v.056l-.002.056-.005.055-.008.055-.01.055-.015.054-.017.054-.02.052-.023.05-.026.05-.028.048-.03.046-.035.044-.035.043-.038.04-4 4-.04.037-.04.036-.044.032-.045.03-.046.03-.048.024-.05.023-.05.02-.052.016-.052.015-.053.012-.054.01-.054.005-.055.003H8.97l-.053-.003-.054-.006-.054-.008-.054-.012-.052-.015-.052-.017-.05-.02-.05-.024-4-2-.048-.026-.048-.03-.046-.03-.044-.034-.042-.037-.04-.04-.037-.04-.036-.042-.032-.045-.03-.047-.028-.048-.025-.05-.022-.05-.02-.053-.016-.053-.014-.055-.01-.055-.007-.055L4 10.05v-.056l.002-.056.005-.055.008-.055.01-.055.015-.054.017-.054.02-.052.023-.05.026-.05.028-.048.03-.046.035-.044.035-.043.038-.04 4-4 .04-.037.04-.036.044-.032.045-.03.046-.03.048-.024.05-.023.05-.02.052-.016.052-.015.053-.012.054-.01.054-.005L8.976 5h.054zM5 10l4 2 4-4-4-2-4 4z" fill="currentColor"/><path d="M7.124 0C7.884 0 8.5.616 8.5 1.376v3.748c0 .76-.616 1.376-1.376 1.376H3.876c-.76 0-1.376-.616-1.376-1.376V1.376C2.5.616 3.116 0 3.876 0h3.248zm.56 5.295L5.965 1H5.05L3.375 5.295h.92l.354-.976h1.716l.375.975h.945zm-1.596-1.7l-.592-1.593-.58 1.594h1.172z" fill="currentColor"/></svg>';

createStackedBarTrack.config = {
  type: 'stacked-bar',
  datatype: ['bedlike'],
  orientation: '1d',
  name: 'Advanced Stacked Bars Track',
  thumbnail: new DOMParser().parseFromString(icon, 'text/xml').documentElement,
  availableOptions: [
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
    flip1D: 'no',
    labelColor: 'black',
    labelPosition: 'hidden',
    strokeColor: 'black',
    strokeWidth: 1,
    trackBorderWidth: 0,
    trackBorderColor: 'black',
  },
};

export default createStackedBarTrack;
