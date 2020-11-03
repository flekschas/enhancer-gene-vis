import { axisRight, scaleLinear, scaleLog, select } from 'd3';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import TinyQueue from 'tinyqueue';

import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

import {
  DEFAULT_COLOR_MAP,
  DEFAULT_COLOR_MAP_DARK,
  DEFAULT_COLOR_MAP_LIGHT,
  DEFAULT_STRATIFICATION,
  DEFAULT_VIEW_CONFIG_ENHANCER,
} from './constants';
import { scaleBand } from './utils';
import usePrevious from './use-previous';

import './GeneEnhancerPlot.css';

const useStyles = makeStyles((theme) => ({
  plot: {
    position: 'relative',
    flexGrow: 1,
  },
  plotSvg: {
    width: '100%',
    height: '100%',
  },
}));

const {
  server,
  tilesetUid: uuid,
} = DEFAULT_VIEW_CONFIG_ENHANCER.views[0].tracks.top[3];

const fetchTile = async (tileId) => {
  const response = await fetch(`${server}/tiles/?d=${tileId}`);
  return response.json();
};

const categories = {};
const samples = {};

DEFAULT_STRATIFICATION.groups.forEach((group) => {
  categories[group.label] = {
    name: group.label,
    size: group.categories.length,
  };

  group.categories.forEach((category) => {
    samples[category] = categories[group.label];
  });
});

const getTileWidth = (tilesetInfo) =>
  tilesetInfo.max_width / 2 ** tilesetInfo.max_zoom;

const filterByPosition = (tile, position) =>
  tile.filter((entry) => position >= entry.xStart && position <= entry.xEnd);

// From https://observablehq.com/@d3/beeswarm
const dodge = (data, radius, yScale) => {
  const radius2 = radius ** 2;
  const circles = data
    .map((d) => ({ y: yScale(d.value), data: d }))
    .sort((a, b) => a.y - b.y);
  const epsilon = 1e-3;
  let head = null;
  let tail = null;

  // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
  function intersects(x, y) {
    let a = head;
    while (a) {
      if (radius2 - epsilon > (a.x - x) ** 2 + (a.y - y) ** 2) {
        return true;
      }
      a = a.next;
    }
    return false;
  }

  // Place each circle sequentially.
  for (const b of circles) {
    // Remove circles from the queue that can’t intersect the new circle b.
    while (head && head.y < b.y - radius2) head = head.next;

    // Choose the minimum non-intersecting tangent.
    if (intersects((b.x = 0), b.y)) {
      let a = head;
      b.x = Infinity;
      do {
        const x = a.x + Math.sqrt(radius2 - (a.y - b.y) ** 2);
        if (x < b.x && !intersects(x, b.y)) b.x = x;
        a = a.next;
      } while (a);
    }

    // Add b to the queue.
    b.next = null;
    // eslint-disable-next-line no-multi-assign
    if (head === null) head = tail = b;
    // eslint-disable-next-line no-multi-assign
    else tail = tail.next = b;
  }

  return circles;
};

