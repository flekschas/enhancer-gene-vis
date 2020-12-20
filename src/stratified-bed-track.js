import createIntervalTree from 'interval-tree-1d';
import { identity } from '@flekschas/utils';

import {
  DEFAULT_COLOR_MAP,
  DEFAULT_COLOR_MAP_DARK,
  DEFAULT_COLOR_MAP_LIGHT,
  EPS,
} from './constants';
import { contains, dashedXLineTo, toFixed } from './utils';

const VS = `
  precision mediump float;
  attribute vec2 aPosition;
  attribute float aOpacity;
  attribute float aHighlight;

  uniform mat3 projectionMatrix;
  uniform mat3 translationMatrix;
  uniform float uPointSize;

  varying float vHighlight;
  varying float vOpacity;

  void main(void)
  {
    vHighlight = aHighlight;
    vOpacity = aOpacity;
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    gl_PointSize = uPointSize;
  }
`;

const FS = `
  precision mediump float;

  uniform vec4 uColor;
  uniform vec4 uColorHighlight;

  varying float vHighlight;
  varying float vOpacity;

  void main() {
    float isNotFocused = 1.0 - vHighlight;

    float r = uColor.r * isNotFocused + uColorHighlight.r * vHighlight;
    float g = uColor.g * isNotFocused + uColorHighlight.g * vHighlight;
    float b = uColor.b * isNotFocused + uColorHighlight.b * vHighlight;

    gl_FragColor = vec4(r, g, b, 1.0) * vOpacity;
  }
`;

// prettier-ignore
const pointToPosition = (pt) => [
  // top-left
  pt.cX - pt.widthHalf, pt.y,
  // top-right
  pt.cX + pt.widthHalf, pt.y,
  // bottom-right
  pt.cX + pt.widthHalf, pt.y + pt.height,
  // pt.cX + pt.widthHalf, pt.y + pt.height,
  // bottom-left
  pt.cX - pt.widthHalf, pt.y + pt.height,
  // pt.cX - pt.widthHalf, pt.y,
];

const pointToIndex = (pt, i) => {
  const base = i * 4;
  return [base, base + 1, base + 2, base + 2, base + 3, base];
};

const pointToOpacity = (pt) => [pt.opacity, pt.opacity, pt.opacity, pt.opacity];

const pointToHighlight = (pt) => [
  pt.highlight,
  pt.highlight,
  pt.highlight,
  pt.highlight,
];

const getItemDistance = (item) =>
  Math.abs(
    +item.fields[1] +
      (+item.fields[2] - +item.fields[1]) / 2 -
      (+item.fields[4] + (+item.fields[4] - +item.fields[5]) / 2)
  );

