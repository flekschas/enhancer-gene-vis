import {
  identity,
  maxNan,
  maxVector,
  meanNan,
  minNan,
  sumNan,
} from '@flekschas/utils';

const FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT;

const VS = `precision mediump float;

  attribute vec2 aPrevPosition;
  attribute vec2 aCurrPosition;
  attribute vec2 aNextPosition;
  attribute float aOffsetSign;
  attribute float aColorIndex;

  uniform sampler2D uAreaColorTex;
  uniform float uAreaColorTexRes;
  uniform mat3 projectionMatrix;
  uniform mat3 translationMatrix;

  uniform vec4 uLineColor;
  uniform vec4 uNaNColor;
  uniform float uWidth;
  uniform int uMiter;

  varying vec4 vColor;

  void main(void)
  {
    mat3 model = projectionMatrix * translationMatrix;

    if (aColorIndex <= -0.5) {
      // Render line
      vColor = vec4(uLineColor.rgb, 1.0);

      vec4 prevGlPos = vec4((model * vec3(aPrevPosition, 1.0)).xy, 0.0, 1.0);
      vec4 currGlPos = vec4((model * vec3(aCurrPosition, 1.0)).xy, 0.0, 1.0);
      vec4 nextGlPos = vec4((model * vec3(aNextPosition, 1.0)).xy, 0.0, 1.0);

      // Calculate the direction
      vec2 dir = vec2(0.0);

      if (currGlPos == prevGlPos) {
        // start point uses (next - current)
        dir = normalize(nextGlPos.xy - currGlPos.xy);
      }
      else if (currGlPos == nextGlPos) {
        // end point uses (current - previous)
        dir = normalize(currGlPos.xy - prevGlPos.xy);
      }
      else {
        // somewhere in middle, needs a join:
        // get directions from (C - B) and (B - A)
        vec2 dirA = normalize((currGlPos.xy - prevGlPos.xy));
        if (uMiter == 1) {
          vec2 dirB = normalize((nextGlPos.xy - currGlPos.xy));
          // now compute the miter join normal and length
          vec2 tangent = normalize(dirA + dirB);
          vec2 perp = vec2(-dirA.y, dirA.x);
          vec2 miter = vec2(-tangent.y, tangent.x);
          dir = tangent;
        } else {
          dir = dirA;
        }
      }

      float width = (projectionMatrix * vec3(uWidth, 0.0, 0.0)).x / 2.0;

      vec2 normal = vec2(-dir.y, dir.x) * width;
      // normal.x /= aspectRatio;
      vec4 offset = vec4(normal * aOffsetSign, 0.0, 0.0);
      gl_Position = currGlPos + offset;
    } else {
      // Render area
      float colorRowIndex = aColorIndex / uAreaColorTexRes;

      vec2 colorTexIndex = vec2(
        (aColorIndex / uAreaColorTexRes) - colorRowIndex,
        colorRowIndex / uAreaColorTexRes
      );
      vColor = texture2D(uAreaColorTex, colorTexIndex);

      gl_Position = vec4((model * vec3(aCurrPosition, 1.0)).xy, 0.0, 1.0);
    }
  }
`;

const FS = `precision mediump float;

  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`;

const TILE_SIZE = 256;

const COLORMAP_GRAYS = Array(127)
  .fill()
  .map((x, i) => {
    const gray = (1 - i / 127) * 0.5 + 0.5;
    return [gray, gray, gray, 1];
  });

const getMax = (fetchedTiles) =>
  Object.values(fetchedTiles).reduce(
    (maxValue, tile) => Math.max(maxValue, tile.tileData.maxNonZero),
    -Infinity
  );

const getNumRows = (fetchedTiles) =>
  Object.values(fetchedTiles)[0].tileData.coarseShape[0];

const getRowMaxs = (fetchedTiles) =>
  maxVector(
    Object.values(fetchedTiles).map((tile) => tile.tileData.maxValueByRow)
  );

