import { dashedXLineTo } from '../../utils';

const VS = `
  precision mediump float;
  attribute vec2 aPosition;
  attribute float aOpacity;
  attribute float aFocused;

  uniform mat3 projectionMatrix;
  uniform mat3 translationMatrix;
  uniform float uPointSize;
  uniform vec4 uColor;
  uniform vec4 uColorFocused;

  varying vec4 vColor;
  varying vec4 vColorFocused;
  varying float vOpacity;
  varying float vFocused;

  void main(void)
  {
    vColor = uColor;
    vColorFocused = uColorFocused;
    vOpacity = aOpacity;
    vFocused = aFocused;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    gl_PointSize = uPointSize;
  }
`;

const FS_ROUND = `
  #ifdef GL_OES_standard_derivatives
  #extension GL_OES_standard_derivatives : enable
  #endif

  precision mediump float;

  varying vec4 vColor;
  varying vec4 vColorFocused;
  varying float vOpacity;
  varying float vFocused;

  void main() {
    float r = 0.0, delta = 0.0, alpha = 1.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);

    #ifdef GL_OES_standard_derivatives
      delta = fwidth(r);
      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    #endif

    gl_FragColor = vec4(vColor.rgb, alpha * vColor.a);
  }
`;

const FS_SQUARE = `
  precision mediump float;
  varying vec4 vColor;
  varying vec4 vColorFocused;
  varying float vOpacity;
  varying float vFocused;

  void main() {
    float isNotFocused = 1.0 - vFocused;

    float r = vColor.r * isNotFocused + vColorFocused.r * vFocused;
    float g = vColor.g * isNotFocused + vColorFocused.g * vFocused;
    float b = vColor.b * isNotFocused + vColorFocused.b * vFocused;

    gl_FragColor = vec4(r, g, b, 1.0) * vOpacity;
  }
`;

const DEFAULT_GROUP_COLORS = [
  // '#c17da5',
  '#c76526',
  '#dca237',
  '#eee462',
  '#469b76',
  '#3170ad',
  '#6fb2e4',
  '#000000',
  '#999999',
];

const DEFAULT_GROUP_COLORS_DARK = [
  // '#a1688a',
  '#a65420',
  '#b7872e',
  '#9f9841',
  '#3a8162',
  '#295d90',
  '#4a7798',
  '#000000',
  '#666666',
];

const DEFAULT_GROUP_COLORS_LIGHT = [
  // '#f5e9f0',
  '#f6e5db',
  '#f9f0de',
  '#fcfbe5',
  '#e0eee8',
  '#dde7f1',
  '#e7f2fb',
  '#d5d5d5',
  '#ffffff',
];

const getIs2d = (tile) =>
  tile.tileData.length && tile.tileData[0].yStart !== undefined;

const get1dItemWidth = (item) => item.xEnd - item.xStart;

const get2dItemWidth = (item) =>
  Math.abs(
    item.xStart +
      (item.xEnd - item.xStart) / 2 -
      (item.yStart + (item.yEnd - item.yStart) / 2)
  );

const get1dStart = (item) => item.xStart;

const get2dStart = (item) => item.xStart + (item.xEnd - item.xStart) / 2;

const get1dEnd = (item) => item.xEnd;

const get2dEnd = (item) => item.yStart + (item.yEnd - item.yStart) / 2;