const plotEnhancerGeneConnections = (
  node,
  width,
  data,
  {
    geneCellEncoding = 'distribution',
    prevGeneCellEncoding,
    genePadding = false,
  } = {}
) => {
  if (!width || !data) return;

  const svg = select(node);

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
    (max, cat) => Math.max(max, cat.numEnhancers),
    0
  );
  const categorySizeScale = scaleLog()
    .domain([1, maxCatgorySize])
    .range([2, rowHeight])
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

  const circleYScale = (v) => circleYScalePost(circleYScalePre(v));

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
      Math.min(minMax[0], gene.relDistance),
      Math.max(minMax[1], gene.relDistance),
    ],
    [Infinity, 0]
  );

  const paddingScale = scaleLinear()
    .domain([minRelDistance, maxRelDistance])
    .range(distPaddingRange);

  const genesUpstreamPadding = genePadding
    ? genesUpstream.map((d) => Math.round(paddingScale(d.relDistance)))
    : [];
  const genesUpstreamScale = scaleBand()
    .domain(genesUpstream.map((d) => d.name))
    .range([0, width / 2 - rowHeight / 2])
    .paddingInner(genesUpstreamPadding);

  const genesDownstreamPadding = genePadding
    ? genesDownstream.map((d) => Math.round(paddingScale(d.relDistance)))
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

  const plotBeeswarm = (selection, { isRightAligned = false } = {}) => {
    selection
      .attr(
        'fill',
        (d, i) => DEFAULT_COLOR_MAP_DARK[i % DEFAULT_COLOR_MAP_DARK.length]
      )
      .selectAll('circle')
      .data((d) => dodge(d, circleRadius * 2 + circlePadding, circleYScale))
      .join('circle')
      .attr('cx', (d) =>
        isRightAligned
          ? genesUpstreamScale.bandwidth() - (d.x + 2 * beeswarmPadding)
          : d.x + circleRadius + beeswarmPadding
      )
      .attr('cy', (d) => d.y)
      .attr('r', circleRadius);
  };

  const plotBox = (
    selection,
    valueGetter,
    {
      cellWidth = rowHeight,
      fillColor = DEFAULT_COLOR_MAP_LIGHT,
      textColor = DEFAULT_COLOR_MAP_DARK,
      showText = true,
      showZero = true,
    } = {}
  ) => {
    selection
      .selectAll('.bg')
      .data((d) => [d])
      .join('rect')
      .attr('class', 'bg')
      .attr('fill', (d) => fillColor[d.row % fillColor.length])
      .attr('x', (d) => (cellWidth - categorySizeScale(valueGetter(d))) / 2)
      .attr('y', (d) => (rowHeight - categorySizeScale(valueGetter(d))) / 2)
      .attr('width', (d) => categorySizeScale(valueGetter(d)))
      .attr('height', (d) => categorySizeScale(valueGetter(d)))
      .attr('opacity', (d) => +(valueGetter(d) > 0));

    if (showText) {
      selection
        .selectAll('.box-text')
        .data((d) => [d])
        .join('text')
        .attr('class', 'box-text')
        .attr('fill', (d) => textColor[d.row % textColor.length])
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle')
        .attr('x', cellWidth / 2)
        .attr('y', rowHeight / 2)
        .attr('opacity', (d) => +(valueGetter(d) > 0 || showZero))
        .text((d) => valueGetter(d));
    }
  };

  // ---------------------------------------------------------------------------
  // Category summary
  const enhancerG = svg
    .select('#enhancers')
    .attr('transform', `translate(${width / 2 - rowHeight / 2}, 0)`);

  // Draw background
  const enhancerGCellG = enhancerG
    .selectAll('.enhancer-gene-aggregate')
    .data(
      Object.values(data.categoryAggregation).map((d, i) => {
        // Little hacky but necessary unfortunately
        d.row = i;
        return d;
      }),
      (d) => d.category.name
    )
    .join('g')
    .attr('class', 'enhancer-gene-aggregate')
    .attr('transform', (d, i) => `translate(0, ${i * rowHeight + paddingTop})`);

  plotBox(enhancerGCellG, (d) => d.numEnhancers);

  // Draw border
  svg
    .select('#enhancers')
    .selectAll('.enhancer-box-border')
    .data(Object.values(categories), (d) => d.name)
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
    .data(genesUpstream, (d) => d.name)
    .join('g')
    .attr('class', 'gene-upstream')
    .attr('transform', (d) => `translate(${genesUpstreamScale(d.name)}, 0)`);

  // Draw labels
  genesUpstreamG
    // the join is needed to avoid appending more and more text elements on
    // subsequent calls of this function, which would happen if we used
    // `append()` instead.
    .selectAll('.gene-upstream-label')
    .data((d) => [d])
    .join('text')
    .attr('class', 'gene-label gene-upstream-label')
    .attr('transform', 'rotate(-90)')
    .attr(
      'transform-origin',
      `${genesUpstreamScale.bandwidth() / 2} ${paddingTop - geneLabelPadding}`
    )
    .attr('fill', 'black')
    .attr('dominant-baseline', 'middle')
    .attr('x', genesUpstreamScale.bandwidth() / 2)
    .attr('y', paddingTop - geneLabelPadding)
    .text((d) => d.name);

  // Draw cell
  const genesUpstreamGCellG = genesUpstreamG
    .selectAll('.gene-upstream-cell')
    .data(
      (d) =>
        Object.values(d.samplesByCategory).map((item, i) => {
          // Little hacky but necessary unfortunately
          item.row = i;
          return item;
        }),
      (d) => d.name
    )
    .join('g')
    .attr('class', 'gene-upstream-cell')
    .attr('transform', (d, i) => `translate(0, ${i * rowHeight + paddingTop})`);

  if (geneCellEncoding !== prevGeneCellEncoding) {
    genesUpstreamGCellG.selectAll('*').remove();
  }

  switch (geneCellEncoding) {
    case 'number':
      plotBox(genesUpstreamGCellG, (d) => d.length, {
        showText: false,
        cellWidth: genesUpstreamScale.bandwidth(),
        fillColor: DEFAULT_COLOR_MAP,
      });
      break;

    case 'percent':
      plotBox(genesUpstreamGCellG, (d) => d.length / d.size, {
        showZero: false,
      });
      break;

    case 'distribution':
    default:
      plotBeeswarm(genesUpstreamGCellG, { isRightAligned: true });
      break;
  }

  // Draw border
  genesUpstreamG
    .selectAll('.gene-upstream-border')
    .data(Object.values(categories), (d) => d.name)
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
    .data(genesDownstream, (d) => d.name)
    .join('g')
    .attr('class', 'gene-downstream')
    .attr('transform', (d) => `translate(${genesDownstreamScale(d.name)}, 0)`);

  // Draw labels
  genesDownstreamG
    .selectAll('.gene-downstream-label')
    .data((d) => [d])
    .join('text')
    .attr('class', 'gene-label gene-downstream-label')
    .attr('transform', 'rotate(-90)')
    .attr(
      'transform-origin',
      `${genesUpstreamScale.bandwidth() / 2} ${paddingTop - geneLabelPadding}`
    )
    .attr('fill', 'black')
    .attr('dominant-baseline', 'middle')
    .attr('x', genesDownstreamScale.bandwidth() / 2)
    .attr('y', paddingTop - geneLabelPadding)
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
      (d) => d.name
    )
    .join('g')
    .attr('class', 'gene-downstream-cell')
    .attr('transform', (d, i) => `translate(0, ${i * rowHeight + paddingTop})`);

  if (geneCellEncoding !== prevGeneCellEncoding) {
    genesDownstreamGCellG.selectAll('*').remove();
  }

  switch (geneCellEncoding) {
    case 'number':
      plotBox(genesDownstreamGCellG, (d) => d.length, {
        showText: false,
        cellWidth: genesDownstreamScale.bandwidth(),
        fillColor: DEFAULT_COLOR_MAP,
      });
      break;

    case 'percent':
      plotBox(genesDownstreamGCellG, (d) => d.length / d.size, {
        showZero: false,
      });
      break;

    case 'distribution':
    default:
      plotBeeswarm(genesDownstreamGCellG);
      break;
  }

  // Draw border
  genesDownstreamG
    .selectAll('.gene-downstream-border')
    .data(Object.values(categories), (d) => d.name)
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
          .fill()
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
        .tickFormat(function geneDistanceAxisTickFormat(d) {
          const s = (d / 1e5).toFixed(0);
          return this.parentNode.nextSibling
            ? s
            : `${s} kbps distance to enhancer`;
        })
        .tickValues(tickValues)
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

