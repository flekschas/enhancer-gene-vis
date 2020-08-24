import { identity, maxVector, mean } from '@flekschas/utils';

const FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT;

const VS = `precision mediump float;

  attribute vec2 aPrevPosition;
  attribute vec2 aCurrPosition;
  attribute vec2 aNextPosition;
  attribute float aOffsetSign;

  uniform mat3 projectionMatrix;
  uniform mat3 translationMatrix;

  uniform float uWidth;
  uniform int uMiter;

  void main(void)
  {
    mat3 model = projectionMatrix * translationMatrix;
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
  }
`;

const FS = `precision mediump float;

  uniform vec4 uColor;

  void main() {
    gl_FragColor = vec4(uColor.rgb, 1.0);
  }
`;

const TILE_SIZE = 256;

const getMax = (fetchedTiles) =>
  Object.values(fetchedTiles).reduce(
    (max, tile) => Math.max(max, tile.tileData.maxNonZero),
    -Infinity
  );

const getNumRows = (fetchedTiles) =>
  Object.values(fetchedTiles)[0].tileData.shape[0];

const getRowMaxs = (fetchedTiles) =>
  maxVector(Object.values(fetchedTiles).map((tile) => tile.tileData.rowMaxs));

const scaleGraphics = (graphics, xScale, drawnAtScale) => {
  const tileK =
    (drawnAtScale.domain()[1] - drawnAtScale.domain()[0]) /
    (xScale.domain()[1] - xScale.domain()[0]);
  const newRange = xScale.domain().map(drawnAtScale);

  const posOffset = newRange[0];
  graphics.scale.x = tileK;
  graphics.position.x = -posOffset * tileK;
};

const rowWiseMinMax = (data, shape) => {
  const [rows, cols] = shape;
  const mins = Array(2 * rows).fill();
  const maxs = Array(2 * rows).fill();
  for (let i = 0; i < rows; i++) {
    mins[i] = Math.min.apply(null, data.slice(i * cols, (i + 1) * cols));
    maxs[i] = Math.max.apply(null, data.slice(i * cols, (i + 1) * cols));
  }
  return [mins, maxs];
};