const getMaxWidth = (fetchedTiles) =>
  Object.values(fetchedTiles).reduce(
    (maxWidth, tile) =>
      Math.max(
        maxWidth,
        tile.tileData.reduce(
          (maxWidthItem, item) => Math.max(maxWidthItem, item.width),
          0
        )
      ),
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

const createScalableArcs1dTrack = function createScalableArcs1dTrack(
  HGC,
  ...args
) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"'
    );
  }

  const { PIXI } = HGC.libraries;
  const { scaleLinear, scaleLog } = HGC.libraries.d3Scale;

  const opacityLogScale = scaleLog()
    .domain([1, 10])
    .range([0.1, 1])
    .clamp(true);

  class ScalableArcs1dTrack extends HGC.tracks.HorizontalLine1DPixiTrack {
    constructor(context, options) {
      super(context, options);

      this.updateOptions();
    }

    initTile(tile) {
      const is2d = getIs2d(tile);
      const getItemWidth = is2d ? get2dItemWidth : get1dItemWidth;
      const getStart = is2d ? get2dStart : get1dStart;
      const getEnd = is2d ? get2dEnd : get1dEnd;

      tile.tileData.forEach((item) => {
        item.width = getItemWidth(item);
        item.start = getStart(item);
        item.end = getEnd(item);
        item.isLeftToRight = item.start < item.end;
      });
    }

    updateTileWidthHistogram(tile) {
      const numBins = Math.max(this.dimensions[1] / this.pointSize);
      const binSize = this.maxWidth / numBins;

      let max = 0;

      tile.widthHistogramLeft = new Uint32Array(numBins);
      tile.widthHistogramRight = new Uint32Array(numBins);

      tile.tileData.forEach((item) => {
        const bin = Math.round(item.width / binSize);
        // We will use this for vertical offsettings similar to a beeswarm plot
        item.histPos = item.isLeftToRight
          ? tile.widthHistogramRight[bin]++
          : tile.widthHistogramLeft[bin]++;
        max = max > item.histPos ? max : item.histPos;
      });

      tile.widthHistogramMax = max;
    }

    updateWidthHistograms() {
      Object.values(this.fetchedTiles).forEach(
        this.updateTileWidthHistogram.bind(this)
      );
    }

    updateStratificationOption() {
      if (!this.options.stratification) {
        this.categoryField = undefined;
        this.categoryToGroup = undefined;
        this.groupToColor = undefined;
        this.numGroups = 0;
        this.numCategories = 0;
        this.groupLabels = [];
        return;
      }

      this.categoryField = this.options.stratification.categoryField;
      this.categoryToGroup = new Map();
      this.categoryToY = new Map();
      this.groupToColor = new Map();
      this.numGroups = this.options.stratification.groups.length;
      this.groupSizes = this.options.stratification.groups.map(
        (group) => group.categories.length
      );
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
          HGC.utils.colorToHex(
            group.color || DEFAULT_GROUP_COLORS[i % DEFAULT_GROUP_COLORS.length]
          ),
          HGC.utils.colorToHex(
            group.backgroundColor ||
              DEFAULT_GROUP_COLORS_LIGHT[i % DEFAULT_GROUP_COLORS.length]
          ),
        ]);
        group.categories.forEach((category, j) => {
          this.categoryToGroup.set(category.toLowerCase(), i);
          this.categoryToY.set(category.toLowerCase(), k + j);
        });
        k += group.categories.length;
      });

      this.groupLabelsPixiText = this.groupLabels.map(
        (label, i) =>
          new PIXI.Text(label, {
            fontSize: this.labelSize,
            // fill: this.labelColor,
            align: this.axisAlign === 'right' ? 'right' : 'left',
            fill: HGC.utils.colorToHex(
              this.options.stratification.groups[i].axisLabelColor ||
                DEFAULT_GROUP_COLORS_DARK[i % DEFAULT_GROUP_COLORS_DARK.length]
            ),
          })
      );
    }

    updateOptions() {
      this.axisAlign = this.options.axisAlign || 'left';

      this.labelColor = HGC.utils.colorToHex(
        this.options.labelColor || 'black'
      );

      this.labelSize = this.options.labelSize || 12;

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

      this.markColorFocus = HGC.utils.colorToHex(
        this.options.markColorFocus || 'red'
      );

      this.markColorFocusRgbNorm = this.options.markColorFocus
        ? HGC.utils
            .colorToRgba(this.options.markColorFocus)
            .slice(0, 3)
            .map((x) => Math.min(1, Math.max(0, x / 255)))
        : [1, 0, 0];

      this.markOpacityFocus = Number.isNaN(+this.options.markOpacityFocus)
        ? this.markOpacity
        : Math.min(1, Math.max(0, +this.options.markOpacityFocus));

      this.markSizeFocus = this.options.markSizeFocus || this.markSize;

      this.strokeColor =
        this.markColor ||
        HGC.utils.colorToHex(this.options.strokeColor || 'black');

      this.strokeWidth = this.options.strokeWidth || this.markSize;

      this.getImportance = this.options.importanceField
        ? (item) => +item.fields[this.options.importanceField]
        : (item) => item.width;

      const importanceDomain = this.options.importanceDomain || [1000, 1];

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

      this.getGene = this.options.geneField
        ? (item) => item.fields[this.options.geneField].toLowerCase()
        : undefined;

      this.minImportance = this.options.minImportance || 0;

      this.updateStratificationOption();

      this.updateWidthHistograms();
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
      const markSizeHalf = this.markSize / 2;

      this.maxWidth = getMaxWidth(this.fetchedTiles);

      this.heightScale = scaleLinear()
        .domain([0, this.maxWidth])
        .range([Math.min(12, height / 10), height]);

      this.fullHeightScale = scaleLinear()
        .domain([this.maxWidth, 0])
        .range([
          Math.min(markSizeHalf, height / 10),
          Math.max(height - markSizeHalf, (9 * height) / 10),
        ]);

      this.fullHeightScaleInverted = scaleLinear()
        .domain([0, this.maxWidth])
        .range([
          Math.min(markSizeHalf, height / 10),
          Math.max(height - markSizeHalf, (9 * height) / 10),
        ]);

      this.incomingHeightScale = scaleLinear()
        .domain([0, this.maxWidth])
        .range([height / 2, height]);

      this.outgoingHeightScale = scaleLinear()
        .domain([0, this.maxWidth])
        .range([height / 2, 0]);

      this.categoryHeightScale = scaleLinear()
        .domain([0, this.numCategories])
        .range([0, this.numCategories * this.markSize]);

      this.valueScale = scaleLinear()
        .domain([0, this.maxWidth])
        .range([height, 0]);

      this.valueScaleInverted = scaleLinear()
        .domain([0, this.maxWidth])
        .range([0, height]);
    }

    itemToIndicatorDiverging(item) {
      return {
        startX: this._xScale(item.start),
        endX: this._xScale(item.end),
        startY: this.outgoingHeightScale(item.width),
        endY: this.incomingHeightScale(item.width),
        opacity: this.opacityScale(this.getImportance(item)),
        size: this.markSize,
      };
    }

    itemToIndicatorStart(item) {
      return {
        x: this._xScale(item.start),
        y: this.fullHeightScale(item.width),
        opacity: this.opacityScale(this.getImportance(item)),
        size: this.markSize,
      };
    }

    itemToIndicatorEnd(item) {
      return {
        x: this._xScale(item.end),
        y: this.fullHeightScaleInverted(item.width),
        opacity: this.opacityScale(this.getImportance(item)),
        size: this.markSize,
      };
    }

    itemToIndicatorCategory(item) {
      return {
        cX: this._xScale(item.start),
        cY: this.categoryHeightScale(
          this.categoryToY.get(item.fields[this.categoryField].toLowerCase())
        ),
        wHalf: Math.max(
          this.markSize / 2,
          Math.abs(this._xScale(item.xStart) - this._xScale(item.xEnd)) / 2
        ),
        opacity: this.opacityScale(this.getImportance(item)),
        focused:
          item.xStart <= this.focusRegion[1] &&
          item.xEnd >= this.focusRegion[0],
        size: this.markSize,
        sizeHalf: this.markSize / 2,
      };
    }

    itemToIndicatorReducer(mapFn) {
      if (this.getGene && this.focusGene) {
        return (filteredItems, item) => {
          const gene = this.getGene(item);
          if (gene === this.focusGene) filteredItems.push(mapFn(item));
          return filteredItems;
        };
      }
      return (filteredItems, item) => {
        filteredItems.push(mapFn(item));
        return filteredItems;
      };
    }

    renderIndicatorPoints(
      dataToPoint,
      pointToPosition,
      pointToOpacity,
      pointToFocused,
      {
        vertexShader = VS,
        fragmentShader = FS_ROUND,
        drawTriangles = false,
      } = {}
    ) {
      this.drawnAtScale = scaleLinear()
        .domain([...this.xScale().domain()])
        .range([...this.xScale().range()]);

      const points = Object.values(this.fetchedTiles).flatMap((tile) =>
        tile.tileData.reduce(dataToPoint, [])
      );

      const positions = new Float32Array(points.flatMap(pointToPosition));
      const opacities = new Float32Array(points.flatMap(pointToOpacity));
      const focused = new Float32Array(points.flatMap(pointToFocused));

      const uniforms = new PIXI.UniformGroup({
        uPointSize: this.markSize,
        uColor: [...this.markColorRgbNorm, this.markOpacity],
        uColorFocused: [...this.markColorFocusRgbNorm, this.markOpacity],
      });

      const shader = PIXI.Shader.from(vertexShader, fragmentShader, uniforms);

      const geometry = new PIXI.Geometry();
      geometry.addAttribute('aPosition', positions, 2);
      geometry.addAttribute('aOpacity', opacities, 1);
      geometry.addAttribute('aFocused', focused, 1);

      const mesh = new PIXI.Mesh(
        geometry,
        shader,
        new PIXI.State(),
        drawTriangles ? PIXI.DRAW_MODES.TRIANGLES : PIXI.DRAW_MODES.POINTS
      );
      // mesh.blendMode = PIXI.BLEND_MODES.MULTIPLY;

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

    renderIndicatorDistanceAxis(valueScale) {
      this.drawAxis(valueScale);
    }

    renderIndicatorCategoryAxis() {
      const [width] = this.dimensions;
      const [left, top] = this.position;

      this.pAxis.position.x = this.axisAlign === 'right' ? left + width : left;
      this.pAxis.position.y = top;

      this.pAxis.clear();
      let yStart = 0;
      let yEnd = 0;

      const xTickOffset = this.axisAlign === 'right' ? -5 : 5;
      const xTickEnd = this.axisAlign === 'right' ? -width : width;
      const xLabelOffset = this.axisAlign === 'right' ? -3 : 3;
      const numAxisLabels = this.pAxis.children.length;

      this.pAxis.lineStyle(1, 0x000000, 1.0, 0.0);

      this.groupLabelsPixiText.forEach((labelPixiText, i) => {
        const height = this.categoryHeightScale(this.groupSizes[i]);
        yEnd += height;
        labelPixiText.x = xLabelOffset;
        labelPixiText.y = yStart + height / 2;
        labelPixiText.anchor.x = this.axisAlign === 'right' ? 1 : 0;
        labelPixiText.anchor.y = 0.5;

        if (numAxisLabels < i + 1) {
          this.pAxis.addChild(labelPixiText);
        }

        this.pAxis.moveTo(0, yStart);
        this.pAxis.lineTo(xTickOffset, yStart);
        if (this.options.stratification.axisShowGroupSeparator) {
          dashedXLineTo(this.pAxis, 0, xTickEnd, yStart, 5);
        }

        yStart = yEnd;
      });

      this.pAxis.moveTo(0, 0);
      this.pAxis.lineTo(0, yEnd);
      this.pAxis.lineTo(xTickOffset, yEnd);
      if (this.options.stratification.axisShowGroupSeparator) {
        dashedXLineTo(this.pAxis, 0, xTickEnd, yEnd, 5);
      }
    }

    updateIndicators() {
      let dataToPoint = this.itemToIndicatorDiverging.bind(this);
      let pointToPosition = (pt) => [pt.startX, pt.startY, pt.endX, pt.endY];
      let pointToOpacity = (pt) => pt.opacity;
      let pointToFocused = (pt) => pt.focused;
      let fragmentShader = FS_ROUND;
      let drawTriangles = false;

      if (this.options.indicatorStyle === 'category') {
        dataToPoint = this.itemToIndicatorCategory.bind(this);
        pointToPosition = (pt) => [pt.cX, pt.cY];
        fragmentShader = FS_SQUARE;
        this.renderIndicatorCategoryAxis(this.valueScaleInverted);
      } else if (this.options.indicatorStyle === 'category-rect') {
        dataToPoint = this.itemToIndicatorCategory.bind(this);
        // prettier-ignore
        pointToPosition = (pt) => [
          pt.cX - pt.wHalf, pt.cY,
          pt.cX + pt.wHalf, pt.cY,
          pt.cX + pt.wHalf, pt.cY + pt.size,
          pt.cX + pt.wHalf, pt.cY + pt.size,
          pt.cX - pt.wHalf, pt.cY + pt.size,
          pt.cX - pt.wHalf, pt.cY,
        ];
        pointToOpacity = (pt) => [
          pt.opacity,
          pt.opacity,
          pt.opacity,
          pt.opacity,
          pt.opacity,
          pt.opacity,
        ];
        pointToFocused = (pt) => [
          pt.focused,
          pt.focused,
          pt.focused,
          pt.focused,
          pt.focused,
          pt.focused,
        ];
        fragmentShader = FS_SQUARE;
        drawTriangles = true;
        this.renderIndicatorCategoryAxis(this.valueScaleInverted);
      } else if (this.options.indicatorStyle === 'start-only') {
        dataToPoint = this.itemToIndicatorStart.bind(this);
        pointToPosition = (pt) => [pt.x, pt.y];
        this.renderIndicatorDistanceAxis(this.valueScale);
      } else if (this.options.indicatorStyle === 'end-only') {
        dataToPoint = this.itemToIndicatorEnd.bind(this);
        pointToPosition = (pt) => [pt.x, pt.y];
        this.renderIndicatorDistanceAxis(this.valueScaleInverted);
      }

      // dataToPoint must be a reducer.
      dataToPoint = this.itemToIndicatorReducer(dataToPoint);

      this.renderIndicatorPoints(
        dataToPoint,
        pointToPosition,
        pointToOpacity,
        pointToFocused,
        {
          fragmentShader,
          drawTriangles,
        }
      );
    }

    // Called whenever a new tile comes in
    updateExistingGraphics() {
      this.updateScales();
      this.updateWidthHistograms();
      if (this.options.arcStyle === 'indicator') this.updateIndicators();
    }

    // Gets called on every draw call
    drawTile(tile, storePolyStr) {
      tile.graphics.clear();

      if (!tile.tileData.length) return;

      if (this.options.arcStyle === 'indicator') {
        const [width, height] = this.dimensions;

        if (this.options.indicatorStyle.startsWith('category')) {
          if (!this.options.stratification.axisNoGroupColor) {
            let yStart = 0;
            let yEnd = 0;
            this.groupSizes.forEach((size, i) => {
              yEnd += this.categoryHeightScale(size);

              tile.graphics.beginFill(this.groupToColor.get(i)[1]);
              tile.graphics.drawRect(0, yStart, width, Math.abs(yEnd - yStart));

              yStart = yEnd;
            });
            tile.graphics.endFill();
          }
        } else {
          let y = Math.round(height / 2) - 0.5;

          if (this.options.indicatorStyle === 'start-only') {
            y = height - 0.5;
          } else if (this.options.indicatorStyle === 'end-only') {
            y = 0.5;
          }
          tile.graphics.lineStyle(1, 0, 0.2);
          tile.graphics.moveTo(0, y);
          tile.graphics.lineTo(width, y);
        }
      }

      for (let i = 0; i < tile.tileData.length; i++) {
        const item = tile.tileData[i];

        if (this.options.arcStyle === 'circle') {
          this.drawCircle(tile.graphics, item, storePolyStr);
        } else if (this.options.arcStyle === 'indicator') {
          // this.drawIndicator(tile.graphics, this.itemToIndicator(item));
        } else {
          this.drawEllipse(tile.graphics, item, storePolyStr);
        }
      }
    }

    drawIndicator(graphics, item) {
      const startX = this._xScale(item.start);
      const endX = this._xScale(item.end);
      const startY = this.outgoingHeightScale(item.width);
      const endY = this.incomingHeightScale(item.width);

      const opacity = this.opacityScale(this.getImportance(item));

      graphics.lineStyle(0, 0, 0);

      graphics.beginFill(0x3d8cd9, opacity);
      graphics.drawCircle(startX, startY, this.pointSize);
      graphics.endFill();

      graphics.beginFill(0xc17da5, opacity);
      graphics.drawCircle(endX, endY, this.pointSize);
      graphics.endFill();

      if (
        item.start <= this.focusRegion[1] &&
        item.end >= this.focusRegion[0] &&
        (item.start >= this.focusRegion[0] || item.end <= this.focusRegion[1])
      ) {
        graphics.lineStyle(this.pointSize, 0xc17da5, opacity);
        graphics.moveTo(startX, endY);
        graphics.lineTo(endX, endY);
        graphics.endFill();
      }
    }

    drawCircle(graphics, item, opacityScale, storePolyStr) {
      const x1 = this._xScale(item.start);
      const x2 = this._xScale(item.end);
      const [trackWidth, trackHeight] = this.dimensions;
      const [, trackY] = this.position;

      const h = (x2 - x1) / 2;
      const d = (x2 - x1) / 2;
      const r = (d * d + h * h) / (2 * h);
      const cx = (x1 + x2) / 2;
      let cy = trackHeight - h + r;

      let polyStr = '';

      if (storePolyStr) {
        polyStr += `M${x1},${trackY + trackHeight}`;
      }

      graphics.moveTo(x1, trackY + trackHeight);

      const limitX1 = Math.max(0, x1);
      const limitX2 = Math.min(trackWidth, x2);

      let color = this.markColor;
      let size = this.markSize;
      let opacity = this.markOpacity;

      if (
        item.start <= this.focusRegion[1] &&
        item.end >= this.focusRegion[0] &&
        (item.start >= this.focusRegion[0] || item.end <= this.focusRegion[1])
      ) {
        color = this.markColorFocus;
        size = this.markSizeFocus;
        opacity = this.markOpacityFocus;
      }

      graphics.lineStyle(size, color, opacity);

      const startAngle = Math.acos(
        Math.min(Math.max(-(limitX1 - cx) / r, -1), 1)
      );
      let endAngle = Math.acos(Math.min(Math.max(-(limitX2 - cx) / r, -1), 1));

      if (this.options.flip) {
        cy = 0;
        endAngle = -Math.PI;
        graphics.moveTo(x1, 0);
        if (storePolyStr) polyStr += `M${x1},0`;
      }

      const resolution = 10;
      const angleScale = scaleLinear()
        .domain([0, resolution - 1])
        .range([startAngle, endAngle]);

      for (let k = 0; k < resolution; k++) {
        const ax = r * Math.cos(angleScale(k));
        const ay = r * Math.sin(angleScale(k));

        const rx = cx - ax;
        const ry = cy - ay;

        graphics.lineTo(rx, ry);
        if (storePolyStr) polyStr += `L${rx},${ry}`;
      }

      if (storePolyStr) {
        this.polys.push({
          polyStr,
          opacity,
        });
      }
    }

    drawEllipse(graphics, item, heightScale, opacityScale, storePolyStr) {
      const x1 = this._xScale(item.start);
      const x2 = this._xScale(item.end);
      const [, trackHeight] = this.dimensions;

      const h = this.heightScale(item.width);
      const w = x2 - x1;
      const r = w / 2;

      const cx = (x1 + x2) / 2;
      let cy = trackHeight;
      const startAngle = 0;
      let endAngle = Math.PI;

      let polyStr = '';
      if (storePolyStr) polyStr += `M${x1},${trackHeight}`;
      graphics.moveTo(x1, trackHeight);

      if (this.options.flip) {
        cy = 0;
        endAngle = -Math.PI;
        graphics.moveTo(x1, 0);
        if (storePolyStr) polyStr += `M${x1},0`;
      }

      let color = this.markColor;
      let size = this.markSize;
      let opacity = this.markOpacity;

      if (
        item.start <= this.focusRegion[1] &&
        item.end >= this.focusRegion[0] &&
        (item.start >= this.focusRegion[0] || item.end <= this.focusRegion[1])
      ) {
        color = this.markColorFocus;
        size = this.markSizeFocus;
        opacity = this.markOpacityFocus;
      }

      graphics.lineStyle(size, color, opacity);

      const resolution = Math.round(Math.abs(w) / 200) * 10;

      const angleScale = scaleLinear()
        .domain([0, resolution - 1])
        .range([startAngle, endAngle]);

      for (let k = 0; k < resolution; k++) {
        const ax = r * Math.cos(angleScale(k));
        const ay = h * Math.sin(angleScale(k));

        const rx = cx - ax;
        const ry = cy - ay;

        graphics.lineTo(rx, ry);
        if (storePolyStr) polyStr += `L${rx},${ry}`;
      }

      if (storePolyStr) {
        this.polys.push({
          polyStr,
          opacity,
        });
      }
    }

    getMouseOverHtml() {}

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

  return new ScalableArcs1dTrack(...args);
};