const EnhancerGenePlot = ({
  geneCellEncoding,
  position,
  relPosition,
  genePadding,
  styles,
} = {}) => {
  const [plotEl, setPlotEl] = useState(null);
  const [tile, setTile] = useState(null);
  const [tilesetInfo, setTilesetInfo] = useState(null);
  const [width, setWidth] = useState(null);
  const prevWidth = usePrevious(width);
  const prevGeneCellEncoding = usePrevious(geneCellEncoding);

  useEffect(() => {
    let active = true;

    if (position === null || tilesetInfo === null) return undefined;

    const tileWidth = getTileWidth(tilesetInfo);
    const tileXPos = Math.floor(position / tileWidth);
    const tileId = `${uuid}.${tilesetInfo.max_zoom}.${tileXPos}`;

    fetchTile(tileId).then((_tile) => {
      if (active) setTile(filterByPosition(_tile[tileId], position));
    });

    return () => {
      active = false;
    };
  }, [position, tilesetInfo]);

  const plotElRef = useCallback((node) => {
    setPlotEl(node);
  }, []);

  // Derived State
  const isInit = useMemo(() => !!tilesetInfo, [tilesetInfo]);

  const data = useMemo(
    () => {
      if (!tile) return undefined;

      let maxScore = 0;
      let minAbsDistance = Infinity;
      let maxAbsDistance = 0;
      const genes = {};
      const categoryAggregation = {};

      Object.entries(categories).forEach(([name, category]) => {
        categoryAggregation[name] = {
          category,
          numEnhancers: 0,
        };
      });

      const distComparator = (a, b) => a.absDistance - b.absDistance;
      const genesUpstreamByDist = new TinyQueue([], distComparator);
      const genesDownstreamByDist = new TinyQueue([], distComparator);

      tile.forEach((entry) => {
        const geneName = entry.fields[6];

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
            genes[geneName].samplesByCategory[name] = [];
            genes[geneName].samplesByCategory[name].size = size;
          });

          minAbsDistance = Math.min(minAbsDistance, absDistance);
          maxAbsDistance = Math.max(maxAbsDistance, absDistance);

          if (isDownstream) genesDownstreamByDist.push(genes[geneName]);
          else genesUpstreamByDist.push(genes[geneName]);
        }

        const sample = entry.fields[10];
        genes[geneName].samplesByCategory[samples[sample].name].push({
          gene: geneName,
          sample,
          sampleCategory: samples[sample].name,
          value: entry.importance,
        });
        maxScore = Math.max(maxScore, entry.importance);
        categoryAggregation[samples[sample].name].numEnhancers++;
      });

      const genesDownstreamByDistArr = [];
      while (genesDownstreamByDist.length)
        genesDownstreamByDistArr.push(genesDownstreamByDist.pop());

      const genesUpstreamByDistArr = [];
      while (genesUpstreamByDist.length)
        genesUpstreamByDistArr.push(genesUpstreamByDist.pop());

      genesDownstreamByDistArr.forEach((gene, i) => {
        const prevGene = genesDownstreamByDistArr[i - 1];
        gene.relDistance =
          gene.position - ((prevGene && prevGene.position) || relPosition);
      });

      genesUpstreamByDistArr.forEach((gene, i) => {
        const prevGene = genesDownstreamByDistArr[i - 1];
        gene.relDistance =
          ((prevGene && prevGene.position) || relPosition) - gene.position;
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
    [tile]
  );

  // Initialization
  useEffect(
    () => {
      (async () => {
        const response = await fetch(`${server}/tileset_info/?d=${uuid}`);
        const results = await response.json();

        if (results[uuid]) setTilesetInfo(results[uuid]);
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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

  useEffect(
    () => {
      plotEnhancerGeneConnections(plotEl, width, data, {
        geneCellEncoding,
        prevGeneCellEncoding,
        genePadding,
      });
    },
    // `prevGeneCellEncoding` is ommitted on purpose to avoid circular updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plotEl, width, data, geneCellEncoding, genePadding]
  );

  return (
    <Grid container style={styles}>
      {isInit ? (
        <Grid item className={classes.plot}>
          <svg ref={plotElRef} className={classes.plotSvg}>
            <g id="enhancers"></g>
            <g id="gene-distance-axis"></g>
            <g id="genes-upstream"></g>
            <g id="genes-downstream"></g>
          </svg>
        </Grid>
      ) : (
        <CircularProgress />
      )}
    </Grid>
  );
};

EnhancerGenePlot.defaultProps = {
  geneCellEncoding: 'distribution',
  position: null,
  relPosition: null,
  genePadding: false,
  styles: {},
};

EnhancerGenePlot.propTypes = {
  geneCellEncoding: PropTypes.oneOf(['number', 'percent', 'distribution']),
  position: PropTypes.number,
  relPosition: PropTypes.number,
  genePadding: PropTypes.bool,
  styles: PropTypes.object,
};

export default EnhancerGenePlot;
