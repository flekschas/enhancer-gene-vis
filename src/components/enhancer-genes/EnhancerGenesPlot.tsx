import { identity, range } from '@flekschas/utils';
import {
  axisRight,
  BaseType,
  NumberValue,
  scaleLinear,
  scaleLog,
  select,
  Selection,
  ScaleContinuousNumeric,
} from 'd3';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import TinyQueue from 'tinyqueue';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

import { useChromInfo } from '../../ChromInfoProvider';
import { useShowTooltip } from '../../TooltipProvider';
import {
  Category,
  getCategories,
  getSamples,
} from './enhancer-gene-plot-helper';

import { sampleSelectionState } from '../../state/filter-state';
import {
  focusRegionAbsWithAssembly,
  focusRegionRelState,
  focusRegionState,
  focusRegionStrState,
} from '../../state/focus-state';
import {
  EnhancerGeneCellEncodingType,
  enhancerGenesCellEncodingState,
  enhancerGenesPaddingState,
  enhancerGenesSvgState,
} from '../../state/enhancer-gene-track-state';
import {
  stratificationState,
  sampleIdx,
  sampleGroupSelectionSizesState,
  Stratification,
} from '../../state/stratification-state';

import {
  DEFAULT_COLOR_MAP,
  DEFAULT_COLOR_MAP_DARK,
  DEFAULT_COLOR_MAP_LIGHT,
  GENE_NAME_COLUMN,
} from '../../constants';
import { scaleBand } from '../../utils/scale-band';
import usePrevious from '../../hooks/use-previous';

import './EnhancerGenesPlot.css';
import { BeddbTile, TilesetInfo } from '@higlass/common';
import { ClassNameMap } from '@material-ui/styles';
import { dodge } from './beeswarm';
import { enhancerRegionsTrackState } from '../../state/enhancer-region-state';

type EgPlotData = {
  categoryAggregation: EgPlotCategoryAggregationData;
  genes: EgPlotGeneAggregationData;
  genesDownstreamByDist: EgPlotGeneAggregationValue[];
  genesUpstreamByDist: EgPlotGeneAggregationValue[];
  maxAbsDistance: number;
  maxScore: number;
  minAbsDistance: number;
};

type EgPlotCategoryAggregationData = {
  [key: string]: EgPlotCategoryAggregationValue;
};

type EgPlotCategoryAggregationValue = {
  category: EgPlotCategoryAggregationCategory;
  numEnhancers: number;
  row?: number;
};

type EgPlotCategoryAggregationCategory = {
  index: number;
  name: string;
  size: number;
};

type EgPlotGeneAggregationData = { [key: string]: EgPlotGeneAggregationValue };

type EgPlotGeneAggregationValue = {
  absDistance: number;
  isDownstream: boolean;
  name: string;
  position: number;
  relDistance?: number;
  samplesByCategory: {
    [key: string]: EgPlotGeneAggregationSampleCategoryValue;
  };
};

type EgPlotGeneAggregationSampleCategoryValue =
  EgPlotGeneAggregationSampleCategory[] & {
    maxScore: number;
    size: number;
    maxScoreSample?: EgPlotGeneAggregationSampleCategory;
    row?: number;
  };

type EgPlotGeneAggregationSampleCategory = {
  gene: string;
  sample: string;
  sampleCategory: string;
  score: number;
};

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.grey['300'],
    minHeight: '6rem',
  },
  plot: {
    position: 'relative',
    flexGrow: 1,
  },
  plotSvg: {
    width: '100%',
    height: '100%',
  },
}));

const useTooltipStyles = DEFAULT_COLOR_MAP_LIGHT.map((color, i) =>
  makeStyles((theme) => ({
    arrow: {
      color,
    },
    tooltip: {
      color: DEFAULT_COLOR_MAP_DARK[i],
      backgroundColor: color,
      boxShadow: '0 0 3px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      '& .value': {
        color: 'white',
        background: DEFAULT_COLOR_MAP_DARK[i],
        padding: '0 0.25em',
        borderRadius: '0.25rem',
      },
    },
  }))
);

// TODO: Remove non-null assertion from max_width
const getMinTileSize = (tilesetInfo: TilesetInfo) =>
  tilesetInfo.max_width! / 2 ** tilesetInfo.max_zoom;

const filterIntervalsByRange = (
  tile: BeddbTile[],
  absRange: [number, number]
) => {
  return tile.filter(
    (interval) => interval.xEnd >= absRange[0] && interval.xStart < absRange[1]
  );
};