const scaleGraphics = (graphics, xScale, drawnAtScale) => {
  const tileK =
    (drawnAtScale.domain()[1] - drawnAtScale.domain()[0]) /
    (xScale.domain()[1] - xScale.domain()[0]);
  const newRange = xScale.domain().map(drawnAtScale);

  const posOffset = newRange[0];
  graphics.scale.x = tileK;
  graphics.position.x = -posOffset * tileK;
};

const getNumPointsPerRow = (numRows, positions, markArea) =>
  positions.length / numRows / 4 / (1 + markArea) - 2;

const createRidgePlotTrack = function createRidgePlotTrack(HGC, ...args) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"'
    );
  }

  const { PIXI } = HGC.libraries;
  const { format } = HGC.libraries.d3Format;
  const { scaleLinear } = HGC.libraries.d3Scale;
  const { tileProxy } = HGC.services;

  const createColorTexture = (colors) => {
    const colorTexRes = Math.max(2, Math.ceil(Math.sqrt(colors.length)));
    const rgba = new Float32Array(colorTexRes ** 2 * 4);
    colors.forEach((color, i) => {
      // eslint-disable-next-line prefer-destructuring
      rgba[i * 4] = color[0]; // r
      // eslint-disable-next-line prefer-destructuring
      rgba[i * 4 + 1] = color[1]; // g
      // eslint-disable-next-line prefer-destructuring
      rgba[i * 4 + 2] = color[2]; // b
      // eslint-disable-next-line prefer-destructuring
      rgba[i * 4 + 3] = color[3]; // a
    });

    return [
      PIXI.Texture.fromBuffer(rgba, colorTexRes, colorTexRes),
      colorTexRes,
    ];
  };

  class RidgePlotTrack extends HGC.tracks.HorizontalLine1DPixiTrack {
    constructor(context, options) {
      super(context, options);
      this.updateOptions();
    }

    initTile(tile) {
      this.coarsifyTileValues(tile);
    }

    destroyTile() {}

    binsPerTile() {
      return this.tilesetInfo.bins_per_dimension || TILE_SIZE;
    }

    /**
     * From HeatmapTiledPixiTrack
     */
    getTilePosAndDimensions(zoomLevel, tilePos, binsPerTileIn) {
      const binsPerTile = binsPerTileIn || this.binsPerTile();

      if (this.tilesetInfo.resolutions) {
        const sortedResolutions = this.tilesetInfo.resolutions
          .map((x) => +x)
          .sort((a, b) => b - a);

        const chosenResolution = sortedResolutions[zoomLevel];

        const tileWidth = chosenResolution * binsPerTile;
        const tileHeight = tileWidth;

        const tileX = chosenResolution * binsPerTile * tilePos[0];
        const tileY = chosenResolution * binsPerTile * tilePos[1];

        return {
          tileX,
          tileY,
          tileWidth,
          tileHeight,
        };
      }

      const xTilePos = tilePos[0];
      const yTilePos = tilePos[1];

      const minX = this.tilesetInfo.min_pos[0];
      const minY = this.options.reverseYAxis
        ? -this.tilesetInfo.max_pos[1]
        : this.tilesetInfo.min_pos[1];

      const tileWidth = this.tilesetInfo.max_width / 2 ** zoomLevel;
      const tileHeight = this.tilesetInfo.max_width / 2 ** zoomLevel;

      const tileX = minX + xTilePos * tileWidth;
      const tileY = minY + yTilePos * tileHeight;

      return {
        tileX,
        tileY,
        tileWidth,
        tileHeight,
      };
    }

    updateOptions() {
      this.selectRowsAggregationMode =
        this.options.selectRowsAggregationMode || 'mean';

      switch (this.selectRowsAggregationMode) {
        case 'max':
          this.selectRowsAggregationFn = maxNan;
          break;

        case 'min':
          this.selectRowsAggregationFn = minNan;
          break;

        case 'sum':
          this.selectRowsAggregationFn = sumNan;
          break;

        case 'mean':
        default:
          this.selectRowsAggregationFn = meanNan;
          break;
      }

      this.markArea = !!this.options.markArea;

      this.markAreaColor = 'grays';

      this.markColor = HGC.utils.colorToHex(this.options.markColor || 'black');

      this.markColorRgbNorm = this.options.markColor
        ? HGC.utils
            .colorToRgba(this.options.markColor)
            .slice(0, 3)
            .map((x) => Math.min(1, Math.max(0, x / 255)))
        : [0, 0, 0];

      [this.markColorTex, this.markColorTexRes] = createColorTexture([
        ...COLORMAP_GRAYS,
      ]);

      this.markNumColors = COLORMAP_GRAYS.length;

      this.markOpacity = Number.isNaN(+this.options.markOpacity)
        ? 1
        : Math.min(1, Math.max(0, +this.options.markOpacity));

      this.markSize = this.options.markSize || 2;

      // Number of line segments
      const oldMarkResolution = this.markResolution;
      this.markResolution = Math.max(
        1,
        Math.min(TILE_SIZE, this.options.markResolution || TILE_SIZE / 4)
      );
      // Given 100 (rows) x 256 (tile size). At a resolution of 1 we need:
      // 100 x (256 / 4) x 4 = 25,600 vertices

      const oldRowHeight = this.rowHeight;
      this.rowHeight = Number.isNaN(+this.options.rowHeight)
        ? 'auto'
        : +this.options.rowHeight;

      const oldRowPadding = this.rowPadding;
      this.rowPadding = this.options.rowPadding || 0;

      const oldRowNormalization = this.rowNormalization;
      this.rowNormalization = this.options.rowNormalization || false;

      const oldRowSelections = this.rowSelections;
      this.rowSelections =
        this.options.rowSelections || this.rowSelections || [];

      if (
        oldMarkResolution !== this.markResolution ||
        oldRowSelections !== this.rowSelections
      ) {
        this.updateTiles();
      }

      if (
        oldRowHeight !== this.rowHeight ||
        oldRowPadding !== this.rowPadding ||
        oldRowNormalization !== this.rowNormalization
      ) {
        this.updateScales();
      }
    }

    rerender(newOptions) {
      this.options = newOptions;
      this.updateOptions();
      this.updateExistingGraphics();
    }

    hasFetchedTiles() {
      return Object.values(this.fetchedTiles).length;
    }

    coarsifyTileValues(tile) {
      const { tileX, tileWidth } = this.getTilePosAndDimensions(
        tile.tileData.zoomLevel,
        tile.tileData.tilePos
      );
      const [numRows] = tile.tileData.shape;
      const binSizePx = Math.floor(TILE_SIZE / this.markResolution);
      const binSizeBp = tileWidth / this.markResolution;
      const binSizeBpHalf = binSizeBp / 2;

      // Determine bin boundaries
      tile.tileData.binXPos = Array(this.markResolution).fill();
      for (let i = 0; i <= this.markResolution; i++) {
        tile.tileData.binXPos[i] = tileX + binSizeBp * i + binSizeBpHalf;
      }

      // 1. Coarsify the dense matrix according to `this.markResolution`
      tile.tileData.valuesByRow = Array(numRows)
        .fill()
        .map(() => []);
      tile.tileData.maxValueByRow = Array(numRows).fill(-Infinity);

      for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < TILE_SIZE; j += binSizePx) {
          const meanValue = meanNan(
            tile.tileData.dense.subarray(
              i * TILE_SIZE + j,
              i * TILE_SIZE + j + binSizePx
            )
          );
          tile.tileData.valuesByRow[i].push(meanValue);
          tile.tileData.maxValueByRow[i] =
            meanValue > tile.tileData.maxValueByRow[i]
              ? meanValue
              : tile.tileData.maxValueByRow[i];
        }
      }

      // 2. Sort rows
      if (this.rowSelections.length) {
        tile.tileData.valuesByRow = this.rowSelections
          .map((rowIdx) => tile.tileData.valuesByRow[rowIdx])
          .filter(identity);
        tile.tileData.maxValueByRow = this.rowSelections
          .map((rowIdx) => tile.tileData.maxValueByRow[rowIdx])
          .filter(identity);
      }

      // 3. Set out shape
      tile.tileData.coarseShape = [
        tile.tileData.valuesByRow.length,
        this.markResolution,
      ];
    }

    updateTiles() {
      Object.values(this.fetchedTiles).forEach(
        this.coarsifyTileValues.bind(this)
      );
    }

    updateScales() {
      const fetchedTiles = Object.values(this.fetchedTiles);

      if (!fetchedTiles.length) return;

      const [, visibleTrackHeight] = this.dimensions;
      const numRows = getNumRows(fetchedTiles);

      const rowHeight =
        this.rowHeight === 'auto'
          ? Math.floor(visibleTrackHeight / numRows)
          : this.rowHeight;

      const actualTrackHeight =
        this.rowHeight === 'auto'
          ? visibleTrackHeight
          : rowHeight * numRows + this.rowPadding * (numRows - 1);

      const globalMax = getMax(this.fetchedTiles);

      this.valueScale = scaleLinear()
        .domain([0, globalMax])
        .range([rowHeight, 0]);
      this.colorIndexScale = scaleLinear()
        .domain([0, globalMax])
        .range([0, this.markNumColors])
        .clamp(true);

      if (this.rowNormalization) {
        const rowMaxs = getRowMaxs(this.fetchedTiles);
        this.rowValueScales = {};
        this.rowColorIndexScales = {};
        for (let i = 0; i < numRows; i++) {
          this.rowValueScales[i] = scaleLinear()
            .domain([0, rowMaxs[i]])
            .range([rowHeight, 0]);
          this.rowColorIndexScales[i] = scaleLinear()
            .domain([0, rowMaxs[i]])
            .range([0, this.markNumColors])
            .clamp(true);
        }
        this.valueScaleByRow = (value, row) =>
          Number.isNaN(value) ? rowHeight : this.rowValueScales[row](value);
        this.colorIndexScaleByRow = (value, row) =>
          Number.isNaN(value) ? -2 : this.rowColorIndexScales[row](value);
      } else {
        this.valueScaleByRow = (value, row) =>
          Number.isNaN(value) ? rowHeight : this.valueScale(value);
        this.colorIndexScaleByRow = (value, row) =>
          Number.isNaN(value) ? -2 : this.colorIndexScale(value);
      }

      this.rowScale = scaleLinear()
        .domain([0, numRows])
        .range([0, actualTrackHeight]);
    }

    tilesToData(tiles, { markArea, maxRows = Infinity, rowHeight } = {}) {
      if (!tiles.length) return [];

      const numRows = Math.min(maxRows, getNumRows(tiles));

      const positionsByRow = Array(numRows)
        .fill()
        .map(() => []);
      const colorIndicesByRow = Array(numRows)
        .fill()
        .map(() => []);
      const offsetSignsByRow = Array(numRows)
        .fill()
        .map(() => []);

      tiles.forEach((tile) => {
        tile.tileData.valuesByRow.forEach((values, i) => {
          if (i >= maxRows) return;
          values.forEach((value, j) => {
            const x = this._xScale(tile.tileData.binXPos[j]);
            const yStart = this.rowScale(i);
            const y = yStart + this.valueScaleByRow(value, i);
            // We're duplicating the the point as for every point on the line we
            // need two x,y vertices to render triangles.
            positionsByRow[i].push(x, y, x, y);
            colorIndicesByRow[i].push(-1, -1); // -1 refers to the line color
            offsetSignsByRow[i].push(1, -1);

            if (markArea) {
              positionsByRow[i].push(x, y, x, yStart + rowHeight);
              colorIndicesByRow[i].push(this.colorIndexScaleByRow(value, i), 0);
              offsetSignsByRow[i].push(0, 0);
            }
          });
        });
      });

      const size2d = markArea ? 8 : 4;
      const size1d = markArea ? 4 : 2;

      // For each row, duplicate the first and last point
      for (let i = 0; i < numRows; i++) {
        // Add first point pair to the beginning of the array
        positionsByRow[i].unshift(...positionsByRow[i].slice(0, size2d));

        // The very first duplicated point positions do not matter as
        // we offset the buffer reading. Subsequent dupliations need to be
        // taken into account though.
        if (i > 0) {
          colorIndicesByRow[i].unshift(
            ...colorIndicesByRow[i].slice(0, size1d)
          );
          offsetSignsByRow[i].unshift(...offsetSignsByRow[i].slice(0, size1d));
        }

        // Add last point pair to the end of the array
        positionsByRow[i].push(...positionsByRow[i].slice(-size2d));
        colorIndicesByRow[i].push(...colorIndicesByRow[i].slice(-size1d));
        offsetSignsByRow[i].push(...offsetSignsByRow[i].slice(-size1d));
      }

      return [
        new Float32Array(positionsByRow.flatMap(identity)),
        new Float32Array(colorIndicesByRow.flatMap(identity)),
        new Float32Array(offsetSignsByRow.flatMap(identity)),
      ];
    }

    toLineIndices(numRows, numPointsPerRow, markArea) {
      const verticesPerLine = markArea ? 12 : 6;
      const verticesPerPoint = markArea ? 4 : 2;
      const indices = new Uint32Array(
        (numPointsPerRow - 1) * numRows * verticesPerLine
      );
      let k = 0;

      if (markArea) {
        // Draw a line and area
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numPointsPerRow - 1; j++) {
            // The `+2` comes from the fact that for each row of points we
            // duplicate the first and last point.
            const pointOffset = i * (numPointsPerRow + 2) * verticesPerPoint;
            const p1a = pointOffset + j * verticesPerPoint;
            const p1b = p1a + 1;
            const p1c = p1a + 2;
            const p1d = p1a + 3;
            const p2a = p1a + 4;
            const p2b = p1a + 5;
            const p2c = p1a + 6;
            const p2d = p1a + 7;

            const indexOffset = k * verticesPerLine;
            // Area
            indices[indexOffset] = p1c;
            indices[indexOffset + 1] = p1d;
            indices[indexOffset + 2] = p2c;
            indices[indexOffset + 3] = p2c;
            indices[indexOffset + 4] = p1d;
            indices[indexOffset + 5] = p2d;
            // Line
            indices[indexOffset + 6] = p1a;
            indices[indexOffset + 7] = p1b;
            indices[indexOffset + 8] = p2a;
            indices[indexOffset + 9] = p2a;
            indices[indexOffset + 10] = p1b;
            indices[indexOffset + 11] = p2b;

            k++;
          }
        }
      } else {
        // Just draw a line
        for (let i = 0; i < numRows; i++) {
          for (let j = 0; j < numPointsPerRow - 1; j++) {
            // The `+2` comes from the fact that for each row of points we
            // duplicate the first and last point.
            const pointOffset = i * (numPointsPerRow + 2) * verticesPerPoint;
            const p1a = pointOffset + j * verticesPerPoint;
            const p1b = p1a + 1;
            const p2a = p1a + 2;
            const p2b = p1a + 3;

            const indexOffset = k * verticesPerLine;
            indices[indexOffset] = p1a;
            indices[indexOffset + 1] = p1b;
            indices[indexOffset + 2] = p2a;
            indices[indexOffset + 3] = p2a;
            indices[indexOffset + 4] = p1b;
            indices[indexOffset + 5] = p2b;

            k++;
          }
        }
      }

      return indices;
    }

    renderLines() {
      this.drawnAtScale = scaleLinear()
        .domain([...this.xScale().domain()])
        .range([...this.xScale().range()]);

      const tiles = Object.values(this.fetchedTiles);

      const numRows = getNumRows(tiles);
      const [, visibleTrackHeight] = this.dimensions;

      const rowHeight =
        this.rowHeight === 'auto'
          ? Math.floor(visibleTrackHeight / numRows)
          : this.rowHeight;

      const [positions, colorIndices, offsetSigns] = this.tilesToData(tiles, {
        maxRows: numRows,
        markArea: this.markArea,
        rowHeight,
      });

      const numPointsPerRow = getNumPointsPerRow(
        numRows,
        positions,
        this.markArea
      );

      const indices = this.toLineIndices(
        numRows,
        numPointsPerRow,
        this.markArea
      );

      const uniforms = new PIXI.UniformGroup({
        uLineColor: [...this.markColorRgbNorm, 1.0],
        uNaNColor: [1.0, 1.0, 1.0, 1.0],
        uAreaColorTex: this.markColorTex,
        uAreaColorTexRes: this.markColorTexRes,
        uWidth: 0.25,
        uMiter: 1,
      });

      const shader = PIXI.Shader.from(VS, FS, uniforms);

      const geometry = new PIXI.Geometry();
      const numCoords = 2;
      const numVerticesPoint = this.markArea ? 4 : 2;
      geometry.addAttribute(
        'aPrevPosition',
        positions,
        2, // size
        false, // normalize
        PIXI.TYPES.FLOAT, // type
        FLOAT_BYTES * numCoords, // stride
        0 // offset/start
      );
      geometry.addAttribute(
        'aCurrPosition',
        positions,
        2, // size
        false, // normalize
        PIXI.TYPES.FLOAT, // type
        FLOAT_BYTES * numCoords, // stride
        // note that each point is duplicated, hence we need to skip over the first two
        FLOAT_BYTES * numCoords * numVerticesPoint // offset/start
      );
      geometry.addAttribute(
        'aNextPosition',
        positions,
        2, // size
        false, // normalize
        PIXI.TYPES.FLOAT, // type
        FLOAT_BYTES * 2, // stride
        // note that each point is duplicated, hence we need to skip over the first four
        FLOAT_BYTES * numCoords * numVerticesPoint * 2 // offset/start
      );
      geometry.addAttribute('aOffsetSign', offsetSigns, 1);
      geometry.addAttribute('aColorIndex', colorIndices, 1);
      geometry.addIndex(indices);

      const mesh = new PIXI.Mesh(geometry, shader);

      const newGraphics = new PIXI.Graphics();
      newGraphics.addChild(mesh);

      // eslint-disable-next-line
      this.pMain.x = this.position[0];

      if (this.lineGraphics) {
        this.pMain.removeChild(this.lineGraphics);
        this.lineGraphics.destroy();
      }

      this.pMain.addChild(newGraphics);
      this.lineGraphics = newGraphics;

      scaleGraphics(this.lineGraphics, this._xScale, this.drawnAtScale);

      this.draw();
      this.animate();
    }

    updateIndicators() {
      // Needs to be implemented:
      // this.renderIndicatorCategoryAxis(this.valueScaleInverted);
      this.renderLines();
    }

    // Called whenever a new tile comes in
    updateExistingGraphics() {
      if (!this.hasFetchedTiles()) return;
      this.updateScales();
      this.updateIndicators();
    }

    setPosition(newPosition) {
      super.setPosition(newPosition);

      [this.pMain.position.x, this.pMain.position.y] = this.position;
    }

    zoomed(newXScale, newYScale) {
      this.xScale(newXScale);
      this.yScale(newYScale);

      if (this.lineGraphics) {
        scaleGraphics(this.lineGraphics, newXScale, this.drawnAtScale);
      }

      this.refreshTiles();
      this.draw();
    }

    /**
     * Return the data currently visible at position X and Y
     *
     * @param {Number} trackX: The x position relative to the track's start and end
     * @param {Number} trakcY: The y position relative to the track's start and end
     */
    getVisibleData(trackX, trackY) {
      const zoomLevel = this.calculateZoomLevel();

      // the width of the tile in base pairs
      const tileWidth = tileProxy.calculateTileWidth(
        this.tilesetInfo,
        zoomLevel,
        this.tilesetInfo.tile_size
      );

      // the position of the tile containing the query position
      const tilePos = this._xScale.invert(trackX) / tileWidth;
      const numRows = getNumRows(this.fetchedTiles);

      // the position of query within the tile
      let posInTileX =
        this.tilesetInfo.tile_size * (tilePos - Math.floor(tilePos));
      const posInTileYNormalized = trackY / this.dimensions[1];
      const posInTileY = posInTileYNormalized * numRows;

      const rowIndex = Math.floor(posInTileY);
      const rowSelection = this.rowSelections[rowIndex];
      const tileId = this.tileToLocalId([zoomLevel, Math.floor(tilePos)]);
      const fetchedTile = this.fetchedTiles[tileId];

      let value = '';

      if (fetchedTile) {
        if (!this.tilesetInfo.shape) {
          posInTileX =
            fetchedTile.tileData.dense.length * (tilePos - Math.floor(tilePos));
        }

        let index = null;
        if (this.tilesetInfo.shape) {
          // Accomodate data from vector sources
          if (
            Array.isArray(rowSelection) &&
            this.options.selectRowsAggregationMethod === 'client'
          ) {
            // Need to aggregate, so `index` will actually be an array.
            index = rowSelection.map(
              (rowI) =>
                this.tilesetInfo.shape[0] * rowI + Math.floor(posInTileX)
            );
          } else if (
            rowSelection &&
            this.options.selectRowsAggregationMethod === 'client'
          ) {
            index =
              this.tilesetInfo.shape[0] * rowSelection + Math.floor(posInTileX);
          } else {
            // No need to aggregate, `index` will contain a single item.
            index =
              this.tilesetInfo.shape[0] * rowIndex + Math.floor(posInTileX);
          }
        } else {
          index =
            fetchedTile.tileData.dense.length * rowIndex +
            Math.floor(posInTileX);
        }

        if (Array.isArray(index)) {
          const values = index.map((i) => fetchedTile.tileData.dense[i]);
          value = format('.3f')(this.selectRowsAggregationFn(values));
          value += '<br/>';
          value += `${index.length}-item ${this.options.selectRowsAggregationMode}`;
        } else {
          value = format('.3f')(fetchedTile.tileData.dense[index]);
          if (Array.isArray(rowSelection)) {
            value += '<br/>';
            value += `${rowSelection.length}-item ${this.options.selectRowsAggregationMode}`;
          }
        }
      }

      // add information about the row
      if (this.tilesetInfo.row_infos) {
        value += '<br/>';
        let rowInfo = '';
        if (this.options.selectRows && !Array.isArray(rowSelection)) {
          rowInfo = this.tilesetInfo.row_infos[rowSelection];
        } else if (rowIndex) {
          rowInfo = this.tilesetInfo.row_infos[rowIndex];
        }
        if (typeof rowInfo === 'object') {
          // The simplest thing to do here is conform to the tab-separated values convention.
          value += Object.values(rowInfo).join('\t');
        } else {
          // Probably a tab-separated string since not an object.
          value += rowInfo;
        }
      }

      return `${value}`;
    }

    /**
     * Get some information to display when the mouse is over this
     * track
     *
     * @param {Number} trackX: the x position of the mouse over the track
     * @param {Number} trackY: the y position of the mouse over the track
     *
     * @return {string}: A HTML string containing the information to display
     *
     */
    getMouseOverHtml(trackX, trackY) {
      if (!this.tilesetInfo) return '';

      return `Value: ${this.getVisibleData(trackX, trackY)}`;
    }
  }

  return new RidgePlotTrack(...args);
};

createRidgePlotTrack.config = {
  type: 'ridge-plot',
  datatype: ['multivec'],
  orientation: '1d',
  name: 'RidgePlot',
};

export default createRidgePlotTrack;