const icon =
  '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="1.5"><path d="M4 2.1L.5 3.5v12l5-2 5 2 5-2v-12l-5 2-3.17-1.268" fill="none" stroke="currentColor"/><path d="M10.5 3.5v12" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-dasharray="1,2,0,0"/><path d="M5.5 13.5V6" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-width=".9969299999999999" stroke-dasharray="1.71,3.43,0,0"/><path d="M9.03 5l.053.003.054.006.054.008.054.012.052.015.052.017.05.02.05.024 4 2 .048.026.048.03.046.03.044.034.042.037.04.04.037.04.036.042.032.045.03.047.028.048.025.05.022.05.02.053.016.053.014.055.01.055.007.055.005.055v.056l-.002.056-.005.055-.008.055-.01.055-.015.054-.017.054-.02.052-.023.05-.026.05-.028.048-.03.046-.035.044-.035.043-.038.04-4 4-.04.037-.04.036-.044.032-.045.03-.046.03-.048.024-.05.023-.05.02-.052.016-.052.015-.053.012-.054.01-.054.005-.055.003H8.97l-.053-.003-.054-.006-.054-.008-.054-.012-.052-.015-.052-.017-.05-.02-.05-.024-4-2-.048-.026-.048-.03-.046-.03-.044-.034-.042-.037-.04-.04-.037-.04-.036-.042-.032-.045-.03-.047-.028-.048-.025-.05-.022-.05-.02-.053-.016-.053-.014-.055-.01-.055-.007-.055L4 10.05v-.056l.002-.056.005-.055.008-.055.01-.055.015-.054.017-.054.02-.052.023-.05.026-.05.028-.048.03-.046.035-.044.035-.043.038-.04 4-4 .04-.037.04-.036.044-.032.045-.03.046-.03.048-.024.05-.023.05-.02.052-.016.052-.015.053-.012.054-.01.054-.005L8.976 5h.054zM5 10l4 2 4-4-4-2-4 4z" fill="currentColor"/><path d="M7.124 0C7.884 0 8.5.616 8.5 1.376v3.748c0 .76-.616 1.376-1.376 1.376H3.876c-.76 0-1.376-.616-1.376-1.376V1.376C2.5.616 3.116 0 3.876 0h3.248zm.56 5.295L5.965 1H5.05L3.375 5.295h.92l.354-.976h1.716l.375.975h.945zm-1.596-1.7l-.592-1.593-.58 1.594h1.172z" fill="currentColor"/></svg>';

createScalableArcs1dTrack.config = {
  type: '1d-arc-indicators',
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

export default createScalableArcs1dTrack;