const plotEnhancerGeneConnections = (
  node: SVGElement,
  width: number,
  data: EgPlotData,
  stratification: Stratification,
  {
    geneCellEncoding = EnhancerGeneCellEncodingType.DISTRIBUTION,
    prevGeneCellEncoding,
    genePadding = false,
    showTooltip = identity,
    tooltipClasses = [],
    classes = undefined,
    position = '',
    focusRegion = null,
  }: {
    geneCellEncoding?: EnhancerGeneCellEncodingType;
    prevGeneCellEncoding?: EnhancerGeneCellEncodingType;
    genePadding?: boolean;
    showTooltip?: Function;
    tooltipClasses?: ClassNameMap[];
    classes?: ClassNameMap;
    position?: string;
    focusRegion?: any;
  } = {}
) => {
  if (!width || !data) return;

  const svg = select(node);
  const categories = getCategories(stratification);
  const samples = getSamples(stratification);

  const paddingTop = 60;
  const paddingBottom = 60;
  const circleRadius = 1;
  const circlePadding = 0.5;
  const rowHeight = 36;
  const geneLabelPadding = 3;
  const beeswarmPadding = 1;
  const distanceBarWidth = 6;
  const distPaddingRange = [0, 20];
  const height =
    Object.values(categories).length * rowHeight + paddingTop + paddingBottom;

  svg.attr('viewbox', `0 0 ${width} ${height}`).attr('height', height);

  const maxCatgorySize = Object.values(data.categoryAggregation).reduce(
    (max: number, cat) => Math.max(max, cat.numEnhancers),
    0
  );

  const categorySizeScale = scaleLog()
    .domain([1, maxCatgorySize])
    .range([2, rowHeight])
    .clamp(true);

  const percentScale = scaleLinear()
    .domain([0, 1])
    .range([0, rowHeight])
    .clamp(true);

  const scoreScale = scaleLinear()
    .domain([0, data.maxScore])
    .range([0, rowHeight])
    .clamp(true);

  const circleYScalePre = scaleLinear()
    .domain([0, 1])
    .range([1, 10])
    .clamp(true);

  const circleYScalePost = scaleLog()
    .domain([1, 10])
    .range([
      rowHeight - circleRadius - beeswarmPadding,
      circleRadius + beeswarmPadding,
    ]);

  const circleYScale = (v: NumberValue) => circleYScalePost(circleYScalePre(v));

  // ---------------------------------------------------------------------------
  // Gene setup
  const geneContainerWidth = width / 2 - rowHeight;
  const maxGenes = Math.floor(geneContainerWidth / rowHeight);

  const genesUpstream = data.genesUpstreamByDist.slice(0, maxGenes).reverse();
  const genesDownstream = data.genesDownstreamByDist.slice(0, maxGenes);

  const [minRelDistance, maxRelDistance] = [
    ...genesUpstream,
    ...genesDownstream,
  ].reduce(
    (minMax, gene) => [
      Math.min(minMax[0], gene.relDistance || Infinity),
      Math.max(minMax[1], gene.relDistance || -Infinity),
    ],
    [Infinity, 0]
  );

  const paddingScale = scaleLinear()
    .domain([minRelDistance, maxRelDistance])
    .range(distPaddingRange);

  const genesUpstreamPadding = genePadding
    ? genesUpstream.map((d) => Math.round(paddingScale(d.relDistance!)))
    : [];
  const genesUpstreamScale = scaleBand()
    .domain(genesUpstream.map((d) => d.name))
    .range([0, width / 2 - rowHeight / 2])
    .paddingInner(genesUpstreamPadding);

  const genesDownstreamPadding = genePadding
    ? genesDownstream.map((d) => Math.round(paddingScale(d.relDistance!)))
    : [];
  const genesDownstreamScale = scaleBand()
    .domain(genesDownstream.map((d) => d.name))
    .range([0, width / 2 - rowHeight / 2])
    .paddingInner(genesDownstreamPadding)
    .paddingInnerZeroBased(true);

  const bandwidth = Math.min(
    genesUpstreamScale.bandwidth(),
    genesDownstreamScale.bandwidth()
  );

  genesUpstreamScale.fixedBandwidth(bandwidth);
  genesDownstreamScale.fixedBandwidth(bandwidth);

  const genesUpstreamLeftPad = Math.max(
    0,
    genesUpstreamScale.rangeSize() - genesUpstreamScale.totalWidth()
  );

  const minVisibleAbsDist = Math.min(
    genesUpstream.reduce(
      (minDist, gene) => Math.min(minDist, gene.absDistance),
      Infinity
    ),
    genesDownstream.reduce(
      (minDist, gene) => Math.min(minDist, gene.absDistance),
      Infinity
    )
  );

  const maxVisibleAbsDist = Math.max(
    genesUpstream.reduce(
      (maxDist, gene) => Math.max(maxDist, gene.absDistance),
      0
    ),
    genesDownstream.reduce(
      (maxDist, gene) => Math.max(maxDist, gene.absDistance),
      0
    )
  );

  const distanceHeightScale = scaleLinear()
    .domain([minVisibleAbsDist, maxVisibleAbsDist])
    .range([2, paddingBottom]);

  const plotBeeswarm = (
    selection: Selection<
      SVGElement | BaseType,
      EgPlotGeneAggregationSampleCategoryValue,
      SVGElement | BaseType,
      EgPlotGeneAggregationValue
    >,
    { isRightAligned = false } = {}
  ) => {
    selection
      .attr(
        'fill',
        (d, i) => DEFAULT_COLOR_MAP_DARK[i % DEFAULT_COLOR_MAP_DARK.length]
      )
      .selectAll('circle')
      .data((d) =>
        dodge<EgPlotGeneAggregationSampleCategory>(
          d,
          circleRadius * 2 + circlePadding,
          circleYScale
        )
      )
      .join('circle')
      .attr('cx', (d) => {
        return isRightAligned
          ? genesUpstreamScale.bandwidth() - (d.x + 2 * beeswarmPadding)
          : d.x + circleRadius + beeswarmPadding;
      })
      .attr('cy', (d) => d.y)
      .attr('r', circleRadius);
  };

  const getArrayNumCols = (genes: EgPlotGeneAggregationValue[]) => {
    const maxSize = Object.values(genes[0].samplesByCategory).reduce(
      (max, cat) => Math.max(max, cat.size),
      0
    );
    return Math.ceil(Math.sqrt((maxSize * bandwidth) / rowHeight));
  };

  const plotArray = (
    selection: Selection<
      BaseType | SVGGElement,
      EgPlotGeneAggregationSampleCategoryValue,
      BaseType | SVGGElement,
      EgPlotGeneAggregationValue
    >,
    numCols: number,
    {
      instanceCache = { current: null },
      onMouseEnter = identity,
      onMouseLeave = identity,
      tooltipTitleGetter = null,
    }: {
      instanceCache: {
        current: Selection<
          BaseType | SVGGElement,
          EgPlotGeneAggregationSampleCategory,
          BaseType | SVGGElement,
          EgPlotGeneAggregationSampleCategoryValue
        > | null;
      };
      onMouseEnter: (d: EgPlotGeneAggregationSampleCategory) => any;
      onMouseLeave: Function;
      tooltipTitleGetter?:
        | ((d: EgPlotGeneAggregationSampleCategory) => JSX.Element)
        | null;
    }
  ) => {
    const cellSize = bandwidth / numCols;

    const indexToX = (index: number) => (index % numCols) * cellSize;
    const indexToY = (index: number) => Math.floor(index / numCols) * cellSize;

    instanceCache.current = selection
      .attr(
        'fill',
        (d, i) => DEFAULT_COLOR_MAP_DARK[i % DEFAULT_COLOR_MAP_DARK.length]
      )
      .selectAll('rect')
      .data(
        (d) => d,
        // TODO: Type after figuring out how typing ValueFn from d3 works
        ((d: EgPlotGeneAggregationSampleCategory) =>
          `${d.gene}|${d.sample}`) as any
      )
      .join('rect')
      .attr('x', (d) => indexToX(samples[d.sample].index))
      .attr('y', (d) => indexToY(samples[d.sample].index))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .on('mouseenter', (event, d) => {
        const bBox = event.target.getBoundingClientRect();
        const title =
          (tooltipTitleGetter && tooltipTitleGetter(d)) || d.score.toFixed(3);
        showTooltip(bBox.x + bBox.width / 2, bBox.y, title, {
          arrow: true,
          placement: 'top',
          classes:
            tooltipClasses[
              categories[d.sampleCategory].index % tooltipClasses.length
            ],
        });
        onMouseEnter(d);
      })
      .on('mouseleave', (d) => {
        showTooltip();
        onMouseLeave(d);
      });
  };

  const arrayTooltipTitleGetter = (d: EgPlotGeneAggregationSampleCategory) => (
    <>
      The enhancer overlapping <strong>{position}</strong>
      {focusRegion ? ` (${focusRegion})` : ''} is predicted to regulate{' '}
      <strong>{d.gene}</strong> in sample <strong>{d.sample}</strong> with a
      score of <strong className="value">{d.score.toFixed(3)}</strong>.
    </>
  );

  const geneArrayInstances: {
    [key in 'upstream' | 'downstream']: {
      current: Selection<any, any, any, any> | null;
    };
  } = {
    upstream: { current: null },
    downstream: { current: null },
  };

  const geneArrayInstanceMouseEnterHandler = (
    dHovering: EgPlotGeneAggregationSampleCategory
  ) => {
    const opacity = (d: EgPlotGeneAggregationSampleCategory) =>
      d.sample === dHovering.sample ? 1 : 0.2;
    geneArrayInstances.upstream.current?.attr('opacity', opacity);
    geneArrayInstances.downstream.current?.attr('opacity', opacity);
  };

  const geneArrayInstanceMouseLeaveHandler = () => {
    geneArrayInstances.upstream.current?.attr('opacity', 1);
    geneArrayInstances.downstream.current?.attr('opacity', 1);
  };

  function plotBox<T extends { row?: number }, P>(
    selection: Selection<BaseType | SVGGElement, T, BaseType | SVGGElement, P>,
    valueScale: ScaleContinuousNumeric<number, number>,
    valueGetter: (d: T) => number,
    {
      cellWidth = rowHeight,
      fillColor = DEFAULT_COLOR_MAP_LIGHT,
      forceMaxSize = false,
      textColor = DEFAULT_COLOR_MAP_DARK,
      showText = true,
      showZero = true,
      showTooltip: showTooltipOnMouseEnter = false,
      tooltipTitleGetter = null,
    }: {
      cellWidth?: number;
      fillColor?: string[];
      forceMaxSize?: boolean;
      textColor?: string[];
      showText?: boolean;
      showZero?: boolean;
      showTooltip?: boolean;
      tooltipTitleGetter: any;
    }
  ) {
    const sizeGetter = forceMaxSize
      ? () => valueScale.range()[1]
      : (d: T) => valueScale(valueGetter(d));

    const bg = selection
      .selectAll('.bg')
      .data((d) => [d])
      .join('rect')
      .attr('class', 'bg')
      .attr('fill', (d) => fillColor[d.row! % fillColor.length])
      .attr('x', (d) => (cellWidth - sizeGetter(d)) / 2)
      .attr('y', (d) => (rowHeight - sizeGetter(d)) / 2)
      .attr('width', sizeGetter)
      .attr('height', sizeGetter)
      .attr('opacity', (d) => +(valueGetter(d) > 0));

    if (showTooltipOnMouseEnter) {
      bg.on('mouseenter', (event, d) => {
        const bBox = event.target.getBoundingClientRect();
        const title =
          (tooltipTitleGetter && tooltipTitleGetter(d)) || valueGetter(d);
        showTooltip(bBox.x + bBox.width / 2, bBox.y, title, {
          arrow: true,
          placement: 'top',
          classes: tooltipClasses[d.row! % tooltipClasses.length],
        });
      }).on('mouseleave', () => {
        showTooltip();
      });
    } else {
      bg.on('mouseenter', null).on('mouseleave', null);
    }

    if (showText) {
      let style = 'font-size: 12px; font-weight: bold;';
      if (showTooltip) style += ' pointer-events: none;';
      selection
        .selectAll('.box-text')
        .data((d) => [d])
        .join('text')
        .attr('class', 'box-text')
        .attr('fill', (d) => textColor[d.row! % textColor.length])
        .attr('style', style)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle')
        .attr('x', cellWidth / 2)
        .attr('y', rowHeight / 2)
        .attr('opacity', (d) => +(valueGetter(d) > 0 || showZero))
        .text((d) => valueGetter(d));
    }
  }

  const enhancerTooltipTitleGetter = (d: EgPlotCategoryAggregationValue) => (
    <>
      Found {d.numEnhancers} active enhancer overlapping {position} across all{' '}
      {d.category.size} {Object.values(categories)[d.row!].name} samples.
    </>
  );

  const boxTooltipTitleGetter = (
    d: EgPlotGeneAggregationSampleCategoryValue
  ) => (
    <>
      <strong className="value">{d.length}</strong> active enhancers found
      across {d.size} {Object.values(categories)[d.row!].name} samples.
    </>
  );

  const boxScoreTooltipTitleGetter = (
    d: EgPlotGeneAggregationSampleCategoryValue
  ) => (
    <>
      The most likely active enhancer for {d.maxScoreSample?.gene} has an ABC
      score of <strong className="value">{d.maxScore.toFixed(3)}</strong> and is
      found in {d.maxScoreSample?.sample.replaceAll('_', ' ')} (Overall max. ABC
      score is {data.maxScore.toFixed(3)}).
    </>
  );

  // ---------------------------------------------------------------------------
  // Category summary
  const enhancerG = svg
    .select('#enhancers')
    .attr('transform', `translate(${width / 2 - rowHeight / 2}, 0)`);

  // Draw background
  const enhancerGCellG: Selection<
    BaseType | SVGGElement,
    EgPlotCategoryAggregationValue,
    BaseType | SVGElement,
    EgPlotCategoryAggregationValue
  > = enhancerG
    .selectAll('.enhancer-gene-aggregate')
    .data(
      Object.values(data.categoryAggregation).map((d, i) => {
        // Little hacky but necessary unfortunately
        d.row = i;
        return d;
      }),
      ((d: EgPlotCategoryAggregationValue) => d.category.name) as any
    )
    .join('g')
    .attr('class', 'enhancer-gene-aggregate')
    .attr('transform', (d, i) => `translate(0, ${i * rowHeight + paddingTop})`);

  plotBox<EgPlotCategoryAggregationValue, EgPlotCategoryAggregationValue>(
    enhancerGCellG,
    categorySizeScale,
    (d) => d.numEnhancers,
    {
      fillColor: ['#fff'],
      showTooltip: true,
      tooltipTitleGetter: enhancerTooltipTitleGetter,
      forceMaxSize: true,
    }
  );

  // Draw border
  svg
    .select('#enhancers')
    .selectAll('.enhancer-box-border')
    .data(Object.values(categories), ((d: Category) => d.name) as any)
    .join('rect')
    .attr('class', 'enhancer-box-border')
    .attr('fill', 'none')
    .attr(
      'stroke',
      (d, i) => DEFAULT_COLOR_MAP_LIGHT[i % DEFAULT_COLOR_MAP_LIGHT.length]
    )
    .attr('stroke-width', '1')
    .attr('x', 0)
    .attr('y', (d, i) => i * rowHeight + paddingTop)
    .attr('width', rowHeight)
    .attr('height', rowHeight);

  // ---------------------------------------------------------------------------
  // Draw upstream genes

  const genesUpstreamG = svg
    .select('#genes-upstream')
    .selectAll('.gene-upstream')
    .data(genesUpstream, ((d: EgPlotGeneAggregationValue) => d.name) as any)
    .join('g')
    .attr('class', 'gene-upstream')
    .attr(
      'transform',
      (d) =>
        `translate(${
          genesUpstreamLeftPad + (genesUpstreamScale(d.name) ?? 0)
        }, 0)`
    );

  // Draw labels
  const geneLabelX = genesUpstreamScale.bandwidth() / 2;
  const geneLabelY = paddingTop - geneLabelPadding;
  genesUpstreamG
    // the join is needed to avoid appending more and more text elements on
    // subsequent calls of this function, which would happen if we used
    // `append()` instead.
    .selectAll('.gene-upstream-label')
    .data((d) => [d])
    .join('text')
    .attr('class', 'gene-label gene-upstream-label')
    .attr('style', 'font-size: 9px;')
    .attr('transform', `translate(${geneLabelX},${geneLabelY}) rotate(-90)`)
    .attr('fill', 'black')
    .attr('dominant-baseline', 'middle')
    .text((d) => d.name);

  // Draw cell
  const genesUpstreamGCellG = genesUpstreamG
    .selectAll('.gene-upstream-cell')
    .data(
      (d: EgPlotGeneAggregationValue) =>
        Object.values(d.samplesByCategory).map((item, i) => {
          // Little hacky but necessary unfortunately
          item.row = i;
          return item;
        }),
      // TODO: Figure out how to type ValueFn from d3
      ((d: EgPlotGeneAggregationValue) => d.name) as any
    )
    .join('g')
    .attr('class', 'gene-upstream-cell')
    .attr('transform', (d, i) => `translate(0, ${i * rowHeight + paddingTop})`);

  if (geneCellEncoding !== prevGeneCellEncoding) {
    genesUpstreamGCellG.selectAll('*').remove();
  }

  switch (geneCellEncoding) {
    case 'distribution':
      plotBeeswarm(genesUpstreamGCellG, { isRightAligned: true });
      break;

    case 'array':
      plotArray(genesUpstreamGCellG, getArrayNumCols(genesUpstream), {
        tooltipTitleGetter: arrayTooltipTitleGetter,
        instanceCache: geneArrayInstances.upstream,
        onMouseEnter: geneArrayInstanceMouseEnterHandler,
        onMouseLeave: geneArrayInstanceMouseLeaveHandler,
      });
      break;

    case 'number':
    case 'percent': {
      const valueScale =
        geneCellEncoding === 'percent' ? percentScale : categorySizeScale;

      const valueGetter =
        geneCellEncoding === 'percent'
          ? (d: EgPlotGeneAggregationSampleCategoryValue) => d.length / d.size
          : (d: EgPlotGeneAggregationSampleCategoryValue) => d.length;

      plotBox<
        EgPlotGeneAggregationSampleCategoryValue,
        EgPlotGeneAggregationValue
      >(genesUpstreamGCellG, valueScale, valueGetter, {
        showText: false,
        cellWidth: genesUpstreamScale.bandwidth(),
        fillColor: DEFAULT_COLOR_MAP,
        showTooltip: true,
        tooltipTitleGetter: boxTooltipTitleGetter,
      });

      break;
    }

    case 'max-score':
    default: {
      plotBox(genesUpstreamGCellG, scoreScale, (d) => d.maxScore, {
        showText: false,
        cellWidth: genesUpstreamScale.bandwidth(),
        fillColor: DEFAULT_COLOR_MAP,
        showTooltip: true,
        tooltipTitleGetter: boxScoreTooltipTitleGetter,
      });

      break;
    }
  }

  // Draw border
  genesUpstreamG
    .selectAll('.gene-upstream-border')
    .data(Object.values(categories), ((d: Category) => d.name) as any)
    .join('rect')
    .attr('class', 'gene-upstream-border')
    .attr('fill', 'none')
    .attr(
      'stroke',
      (d, i) => DEFAULT_COLOR_MAP_LIGHT[i % DEFAULT_COLOR_MAP_LIGHT.length]
    )
    .attr('stroke-width', '1')
    .attr('x', 0)
    .attr('y', (d, i) => i * rowHeight + paddingTop)
    .attr('width', genesUpstreamScale.bandwidth())
    .attr('height', rowHeight);

  // Draw distance bars
  genesUpstreamG
    // Same reason we're using a join here as for the text labels above
    .selectAll('.gene-upstream-distance-bar')
    .data((d) => [d])
    .join('rect')
    .attr('class', 'gene-upstream-distance-bar')
    .attr('fill', '#bbbbbb')
    .attr('x', genesUpstreamScale.bandwidth() / 2 - distanceBarWidth / 2)
    .attr('y', Object.values(categories).length * rowHeight + paddingTop)
    .attr('width', distanceBarWidth)
    .attr('height', (d) => distanceHeightScale(d.absDistance));

  // ---------------------------------------------------------------------------
  // Draw downstream genes
  svg
    .select('#genes-downstream')
    .attr('transform', `translate(${width / 2 + rowHeight / 2}, 0)`);

  const genesDownstreamG = svg
    .select('#genes-downstream')
    .selectAll('.gene-downstream')
    .data(genesDownstream, ((d: EgPlotGeneAggregationValue) => d.name) as any)
    .join('g')
    .attr('class', 'gene-downstream')
    .attr('transform', (d) => `translate(${genesDownstreamScale(d.name)}, 0)`);

  // Draw labels
  genesDownstreamG
    .selectAll('.gene-downstream-label')
    .data((d) => [d])
    .join('text')
    .attr('class', 'gene-label gene-downstream-label')
    .attr('style', 'font-size: 9px;')
    .attr('transform', `translate(${geneLabelX},${geneLabelY}) rotate(-90)`)
    .attr('fill', 'black')
    .attr('dominant-baseline', 'middle')
    .text((d) => d.name);

  // Draw cell
  const genesDownstreamGCellG = genesDownstreamG
    .selectAll('.gene-downstream-cell')
    .data(
      (d) =>
        Object.values(d.samplesByCategory).map((item, i) => {
          // Little hacky but necessary unfortunately
          item.row = i;
          return item;
        }),
      ((d: EgPlotGeneAggregationValue) => d.name) as any
    )
    .join('g')
    .attr('class', 'gene-downstream-cell')
    .attr('transform', (d, i) => `translate(0, ${i * rowHeight + paddingTop})`);

  if (geneCellEncoding !== prevGeneCellEncoding) {
    genesDownstreamGCellG.selectAll('*').remove();
  }

  switch (geneCellEncoding) {
    case 'distribution':
      plotBeeswarm(genesDownstreamGCellG);
      break;

    case 'array':
      plotArray(genesDownstreamGCellG, getArrayNumCols(genesDownstream), {
        tooltipTitleGetter: arrayTooltipTitleGetter,
        instanceCache: geneArrayInstances.downstream,
        onMouseEnter: geneArrayInstanceMouseEnterHandler,
        onMouseLeave: geneArrayInstanceMouseLeaveHandler,
      });
      break;

    case 'number':
    case 'percent': {
      const valueScale =
        geneCellEncoding === 'percent' ? percentScale : categorySizeScale;

      const valueGetter =
        geneCellEncoding === 'percent'
          ? (d: EgPlotGeneAggregationSampleCategoryValue) => d.length / d.size
          : (d: EgPlotGeneAggregationSampleCategoryValue) => d.length;

      plotBox(genesDownstreamGCellG, valueScale, valueGetter, {
        showText: false,
        cellWidth: genesDownstreamScale.bandwidth(),
        fillColor: DEFAULT_COLOR_MAP,
        showTooltip: true,
        tooltipTitleGetter: boxTooltipTitleGetter,
      });

      break;
    }

    case 'max-score':
    default: {
      plotBox(genesDownstreamGCellG, scoreScale, (d) => d.maxScore, {
        showText: false,
        cellWidth: genesDownstreamScale.bandwidth(),
        fillColor: DEFAULT_COLOR_MAP,
        showTooltip: true,
        tooltipTitleGetter: boxScoreTooltipTitleGetter,
      });

      break;
    }
  }

  // Draw border
  genesDownstreamG
    .selectAll('.gene-downstream-border')
    .data(Object.values(categories), ((d: Category) => d.name) as any)
    .join('rect')
    .attr('class', 'gene-downstream-border')
    .attr('fill', 'none')
    .attr(
      'stroke',
      (d, i) => DEFAULT_COLOR_MAP_LIGHT[i % DEFAULT_COLOR_MAP_LIGHT.length]
    )
    .attr('stroke-width', '1')
    .attr('x', 0)
    .attr('y', (d, i) => i * rowHeight + paddingTop)
    .attr('width', genesDownstreamScale.bandwidth())
    .attr('height', rowHeight);

  // Draw distance bars
  genesDownstreamG
    // Same reason we're using a join here as for the text labels above
    .selectAll('.gene-downstream-distance-bar')
    .data((d) => [d])
    .join('rect')
    .attr('class', 'gene-downstream-distance-bar')
    .attr('fill', '#bbbbbb')
    .attr('x', genesDownstreamScale.bandwidth() / 2 - distanceBarWidth / 2)
    .attr('y', Object.values(categories).length * rowHeight + paddingTop)
    .attr('width', distanceBarWidth)
    .attr('height', (d) => distanceHeightScale(d.absDistance));

  // ---------------------------------------------------------------------------
  // Draw gene distance axis

  const distRange = Math.ceil((maxVisibleAbsDist - minVisibleAbsDist) / 1e5);
  const distStep = Math.ceil(distRange / 4);
  const tickValues =
    distRange <= 1
      ? [minVisibleAbsDist, maxVisibleAbsDist]
      : Array(4)
          .fill(undefined)
          .map(
            (v, i) =>
              Math.ceil(minVisibleAbsDist / 1e5) * 1e5 + i * (distStep * 1e5)
          );

  svg
    .select('#gene-distance-axis')
    .attr(
      'transform',
      `translate(0, ${
        Object.values(categories).length * rowHeight + paddingTop
      })`
    )
    .call(
      axisRight(distanceHeightScale)
        .tickSize(width)
        .tickFormat(function geneDistanceAxisTickFormat(this: Element, d) {
          const s = ((d as number) / 1e6).toFixed(1);
          return this.parentNode?.nextSibling
            ? s
            : `${s} Mbp distance to enhancer`;
        })
        .tickValues(tickValues) as any
    )
    .call((g) => g.select('.domain').remove())
    .call((g) =>
      g
        .selectAll('.tick line')
        .attr('stroke', '#bbbbbb')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '4,4')
    )
    .call((g) =>
      g
        .selectAll('.tick text')
        .attr('fill', '#bbbbbb')
        .attr('x', width / 2)
        .attr('dy', 1)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'hanging')
    );
};