const createRidgePlotTrack = function createRidgePlotTrack(HGC, ...args) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"'
    );
  }

  const { PIXI } = HGC.libraries;
  const { scaleLinear } = HGC.libraries.d3Scale;

  class RidgePlotTrack extends HGC.tracks.HorizontalMultivecTrack {
    constructor(context, options) {
      super(context, options);
      this.updateOptions();
    }

    initTile(tile) {
      const [rowMins, rowMaxs] = rowWiseMinMax(
        tile.tileData.dense,
        tile.tileData.shape
      );
      tile.tileData.rowMins = rowMins;
      tile.tileData.rowMaxs = rowMaxs;
      this.coarsifyTileValues(tile);
    }

    destroyTile() {}

    updateOptions() {
      this.markColor = HGC.utils.colorToHex(this.options.markColor || 'black');

      this.markColorRgbNorm = this.options.markColor
        ? HGC.utils
            .colorToRgba(this.options.markColor)
            .slice(0, 3)
            .map((x) => Math.min(1, Math.max(0, x / 255)))
        : [0, 0, 0];

      this.markOpacity = Number.isNaN(+this.options.markOpacity)
        ? 1
        : Math.min(1, Math.max(0, +this.options.markOpacity));

      this.markSize = this.options.markSize || 2;

      // Number of line segments
      const oldMarkResolution = this.markResolution;
      this.markResolution = this.options.markResolution || TILE_SIZE / 4;
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

      if (oldMarkResolution !== this.markResolution) {
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

      for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < TILE_SIZE; j += binSizePx) {
          tile.tileData.valuesByRow[i].push(
            mean(
              tile.tileData.dense.subarray(
                i * TILE_SIZE + j,
                i * TILE_SIZE + j + binSizePx
              )
            )
          );
        }
      }
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

      const max = getMax(this.fetchedTiles);

      this.valueScale = scaleLinear().domain([0, max]).range([rowHeight, 0]);

      if (this.rowNormalization) {
        const rowMaxs = getRowMaxs(this.fetchedTiles);
        this.rowValueScales = {};
        for (let i = 0; i < numRows; i++) {
          this.rowValueScales[i] = scaleLinear()
            .domain([0, rowMaxs[i]])
            .range([rowHeight, 0]);
        }
        this.valueScaleByRow = (value, row) => this.rowValueScales[row](value);
      } else {
        this.valueScaleByRow = (value, row) => this.valueScale(value);
      }

      this.rowScale = scaleLinear()
        .domain([0, numRows])
        .range([0, actualTrackHeight]);
    }

    itemToIndicatorCategory(item, isHighlighting) {
      return {
        cX: this._xScale(item.start),
        y: this.categoryHeightScale(
          this.categoryToY.get(this.getCategory(item))
        ),
        opacity: this.opacityScale(this.getImportance(item)),
        highlight: isHighlighting && item.__focus,
        widthHalf: Math.max(
          this.markMinWidth / 2,
          Math.abs(this._xScale(item.xStart) - this._xScale(item.xEnd)) / 2
        ),
        height: this.markHeight,
        __item: item,
      };
    }

    tilesToNumPoints(tiles) {
      return (
        tiles[0].tileData.valuesByRow.length *
        tiles[0].tileData.valuesByRow[0].length
      );
    }

    tilesToPositions(tiles, maxRows = Infinity) {
      if (!tiles.length) return [];

      const numRows = Math.min(maxRows, getNumRows(tiles));

      const positionsByRow = Array(numRows)
        .fill()
        .map(() => []);
      tiles.forEach((tile) => {
        tile.tileData.valuesByRow.forEach((values, i) => {
          if (i >= maxRows) return;
          values.forEach((value, j) => {
            const x = this._xScale(tile.tileData.binXPos[j]);
            const y = this.rowScale(i) + this.valueScaleByRow(value, i);
            // We're duplicating the the point as for every point on the line we
            // need two x,y vertices to render triangles.
            positionsByRow[i].push(x, y, x, y);
          });
        });
      });

      // For each row, duplicate the first and last point
      positionsByRow.forEach((positions) => {
        // Add first point pair to the beginning of the array
        positions.unshift(...positions.slice(0, 4));

        // Add last point pair to the end of the array
        positions.push(...positions.slice(-4));
      });

      return new Float32Array(positionsByRow.flatMap(identity));
    }

    positionsToOffsetSign(positions) {
      const offsetSigns = new Float32Array(positions.length).fill(1);
      for (let i = 1; i < positions.length; i += 2) {
        offsetSigns[i] = -1;
      }
      return offsetSigns;
    }

    numPointsToIndices(numRows, numPointsPerRow) {
      const indices = new Uint32Array((numPointsPerRow - 1) * numRows * 6);
      let k = 0;
      for (let i = 0; i < numRows; i++) {
        for (let j = 0; j < numPointsPerRow - 1; j++) {
          // The `+2` comes from the fact that for each row of points we
          // duplicate the first and last point.
          const pointOffset = i * (numPointsPerRow + 2) * 2;
          const a = pointOffset + j * 2;
          const b = a + 1;
          const c = a + 2;
          const d = a + 3;

          const indexOffset = k * 6;
          indices[indexOffset] = a;
          indices[indexOffset + 1] = b;
          indices[indexOffset + 2] = c;
          indices[indexOffset + 3] = c;
          indices[indexOffset + 4] = b;
          indices[indexOffset + 5] = d;

          k++;
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
      const positions = this.tilesToPositions(tiles, numRows);
      const numPoints = positions.length / 4 - 2 * numRows;
      const numPointsPerRow = positions.length / numRows / 4 - 2;
      const offsetSigns = this.positionsToOffsetSign(positions);
      const indices = this.numPointsToIndices(numRows, numPointsPerRow);

      const uniforms = new PIXI.UniformGroup({
        uColor: [...this.markColorRgbNorm, 1.0],
        uColorHighlight: [1.0, 0.0, 0.0, 1.0],
        uWidth: 0.25,
        uMiter: 1,
      });

      const shader = PIXI.Shader.from(VS, FS, uniforms);

      const geometry = new PIXI.Geometry();
      geometry.addAttribute(
        'aPrevPosition',
        positions,
        2, // size
        false, // normalize
        PIXI.TYPES.FLOAT, // type
        FLOAT_BYTES * 2, // stride
        0 // offset/start
      );
      geometry.addAttribute(
        'aCurrPosition',
        positions,
        2, // size
        false, // normalize
        PIXI.TYPES.FLOAT, // type
        FLOAT_BYTES * 2, // stride
        // note that each point is duplicated, hence we need to skip over the first two
        FLOAT_BYTES * 2 * 2 // offset/start
      );
      geometry.addAttribute(
        'aNextPosition',
        positions,
        2, // size
        false, // normalize
        PIXI.TYPES.FLOAT, // type
        FLOAT_BYTES * 2, // stride
        // note that each point is duplicated, hence we need to skip over the first four
        FLOAT_BYTES * 2 * 4 // offset/start
      );
      geometry.addAttribute('aOffsetSign', offsetSigns, 1);
      geometry.addIndex(indices);

      const mesh = new PIXI.Mesh(geometry, shader);

      const newGraphics = new PIXI.Graphics();
      newGraphics.addChild(mesh);

      // eslint-disable-next-line
      this.pMain.x = this.position[0];

      if (this.lineGraphics) {
        this.pMain.removeChild(this.lineGraphics);
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

    getMouseOverHtml() {}
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
