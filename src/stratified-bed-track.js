import createIntervalTree from 'interval-tree-1d';
import { contains, dashedXLineTo } from './utils';

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

  const opacityLogScale = scaleLog()
    .domain([1, 10])
    .range([0.1, 1])
    .clamp(true);

  class StratifiedBedTrack extends HGC.tracks.HorizontalLine1DPixiTrack {
    constructor(context, options) {
      super(context, options);

      this.updateOptions();
    }

    initTile(tile) {
      const is2d = getIs2d(tile);
      const getItemWidth = is2d ? get2dItemWidth : get1dItemWidth;
      const getStart = is2d ? get2dStart : get1dStart;
      const getEnd = is2d ? get2dEnd : get1dEnd;

      const intervals = [];

      tile.tileData.forEach((item, i) => {
        item.width = getItemWidth(item);
        item.start = getStart(item);
        item.end = getEnd(item);
        item.regionId = getRegionId(item);
        item.isLeftToRight = item.start < item.end;
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
          const cat = category.toLowerCase();
          this.categoryToGroup.set(cat, i);
          this.categoryToY.set(cat, k + j);
          this.yToCategory.set(k + j, cat);
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

      this.getImportance = this.options.importanceField
        ? (item) => +item.fields[this.options.importanceField]
        : (item) => item.width;

      this.opacityEncoding = this.options.opacityEncoding || 'solid';

      switch (this.opacityEncoding) {
        case 'frequency':
          this.opacityScale = () => 0.1;
          break;

        case 'highestImportance':
        case 'closestImportance': {
          const importanceDomain = this.options.importanceDomain || [1000, 1];
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

      this.maxWidth = getMaxWidth(this.fetchedTiles);

      this.heightScale = scaleLinear()
        .domain([0, this.maxWidth])
        .range([Math.min(12, height / 10), height]);

      this.categoryHeightScale = scaleLinear()
        .domain([0, this.numCategories])
        .range([0, this.numCategories * this.rowHeight]);

      this.valueScale = scaleLinear()
        .domain([0, this.maxWidth])
        .range([height, 0]);

      this.valueScaleInverted = scaleLinear()
        .domain([0, this.maxWidth])
        .range([0, height]);
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

    itemToIndicatorReducer(filterFn, addFn) {
      if (this.focusStyle === 'highlighting') {
        return (filteredItems, item) => {
          filterFn(item);
          addFn(filteredItems, item);
          return filteredItems;
        };
      }

      return (filteredItems, item) => {
        if (filterFn(item)) addFn(filteredItems, item);
        return filteredItems;
      };
    }

    renderIndicatorPoints() {
      this.drawnAtScale = scaleLinear()
        .domain([...this.xScale().domain()])
        .range([...this.xScale().range()]);

      const isHighlighting =
        this.focusStyle === 'highlighting' &&
        ((this.focusGene && this.getGene) ||
          (this.focusRegion && this.getRegion));

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
            item.width < accumulator[item.regionId].__item.width
          ) {
            accumulator[item.regionId] = this.itemToIndicatorCategory(
              item,
              isHighlighting
            );
          }
        };
      }

      const filterFn = this.isItemInFocus();
      const dataToPoint = this.itemToIndicatorReducer(filterFn, addFn);

      const points = Object.values(this.fetchedTiles).flatMap((tile) =>
        Object.values(tile.tileData.reduce(dataToPoint, reducerVar))
      );

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

        if (this.options.focusStyle === 'highlighting') {
          this.pAxis.beginFill(0xffffff, 0.66);
        } else {
          this.pAxis.beginFill(this.groupToColor.get(i)[1], 0.66);
        }

        this.pAxis.lineStyle(0);
        if (this.axisAlign === 'right') {
          this.pAxis.drawRect(
            labelPixiText.x - labelPixiText.width,
            labelPixiText.y - labelPixiText.height / 2,
            labelPixiText.width,
            labelPixiText.height
          );
        } else {
          this.pAxis.drawRect(
            labelPixiText.x,
            labelPixiText.y - labelPixiText.height / 2,
            labelPixiText.width,
            labelPixiText.height
          );
        }
        this.pAxis.endFill();

        if (numAxisLabels < i + 1) {
          this.pAxis.addChild(labelPixiText);
        }

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

    updateIndicators() {
      this.renderIndicatorCategoryAxis(this.valueScaleInverted);
      this.renderIndicatorPoints();
    }

    // Called whenever a new tile comes in
    updateExistingGraphics() {
      if (!this.hasFetchedTiles()) return;
      this.updateScales();
      this.updateIndicators();
    }

    // Gets called on every draw call
    drawTile(tile, storePolyStr) {
      tile.graphics.clear();

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
      const tileId = this.tileToLocalId([
        zoomLevel,
        Math.floor(this._xScale.invert(trackX) / tileWidth),
      ]);
      const fetchedTile = this.fetchedTiles[tileId];

      if (!fetchedTile) return '';

      const category = this.yToCategory.get(
        Math.floor(this.categoryHeightScale.invert(trackY))
      );

      const xAbsLo = this._xScale.invert(trackX - 1);
      const xAbsHi = this._xScale.invert(trackX + 1);

      let foundItem;
      fetchedTile.intervalTree.queryInterval(xAbsLo, xAbsHi, (interval) => {
        const item = fetchedTile.tileData[interval[2]];
        if (this.getCategory(item) === category) {
          foundItem = item;
          return true;
        }
        return false;
      });

      if (foundItem) {
        const [color, bg] = this.groupToColor.get(
          this.categoryToGroup.get(category)
        );
        const colorHex = `#${color.toString(16)}`;
        const bgHex = `#${bg.toString(16)}`;
        const value = this.getImportance(foundItem).toFixed(2);
        return `<div style="margin: -0.25rem; padding: 0 0.25rem; background: ${bgHex}"><strong style="color: ${colorHex};">${category}:</strong> ${value}</div>`;
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

      base.setAttribute('class', 'exported-arcs-track');
      const output = document.createElement('g');

      track.appendChild(output);
      output.setAttribute(
        'transform',
        `translate(${this.position[0]},${this.position[1]})`
      );

      this.visibleAndFetchedTiles().forEach((tile) => {
        this.polys = [];

        // call drawTile with storePolyStr = true so that
        // we record path strings to use in the SVG
        this.drawTile(tile, true);

        for (const { polyStr, opacity } of this.polys) {
          const g = document.createElement('path');
          g.setAttribute('fill', 'transparent');
          g.setAttribute('opacity', opacity);

          g.setAttribute('d', polyStr);
          output.appendChild(g);
        }
      });
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