const getMaxDistance = (fetchedTiles) =>
  Object.values(fetchedTiles).reduce(
    (maxDist, tile) =>
      Math.max(
        maxDist,
        tile.tileData.reduce(
          (maxDistItem, item) => Math.max(maxDistItem, item.distance),
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

const getRegionId = (item) =>
  `${item.fields[0]}:${item.fields[1]}-${item.fields[2]}`;

const createStratifiedBedTrack = function createStratifiedBedTrack(
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
  const { tileProxy } = HGC.services;
  const { MAX_CLICK_DELAY } = HGC.configs;

  const opacityLogScale = scaleLog()
    .domain([1, 10])
    .range([0.1, 1])
    .clamp(true);

  class StratifiedBedTrack extends HGC.tracks.HorizontalLine1DPixiTrack {
    constructor(context, options) {
      super(context, options);

      this.pLegend = new PIXI.Graphics();
      this.pMasked.addChild(this.pLegend);

      this.legendMin = Infinity;
      this.legendMax = -Infinity;

      // Needed for interaction tracking because interaction tracking on the
      // mesh causes errors...
      this.bg = new PIXI.Sprite(PIXI.Texture.WHITE);
      [this.bg.width, this.bg.height] = this.dimensions;
      this.bg.interactive = true;
      this.bg.interactiveChildren = false;
      this.bg.alpha = 0;

      let mousedownTime = performance.now();
      this.bg.mousedown = () => {
        mousedownTime = performance.now();
      };
      this.bg.mouseup = (e) => {
        if (performance.now() - mousedownTime < MAX_CLICK_DELAY)
          this.clickHandler(e);
      };

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
      const intervals = [];

      tile.tileData.forEach((item, i) => {
        item.distance = getItemDistance(item) || -1;
        item.cX = item.xStart + (item.xEnd - item.xStart) / 2;
        item.regionId = getRegionId(item);
        item.isLeftToRight = item.xStart < item.xEnd;
        intervals.push([item.xStart, item.xEnd, i]);
      });

      tile.intervalTree = createIntervalTree(intervals);
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
      this.getCategory = (item) =>
        item.fields[this.categoryField].toLowerCase();
      this.categoryToGroup = new Map();
      this.categoryToY = new Map();
      this.yToCategory = new Map();
      this.groupToColor = new Map();

      this.groupSizes = this.options.stratification.groups.map(
        (group) =>
          group.categories.filter((category) => this.isIncluded(category))
            .length
      );
      this.filteredGroups = this.options.stratification.groups.filter(
        (group, i) => this.groupSizes[i] > 0
      );
      this.numGroups = this.filteredGroups.length;
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
            group.color || DEFAULT_COLOR_MAP[i % DEFAULT_COLOR_MAP.length]
          ),
          HGC.utils.colorToHex(
            group.backgroundColor ||
              DEFAULT_COLOR_MAP_LIGHT[i % DEFAULT_COLOR_MAP.length]
          ),
        ]);
        group.categories
          .filter((category) => this.isIncluded(category))
          .forEach((category, j) => {
            const cat = category.toLowerCase();
            this.categoryToGroup.set(cat, i);
            this.categoryToY.set(cat, k + j);
            this.yToCategory.set(k + j, cat);
          });
        k += this.groupSizes[i];
      });

      this.groupLabelsPixiText = this.groupLabels.map(
        (label, i) =>
          new PIXI.Text(label, {
            fontSize: this.labelSize,
            align: this.axisAlign === 'right' ? 'right' : 'left',
            fill: HGC.utils.colorToHex(
              this.options.stratification.groups[i].axisLabelColor ||
                DEFAULT_COLOR_MAP_DARK[i % DEFAULT_COLOR_MAP_DARK.length]
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
      this.markMinWidth = this.options.markMinWidth || this.markSize;
      this.markHeight = this.options.markHeight || this.markSize;

      this.rowHeight = this.options.rowHeight || this.markHeight;

      this.markColorHighlight = HGC.utils.colorToHex(
        this.options.markColorHighlight || 'red'
      );

      this.markColorHighlightRgbNorm = this.options.markColorHighlight
        ? HGC.utils
            .colorToRgba(this.options.markColorHighlight)
            .slice(0, 3)
            .map((x) => Math.min(1, Math.max(0, x / 255)))
        : [1, 0, 0];

      this.markColorDehighlight = HGC.utils.colorToHex(
        this.options.markColorDehighlight || '#999999'
      );

      this.markColorDehighlightRgbNorm = this.options.markColorDehighlight
        ? HGC.utils
            .colorToRgba(this.options.markColorDehighlight)
            .slice(0, 3)
            .map((x) => Math.min(1, Math.max(0, x / 255)))
        : [0.6, 0.6, 0.6];

      this.markOpacityFocus = Number.isNaN(+this.options.markOpacityFocus)
        ? this.markOpacity
        : Math.min(1, Math.max(0, +this.options.markOpacityFocus));

      this.inclusion = this.options.inclusion
        ? this.options.inclusion.reduce((s, include) => {
            s.add(include);
            return s;
          }, new Set())
        : null;

      this.getInclusionField = this.options.inclusionField
        ? (item) => item.fields[this.options.inclusionField]
        : null;

      this.isIncluded =
        this.options.inclusionField && this.inclusion
          ? (inclusionField) => this.inclusion.has(inclusionField)
          : () => true;

      this.getImportance = this.options.importanceField
        ? (item) => +item.fields[this.options.importanceField]
        : (item) => item.distance;

      this.opacityEncoding = this.options.opacityEncoding || 'solid';

      switch (this.opacityEncoding) {
        case 'frequency':
          this.opacityScale = () => 0.1;
          break;

        case 'highestImportance':
        case 'closestImportance': {
          const importanceDomain = this.options.importanceDomain || [1, 1000];
          const opacityLinearScale = scaleLinear()
            .domain(importanceDomain)
            .range([1, 10]);
          this.opacityScale = (x) => opacityLogScale(opacityLinearScale(x));
          break;
        }

        case 'solid':
        default:
          this.opacityScale = () => 1;
          break;
      }

      this.focusRegion = this.options.focusRegion
        ? this.options.focusRegion
        : [Infinity, Infinity];

      this.getRegion = this.options.focusRegion
        ? (item) => [item.xStart, item.xEnd]
        : undefined;

      this.focusGene = this.options.focusGene
        ? this.options.focusGene.toLowerCase()
        : undefined;

      this.getGene = this.options.geneField
        ? (item) => item.fields[this.options.geneField].toLowerCase()
        : undefined;

      this.focusStyle = this.options.focusStyle
        ? this.options.focusStyle.toLowerCase()
        : undefined;

      this.minImportance = this.options.minImportance || 0;

      this.updateStratificationOption();
    }

    rerender(newOptions) {
      this.options = newOptions;
      this.updateOptions();
      this.updateExistingGraphics();
    }

    hasFetchedTiles() {
      return Object.values(this.fetchedTiles).length;
    }

    updateScales() {
      const fetchedTiles = Object.values(this.fetchedTiles);

      if (!fetchedTiles.length) return;

      const [, height] = this.dimensions;

      this.maxDist = getMaxDistance(this.fetchedTiles);

      this.heightScale = scaleLinear()
        .domain([0, this.maxDist])
        .range([Math.min(12, height / 10), height]);

      this.categoryHeightScale = scaleLinear()
        .domain([0, this.numCategories])
        .range([0, this.numCategories * this.rowHeight]);

      this.valueScale = scaleLinear()
        .domain([0, this.maxDist])
        .range([height, 0]);

      this.valueScaleInverted = scaleLinear()
        .domain([0, this.maxDist])
        .range([0, height]);
    }

    itemToIndicatorCategory(item, isHighlighting) {
      return {
        cX: this._xScale(item.cX),
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

    isItemInFocus() {
      if (
        this.getGene &&
        this.focusGene &&
        this.getRegion &&
        this.focusRegion
      ) {
        return (item) => {
          item.__focus =
            this.getGene(item) === this.focusGene &&
            contains(this.getRegion(item), this.focusRegion);
          return item.__focus;
        };
      }

      if (this.getGene && this.focusGene) {
        return (item) => {
          item.__focus = this.getGene(item) === this.focusGene;
          return item.__focus;
        };
      }

      if (this.getRegion && this.focusRegion) {
        return (item) => {
          item.__focus = contains(this.getRegion(item), this.focusRegion);
          return item.__focus;
        };
      }

      return (item) => {
        item.__focus = false;
        // If no focus was defined, we include all intervals
        return true;
      };
    }

    itemToIndicatorReducer(focusFilterFn, addFn) {
      if (this.focusStyle === 'highlighting') {
        return (filteredItems, item, i) => {
          focusFilterFn(item);
          if (this.isIncluded(this.getInclusionField(item)))
            addFn(filteredItems, item);
          return filteredItems;
        };
      }

      return (filteredItems, item) => {
        if (
          focusFilterFn(item) &&
          this.isIncluded(this.getInclusionField(item))
        )
          addFn(filteredItems, item);
        return filteredItems;
      };
    }

    getPoints(isHighlighting) {
      let reducerVar = [];
      let addFn = (accumulator, item) =>
        accumulator.push(this.itemToIndicatorCategory(item, isHighlighting));

      if (this.opacityEncoding === 'highestImportance') {
        reducerVar = {};
        addFn = (accumulator, item) => {
          if (accumulator[item.regionId]) {
            const i1 = this.getImportance(accumulator[item.regionId].__item);
            const i2 = this.getImportance(item);
            if (i2 > i1) {
              accumulator[item.regionId] = this.itemToIndicatorCategory(
                item,
                isHighlighting
              );
            }
          } else {
            accumulator[item.regionId] = this.itemToIndicatorCategory(
              item,
              isHighlighting
            );
          }
        };
      } else if (this.opacityEncoding === 'closestImportance') {
        reducerVar = {};
        addFn = (accumulator, item) => {
          if (
            !accumulator[item.regionId] ||
            item.distance < accumulator[item.regionId].__item.distance
          ) {
            accumulator[item.regionId] = this.itemToIndicatorCategory(
              item,
              isHighlighting
            );
          }
        };
      }

      const focusFilterFn = this.isItemInFocus();
      const dataToPoint = this.itemToIndicatorReducer(focusFilterFn, addFn);

      return Object.values(this.fetchedTiles).flatMap((tile) =>
        Object.values(tile.tileData.reduce(dataToPoint, reducerVar))
      );
    }

    renderIndicatorPoints() {
      this.drawnAtScale = scaleLinear()
        .domain([...this.xScale().domain()])
        .range([...this.xScale().range()]);

      const isHighlighting = !!(
        this.focusStyle === 'highlighting' &&
        ((this.focusGene && this.getGene) ||
          (this.focusRegion && this.getRegion))
      );

      const points = this.getPoints(isHighlighting);

      const positions = new Float32Array(points.flatMap(pointToPosition));
      const indices = new Uint16Array(points.flatMap(pointToIndex));
      const opacities = new Float32Array(points.flatMap(pointToOpacity));
      const highlights = new Float32Array(points.flatMap(pointToHighlight));

      const uniforms = new PIXI.UniformGroup({
        uColor: isHighlighting
          ? [...this.markColorDehighlightRgbNorm, this.markOpacity]
          : [...this.markColorRgbNorm, this.markOpacity],
        uColorHighlight: [...this.markColorHighlightRgbNorm, this.markOpacity],
        uHighlighting: isHighlighting,
      });

      const shader = PIXI.Shader.from(VS, FS, uniforms);

      const geometry = new PIXI.Geometry();
      geometry.addAttribute('aPosition', positions, 2);
      geometry.addAttribute('aOpacity', opacities, 1);
      geometry.addAttribute('aHighlight', highlights, 1);
      geometry.addIndex(indices);

      const mesh = new PIXI.Mesh(geometry, shader);

      const newGraphics = new PIXI.Graphics();
      newGraphics.addChild(this.bg);
      newGraphics.addChild(mesh);

      [this.bg.width, this.bg.height] = this.dimensions;

      // eslint-disable-next-line
      this.pMain.x = this.position[0];

      if (this.indicatorPointGraphics) {
        this.indicatorPointGraphics.removeChild(this.bg);
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
        if (numAxisLabels < i + 1) {
          this.pAxis.addChild(labelPixiText);
        }

        // Don't ask me why but somehow after `labelPixiText` was added to
        // `this.pAxis` the object is not the same as `this.pAxis.children[i]`
        // anymore and subsequent changes were ineffective
        const text = this.pAxis.children[i];

        if (this.groupSizes[i] === 0) {
          text.alpha = 0;
          return;
        }

        const height = this.categoryHeightScale(this.groupSizes[i]);
        yEnd += height;
        text.x = xLabelOffset;
        text.y = yStart + height / 2;
        text.anchor.x = this.axisAlign === 'right' ? 1 : 0;
        text.anchor.y = 0.5;
        text.alpha = 1;

        if (this.options.focusStyle === 'highlighting') {
          this.pAxis.beginFill(0xffffff, 0.66);
        } else {
          this.pAxis.beginFill(this.groupToColor.get(i)[1], 0.66);
        }

        this.pAxis.lineStyle(0);
        if (this.axisAlign === 'right') {
          this.pAxis.drawRect(
            text.x - text.width,
            text.y - text.height / 2,
            text.width,
            text.height
          );
        } else {
          this.pAxis.drawRect(
            text.x,
            text.y - text.height / 2,
            text.width,
            text.height
          );
        }
        this.pAxis.endFill();

        this.pAxis.lineStyle(1, 0x000000, 1.0, 0.0);
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

    renderIndicatorLegend() {
      this.pLegend.clear();

      if (this.opacityEncoding.indexOf('Importance') === -1) {
        if (this.legendMinText) {
          this.pLegend.removeChild(this.legendMinText);
          this.legendMinText.destroy();
          this.legendMinText = undefined;
        }
        if (this.legendMaxText) {
          this.pLegend.removeChild(this.legendMaxText);
          this.legendMaxText.destroy();
          this.legendMaxText = undefined;
        }
        return;
      }

      const padding = 6;
      const [width] = this.dimensions;
      const [left, top] = this.position;
      const [, y] = this.categoryHeightScale.range();
      const isRightAligned = this.options.legendAlign === 'right';
      const isHighlighting = !!(
        this.focusStyle === 'highlighting' &&
        ((this.focusGene && this.getGene) ||
          (this.focusRegion && this.getRegion))
      );

      this.pLegend.position.x = isRightAligned ? left + width : left;

      const [minValue, maxValue] = this.options.importanceDomain || [1, 1000];

      if (Math.abs(minValue - this.legendMin) > EPS) {
        if (this.legendMinText) {
          this.pLegend.removeChild(this.legendMinText);
          this.legendMinText.destroy();
        }
        this.legendMinText = new PIXI.Text(toFixed(minValue, 3), {
          fontSize: this.labelSize,
          align: isRightAligned ? 'right' : 'left',
          fill: 0x808080,
        });
        this.legendMinText.x = 0;
        this.legendMinText.y = padding / 2;
        this.legendMinText.anchor.x = isRightAligned ? 1 : 0;
        this.pLegend.addChild(this.legendMinText);
      }

      if (Math.abs(maxValue - this.legendMax) > EPS) {
        if (this.legendMaxText) {
          this.pLegend.removeChild(this.legendMaxText);
          this.legendMaxText.destroy();
        }
        this.legendMaxText = new PIXI.Text(toFixed(maxValue, 3), {
          fontSize: this.labelSize,
          align: isRightAligned ? 'right' : 'left',
          fill: 0x808080,
        });
        this.legendMaxText.x = 0;
        this.legendMaxText.y = padding / 2;
        this.legendMaxText.anchor.x = isRightAligned ? 1 : 0;
        this.pLegend.addChild(this.legendMaxText);
      }

      const legendRectWidth = 42;
      const minTextWidth = this.legendMinText.getBounds().width;
      const maxTextWidth = this.legendMaxText.getBounds().width;
      const offset = isRightAligned
        ? -(maxTextWidth + legendRectWidth + padding)
        : minTextWidth + 2 * padding;

      const rectHeight = 18 + (isHighlighting * padding) / 2;

      this.pLegend.beginFill(0xffffff);
      this.pLegend.lineStyle(1, 0xcccccc);
      if (isRightAligned) {
        this.legendMinText.x = offset - padding;
        this.pLegend.drawRoundedRect(
          -(legendRectWidth + minTextWidth + maxTextWidth + 3 * padding + 0.5),
          0,
          legendRectWidth + minTextWidth + maxTextWidth + 3 * padding,
          rectHeight,
          3
        );
      } else {
        this.legendMaxText.x = offset + legendRectWidth + 2 * padding;
        this.pLegend.drawRoundedRect(
          0.5,
          0,
          legendRectWidth + minTextWidth + maxTextWidth + 3 * padding,
          18 + (isHighlighting * padding) / 2,
          3
        );
      }
      this.pLegend.endFill();
      this.pLegend.lineStyle(0);

      for (let i = 0; i < 5; i++) {
        const opacity = this.opacityScale(minValue + (i / 4) * maxValue);

        this.pLegend.beginFill(this.markColor, opacity);
        this.pLegend.drawRect(
          i * 9 + offset,
          padding / 2 + !isHighlighting * 3,
          6,
          6
        );
        this.pLegend.endFill();

        if (isHighlighting) {
          this.pLegend.beginFill(this.markColorHighlight, opacity);
          this.pLegend.drawRect(i * 9 + offset, padding / 2 + 9, 6, 6);
          this.pLegend.endFill();
        }
      }

      if (isRightAligned) {
        this.legendMinText.x = offset - padding;
        this.legendMaxText.x = -padding / 2;
      } else {
        this.legendMinText.x = padding / 2;
        this.legendMaxText.x = offset + legendRectWidth + padding;
      }

      this.pLegend.position.y = top + y - padding - rectHeight;
    }

    updateIndicators() {
      this.renderIndicatorCategoryAxis();
      this.renderIndicatorLegend();
      this.renderIndicatorPoints();
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

    // Called whenever a new tile comes in
    updateExistingGraphics() {
      this.updateLoadIndicator();
      if (!this.hasFetchedTiles()) return;
      this.updateScales();
      this.updateIndicators();
    }

    // Gets called on every draw call
    drawTile(tile) {
      tile.graphics.clear();

      this.updateLoadIndicator();

      if (!this.options.stratification.axisNoGroupColor) {
        let yStart = 0;
        let yEnd = 0;
        this.groupSizes.forEach((size, i) => {
          yEnd += this.categoryHeightScale(size);

          tile.graphics.beginFill(this.groupToColor.get(i)[1]);
          tile.graphics.drawRect(
            0,
            yStart,
            this.dimensions[0],
            Math.abs(yEnd - yStart)
          );

          yStart = yEnd;
        });
        tile.graphics.endFill();
      }
    }

    getElementAtPosition(relX, relY) {
      if (!this.tilesetInfo) return undefined;

      const zoomLevel = this.calculateZoomLevel();
      const tileWidth = tileProxy.calculateTileWidth(
        this.tilesetInfo,
        zoomLevel,
        this.tilesetInfo.tile_size
      );

      // the position of the tile containing the query position
      const tileId = this.tileToLocalId([
        zoomLevel,
        Math.floor(this._xScale.invert(relX) / tileWidth),
      ]);
      const fetchedTile = this.fetchedTiles[tileId];

      if (!fetchedTile) return undefined;

      const category = this.yToCategory.get(
        Math.floor(this.categoryHeightScale.invert(relY))
      );

      const xAbsLo = this._xScale.invert(relX - 1);
      const xAbsHi = this._xScale.invert(relX + 1);

      let foundItem;
      fetchedTile.intervalTree.queryInterval(xAbsLo, xAbsHi, (interval) => {
        const item = fetchedTile.tileData[interval[2]];
        if (this.getCategory(item) === category) {
          foundItem = item;
          return true;
        }
        return false;
      });

      return {
        item: foundItem,
        category,
        tileId,
      };
    }

    getMouseOverHtml(relX, relY) {
      const element = this.getElementAtPosition(relX, relY);

      if (!element) return '';

      const { item, category } = element;

      if (item) {
        const [color, bg] = this.groupToColor.get(
          this.categoryToGroup.get(category)
        );
        const colorHex = `#${color.toString(16)}`;
        const bgHex = `#${bg.toString(16)}`;
        const value = this.getImportance(item).toFixed(2);
        return `<div style="margin: -0.25rem; padding: 0 0.25rem; background: ${bgHex}"><strong style="color: ${colorHex};">${category}:</strong> ${value}</div>`;
      }

      return '';
    }

    clickHandler(event) {
      const [offsetX, offsetY] = this.position;
      const relX = event.data.global.x - offsetX;
      const relY = event.data.global.y - offsetY;

      const element = this.getElementAtPosition(relX, relY);

      if (element) {
        this.pubSub.publish('app.click', {
          type: 'annotation',
          event,
          payload: element,
        });
      }
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

    refreshTiles() {
      super.refreshTiles();
      this.updateLoadIndicator();
    }

    renderIndicatorCategoryAxisAsSvg() {
      const gAxis = document.createElement('g');
      gAxis.setAttribute('id', 'axis');

      const [width] = this.dimensions;
      const [left, top] = this.position;

      this.pAxis.position.x = this.axisAlign === 'right' ? left + width : left;
      this.pAxis.position.y = top;

      gAxis.setAttribute(
        'transform',
        `translate(${this.pAxis.position.x}, ${this.pAxis.position.y})`
      );

      let yStart = 0;
      let yEnd = 0;

      const xTickOffset = this.axisAlign === 'right' ? -5 : 5;
      const xTickEnd = this.axisAlign === 'right' ? -width : width;
      const xLabelOffset = this.axisAlign === 'right' ? -3 : 3;

      const createRect = (x, y, w, h, f, o) => {
        const r = document.createElement('rect');

        r.setAttribute('x', x);
        r.setAttribute('y', y);
        r.setAttribute('width', w);
        r.setAttribute('height', h);
        r.setAttribute('fill', f);
        r.setAttribute('fill-opacity', o);
        r.setAttribute('stroke-width', 0);

        return r;
      };

      const createText = (pixiText) => {
        const t = document.createElement('text');

        t.setAttribute('x', pixiText.x);
        t.setAttribute('y', pixiText.y + pixiText.height / (4 / 1));
        t.setAttribute('fill', pixiText._style._fill);
        t.setAttribute(
          'text-anchor',
          pixiText._style._align === 'right' ? 'end' : 'start'
        );
        t.setAttribute('style', `font: ${pixiText._font};`);

        t.textContent = pixiText.text;

        return t;
      };

      const createLine = ({
        stroke = '#000000',
        strokeWidth = 1,
        strokeDasharray = null,
      } = {}) => (x1, y1, x2, y2) => {
        const l = document.createElement('line');

        l.setAttribute('x1', x1);
        l.setAttribute('y1', y1);
        l.setAttribute('x2', x2);
        l.setAttribute('y2', y2);
        l.setAttribute('stroke', stroke);
        l.setAttribute('stroke-width', strokeWidth);

        if (strokeDasharray)
          l.setAttribute('stroke-dasharray', strokeDasharray);

        return l;
      };

      const createDashedLine = createLine({ strokeDasharray: '5' });

      const isHighlighting = this.options.focusStyle === 'highlighting';
      const backgroundOpacity = 0.66;

      this.groupLabelsPixiText.forEach((labelPixiText, i) => {
        const height = this.categoryHeightScale(this.groupSizes[i]);
        yEnd += height;
        labelPixiText.x = xLabelOffset;
        labelPixiText.y = yStart + height / 2;

        // Background color
        const backgroundColor = isHighlighting
          ? '#ffffff'
          : `#${this.groupToColor.get(i)[1].toString(16)}`;

        if (this.axisAlign === 'right') {
          gAxis.appendChild(
            createRect(
              labelPixiText.x - labelPixiText.width,
              labelPixiText.y - labelPixiText.height / (4 / 1),
              labelPixiText.width,
              labelPixiText.height,
              backgroundColor,
              backgroundOpacity
            )
          );
        } else {
          gAxis.appendChild(
            createRect(
              labelPixiText.x,
              labelPixiText.y - labelPixiText.height / (4 / 1),
              labelPixiText.width,
              labelPixiText.height,
              backgroundColor,
              backgroundOpacity
            )
          );
        }

        gAxis.appendChild(createText(labelPixiText));

        gAxis.appendChild(createLine()(0, yStart, xTickOffset, yStart));

        if (this.options.stratification.axisShowGroupSeparator) {
          gAxis.appendChild(createDashedLine(0, yStart, xTickEnd, yStart));
        }

        yStart = yEnd;
      });

      gAxis.appendChild(createLine()(0, 0, 0, yEnd));

      if (this.options.stratification.axisShowGroupSeparator) {
        gAxis.appendChild(createDashedLine(0, yEnd, xTickEnd, yEnd));
      }

      return gAxis;
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

      base.setAttribute('class', 'exported-stratified-bed-track');
      const output = document.createElement('g');

      track.appendChild(output);
      output.setAttribute(
        'transform',
        `translate(${this.position[0]},${this.position[1]})`
      );

      const isHighlighting = !!(
        this.focusStyle === 'highlighting' &&
        ((this.focusGene && this.getGene) ||
          (this.focusRegion && this.getRegion))
      );

      const points = this.getPoints(isHighlighting);
      const color = isHighlighting
        ? this.options.markColorDehighlight || '#999999'
        : this.options.markColor || 'black';
      const colorHighlight = this.options.markColorHighlight || 'red';

      points.forEach(({ cX, y, widthHalf, opacity, highlight, height }, i) => {
        const r = document.createElement('rect');

        r.setAttribute('x', cX - widthHalf);
        r.setAttribute('y', y);
        r.setAttribute('width', widthHalf * 2);
        r.setAttribute('height', height);
        r.setAttribute('fill', highlight ? colorHighlight : color);
        r.setAttribute('fill-opacity', opacity);
        r.setAttribute('stroke-width', 0);

        output.appendChild(r);
      });

      base.appendChild(this.renderIndicatorCategoryAxisAsSvg());

      return [base, track];
    }
  }

  return new StratifiedBedTrack(...args);
};

const icon =
  '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="1.5"><path d="M4 2.1L.5 3.5v12l5-2 5 2 5-2v-12l-5 2-3.17-1.268" fill="none" stroke="currentColor"/><path d="M10.5 3.5v12" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-dasharray="1,2,0,0"/><path d="M5.5 13.5V6" fill="none" stroke="currentColor" stroke-opacity=".33" stroke-width=".9969299999999999" stroke-dasharray="1.71,3.43,0,0"/><path d="M9.03 5l.053.003.054.006.054.008.054.012.052.015.052.017.05.02.05.024 4 2 .048.026.048.03.046.03.044.034.042.037.04.04.037.04.036.042.032.045.03.047.028.048.025.05.022.05.02.053.016.053.014.055.01.055.007.055.005.055v.056l-.002.056-.005.055-.008.055-.01.055-.015.054-.017.054-.02.052-.023.05-.026.05-.028.048-.03.046-.035.044-.035.043-.038.04-4 4-.04.037-.04.036-.044.032-.045.03-.046.03-.048.024-.05.023-.05.02-.052.016-.052.015-.053.012-.054.01-.054.005-.055.003H8.97l-.053-.003-.054-.006-.054-.008-.054-.012-.052-.015-.052-.017-.05-.02-.05-.024-4-2-.048-.026-.048-.03-.046-.03-.044-.034-.042-.037-.04-.04-.037-.04-.036-.042-.032-.045-.03-.047-.028-.048-.025-.05-.022-.05-.02-.053-.016-.053-.014-.055-.01-.055-.007-.055L4 10.05v-.056l.002-.056.005-.055.008-.055.01-.055.015-.054.017-.054.02-.052.023-.05.026-.05.028-.048.03-.046.035-.044.035-.043.038-.04 4-4 .04-.037.04-.036.044-.032.045-.03.046-.03.048-.024.05-.023.05-.02.052-.016.052-.015.053-.012.054-.01.054-.005L8.976 5h.054zM5 10l4 2 4-4-4-2-4 4z" fill="currentColor"/><path d="M7.124 0C7.884 0 8.5.616 8.5 1.376v3.748c0 .76-.616 1.376-1.376 1.376H3.876c-.76 0-1.376-.616-1.376-1.376V1.376C2.5.616 3.116 0 3.876 0h3.248zm.56 5.295L5.965 1H5.05L3.375 5.295h.92l.354-.976h1.716l.375.975h.945zm-1.596-1.7l-.592-1.593-.58 1.594h1.172z" fill="currentColor"/></svg>';

createStratifiedBedTrack.config = {
  type: 'stratified-bed',
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
    'trackBorderWidth',
    'trackBorderColor',
  ],
  defaultOptions: {
    arcStyle: 'ellipse',
    flip1D: 'no',
    labelColor: 'black',
    labelPosition: 'hidden',
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

export default createStratifiedBedTrack;