const EnhancerGenesPlot = React.memo(function EnhancerGenesPlot() {
  const chromInfo = useChromInfo();
  const showTooltip = useShowTooltip();

  const enhancerTrackConfig = useRecoilValue(enhancerRegionsTrackState);
  const sampleSelection = useRecoilValue(sampleSelectionState);
  const sampleGroupSelectionSizes = useRecoilValue(
    sampleGroupSelectionSizesState
  );
  const geneCellEncoding = useRecoilValue(enhancerGenesCellEncodingState);
  const absRange = useRecoilValue(focusRegionAbsWithAssembly(chromInfo));
  const focusRegion = useRecoilValue(focusRegionState);
  const relPosition = useRecoilValue(focusRegionRelState);
  const strPosition = useRecoilValue(focusRegionStrState);
  const genePadding = useRecoilValue(enhancerGenesPaddingState);
  const stratification = useRecoilValue(stratificationState);

  const [plotEl, setPlotEl] = useRecoilState<SVGElement | null>(
    enhancerGenesSvgState
  );

  const [tile, setTile] = useState<BeddbTile[] | null>(null);
  const [isLoadingTile, setIsLoadingTile] = useState<boolean | null>(null);
  const [tilesetInfo, setTilesetInfo] = useState<TilesetInfo | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const prevWidth = usePrevious(width);
  const prevGeneCellEncoding = usePrevious(geneCellEncoding);

  const categories = getCategories(stratification);
  const samples = getSamples(stratification);

  const [server, setServer] = useState<string | null>(null);
  const [uuid, setUuid] = useState<string | null>(null);

  const fetchTiles = async (tileIds: string[]) => {
    const response = await fetch(
      `${server}/tiles/?${tileIds.map((tileId) => `d=${tileId}`).join('&')}`
    );
    return response.json() as Promise<{ [key: string]: BeddbTile[] }>;
  };

  // Hook to update data source
  useEffect(() => {
    setServer(enhancerTrackConfig.server);
    setUuid(enhancerTrackConfig.tilesetUid);
  }, [enhancerTrackConfig]);

  // Hook to update tileset info when data source updates
  useEffect(() => {
    (async () => {
      const response = await fetch(`${server}/tileset_info/?d=${uuid}`);
      const results = await response.json();

      // TODO: Remove non-null assertions
      if (results[uuid!]) setTilesetInfo(results[uuid!]);
    })();
  }, [server, uuid]);

  useEffect(() => {
    // Determine highest resolution tiles
    let active = true;

    if (absRange === null || tilesetInfo === null) return undefined;

    const [absStart, absEnd] = absRange;
    const regionLength = Math.abs(absEnd - absStart);

    const minTileSize = getMinTileSize(tilesetInfo);

    const k = 5;
    const zoomOutLevel = Math.max(
      0,
      Math.ceil(Math.log2(regionLength / minTileSize / k))
    );
    const zoomLevel = tilesetInfo.max_zoom - zoomOutLevel;

    const tileSize = minTileSize * 2 ** zoomOutLevel;

    const tileXPosStart = Math.floor(absStart / tileSize);
    const tileXPosEnd = Math.floor(absEnd / tileSize);

    const tileIds = range(tileXPosStart, tileXPosEnd + 1).reduce(
      (ids, xPos) => {
        ids.push(`${uuid}.${zoomLevel}.${xPos}`);
        return ids;
      },
      [] as string[]
    );

    setIsLoadingTile(true);
    fetchTiles(tileIds).then((tiles) => {
      if (active) {
        setIsLoadingTile(false);
        setTile(filterIntervalsByRange(Object.values(tiles).flat(), absRange));
      }
    });

    return () => {
      active = false;
    };
  }, [absRange, tilesetInfo]);

  const plotElRef = useCallback(
    (node) => {
      setPlotEl(node);
    },
    [setPlotEl]
  );

  // Derived State
  const isInit = useMemo(() => !!tilesetInfo, [tilesetInfo]);

  const data: EgPlotData | undefined = useMemo(
    () => {
      if (!tile) return undefined;

      let maxScore = 0;
      let minAbsDistance = Infinity;
      let maxAbsDistance = 0;
      const genes: EgPlotGeneAggregationData = {};
      const categoryAggregation: EgPlotCategoryAggregationData = {};

      Object.entries(categories).forEach(([name, category]) => {
        categoryAggregation[name] = {
          category,
          numEnhancers: 0,
        };
      });

      const distComparator = (
        a: EgPlotGeneAggregationValue,
        b: EgPlotGeneAggregationValue
      ) => a.absDistance - b.absDistance;
      const genesUpstreamByDist = new TinyQueue([], distComparator);
      const genesDownstreamByDist = new TinyQueue([], distComparator);

      tile.forEach((entry) => {
        const sample = entry.fields[stratification.categoryField];

        // Exclude samples that have been deselected
        if (!sampleSelection[sampleIdx(stratification)[sample]]) return;
        if (!relPosition) return;

        const geneName = entry.fields[GENE_NAME_COLUMN];

        if (!genes[geneName]) {
          const relGenePos = +entry.fields[4];
          const distance = relGenePos - relPosition;
          const isDownstream = distance > 0;
          const absDistance = Math.abs(distance);
          genes[geneName] = {
            name: geneName,
            position: relGenePos,
            absDistance,
            isDownstream,
            samplesByCategory: {},
          };

          Object.values(categories).forEach(({ name, size }) => {
            // TODO: Remove any assertion once type is fixed
            const value = [] as any;
            value.maxScore = 0;
            value.size = sampleGroupSelectionSizes[name];
            genes[geneName].samplesByCategory[name] = value;
          });

          minAbsDistance = Math.min(minAbsDistance, absDistance);
          maxAbsDistance = Math.max(maxAbsDistance, absDistance);

          if (isDownstream) genesDownstreamByDist.push(genes[geneName]);
          else genesUpstreamByDist.push(genes[geneName]);
        }

        const sampleCat = samples[sample].category.name;
        const sampleObj = {
          gene: geneName,
          sample,
          sampleCategory: sampleCat,
          score: entry.importance,
        };

        genes[geneName].samplesByCategory[sampleCat].push(sampleObj);

        if (
          entry.importance >
          genes[geneName].samplesByCategory[sampleCat].maxScore
        ) {
          genes[geneName].samplesByCategory[sampleCat].maxScore =
            entry.importance;
          genes[geneName].samplesByCategory[sampleCat].maxScoreSample =
            sampleObj;
        }

        maxScore = Math.max(maxScore, entry.importance);
        categoryAggregation[sampleCat].numEnhancers++;
      });

      const genesDownstreamByDistArr: EgPlotGeneAggregationValue[] = [];
      while (genesDownstreamByDist.length)
        // Safe non-null assertion since checking for length
        genesDownstreamByDistArr.push(genesDownstreamByDist.pop()!);

      const genesUpstreamByDistArr: EgPlotGeneAggregationValue[] = [];
      while (genesUpstreamByDist.length)
        // Safe non-null assertion since checking for length
        genesUpstreamByDistArr.push(genesUpstreamByDist.pop()!);

      genesDownstreamByDistArr.forEach((gene, i) => {
        const prevGene = genesDownstreamByDistArr[i - 1];
        gene.relDistance =
          // TODO: Check if non-null assertion on relPosition can be removed
          gene.position - ((prevGene && prevGene.position) || relPosition!);
      });

      genesUpstreamByDistArr.forEach((gene, i) => {
        const prevGene = genesDownstreamByDistArr[i - 1];
        gene.relDistance =
          // TODO: Check if non-null assertion on relPosition can be removed
          ((prevGene && prevGene.position) || relPosition!) - gene.position;
      });

      return {
        minAbsDistance,
        maxAbsDistance,
        maxScore,
        genes,
        genesDownstreamByDist: genesDownstreamByDistArr,
        genesUpstreamByDist: genesUpstreamByDistArr,
        categoryAggregation,
      };
    },
    // `relPosition` is excluded on purpose because `tile` is already updated
    // when `relPosition` updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tile, sampleGroupSelectionSizes, sampleSelection]
  );

  // Rendering
  const classes = useStyles();

  useLayoutEffect(
    () => {
      if (!plotEl) return undefined;

      const measure = () =>
        window.requestAnimationFrame(() => {
          const currWidth = plotEl.getBoundingClientRect().width;
          if (currWidth !== prevWidth) setWidth(currWidth);
        });

      measure();

      window.addEventListener('resize', measure);
      window.addEventListener('orientationchange', measure);

      return () => {
        window.removeEventListener('resize', measure);
        window.removeEventListener('orientationchange', measure);
      };
    },
    // `prevWidth` is ommitted on purpose to avoid circular updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plotEl]
  );

  const tooltipClasses: ClassNameMap<'tooltip' | 'arrow'>[] = [];
  for (let i = 0; i < useTooltipStyles.length; i++) {
    tooltipClasses.push(useTooltipStyles[i]());
  }

  useEffect(
    () => {
      plotEnhancerGeneConnections(plotEl!, width!, data!, stratification, {
        geneCellEncoding,
        prevGeneCellEncoding,
        genePadding,
        showTooltip,
        classes,
        tooltipClasses,
        position: strPosition,
        focusRegion,
      });
    },
    // `prevGeneCellEncoding` is ommitted on purpose to avoid circular updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plotEl, width, data, geneCellEncoding, genePadding, showTooltip]
  );

  return (
    <Grid
      className={classes.root}
      container
      justify="center"
      alignItems="center"
    >
      {isInit && !isLoadingTile ? (
        <Grid item className={classes.plot}>
          <svg ref={plotElRef} className={classes.plotSvg}>
            <g id="enhancers" />
            <g id="gene-distance-axis" />
            <g id="genes-upstream" />
            <g id="genes-downstream" />
          </svg>
        </Grid>
      ) : (
        <CircularProgress color="inherit" />
      )}
    </Grid>
  );
});

export default EnhancerGenesPlot;
