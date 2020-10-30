import { scaleBand, scaleLinear, scaleLog, select } from 'd3';
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
  DEFAULT_COLOR_MAP_DARK,
  DEFAULT_COLOR_MAP_LIGHT,
  DEFAULT_STRATIFICATION,
  DEFAULT_VIEW_CONFIG_ENHANCER,
} from './constants';
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

const renderEnhancerGenePlot = (node, width, data, tile) => {
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
    .range([rowHeight - circleRadius - 1, circleRadius + 1]);

  const circleYScale = (v) => circleYScalePost(circleYScalePre(v));

  const distanceHeightScalePre = scaleLinear()
    .domain([data.minAbsDistance, data.maxAbsDistance])
    .range([1, 10])
    .clamp(true);

  const distanceHeightScalePost = scaleLog()
    .domain([1, 10])
    .range([2, paddingBottom])
    .clamp(true);

  const distanceHeightScale = (v) =>
    distanceHeightScalePost(distanceHeightScalePre(v));

  // ---------------------------------------------------------------------------
  // Category summary
  svg
    .select('#enhancers')
    .attr('transform', `translate(${width / 2 - rowHeight / 2}, 0)`);

  // Draw background
  svg
    .select('#enhancers')
    .selectAll('.enhancer-box-bg')
    .data(Object.values(data.categoryAggregation), (d) => d.category.name)
    .join('rect')
    .attr('class', 'enhancer-box-bg')
    .attr(
      'fill',
      (d, i) => DEFAULT_COLOR_MAP_LIGHT[i % DEFAULT_COLOR_MAP_LIGHT.length]
    )
    .attr('x', (d) => (rowHeight - categorySizeScale(d.numEnhancers)) / 2)
    .attr(
      'y',
      (d, i) =>
        i * rowHeight +
        (rowHeight - categorySizeScale(d.numEnhancers)) / 2 +
        paddingTop
    )
    .attr('width', (d) => categorySizeScale(d.numEnhancers))
    .attr('height', (d) => categorySizeScale(d.numEnhancers));

  // Draw text
  svg
    .select('#enhancers')
    .selectAll('.enhancer-box-text')
    .data(Object.values(data.categoryAggregation), (d) => d.category.name)
    .join('text')
    .attr('class', 'enhancer-box-text')
    .attr(
      'fill',
      (d, i) => DEFAULT_COLOR_MAP_DARK[i % DEFAULT_COLOR_MAP_DARK.length]
    )
    .attr('dominant-baseline', 'middle')
    .attr('text-anchor', 'middle')
    .attr('x', rowHeight / 2)
    .attr('y', (d, i) => (i + 0.5) * rowHeight + paddingTop)
    .text((d) => d.numEnhancers);

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
  // Gene setup
  const geneContainerWidth = width / 2 - rowHeight;
  const maxGenes = Math.floor(geneContainerWidth / rowHeight);

  // ---------------------------------------------------------------------------
  // Draw upstream genes
  const genesUpstream = data.genesUpstreamByDist.slice(0, maxGenes).reverse();
  const genesUpstreamScale = scaleBand()
    .domain(genesUpstream.map((d) => d.name))
    .range([0, width / 2 - rowHeight / 2]);

  const genesUpstreamG = svg
    .select('#genes-upstream')
    .selectAll('.gene-upstream')
    .data(genesUpstream, (d) => d.name)
    .join('g')
    .attr('class', 'gene-upstream')
    .attr('transform', (d) => `translate(${genesUpstreamScale(d.name)}, 0)`);

  // Draw labels
  genesUpstreamG
    .append('text')
    .attr('class', 'gene-upstream-label')
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

  // Draw beeswarm plot
  genesUpstreamG
    .selectAll('.gene-upstream-beeswarm')
    .data(
      (d) => Object.values(d.samplesByCategory),
      (d) => d.name
    )
    .join('g')
    .attr('class', 'gene-upstream-beeswarm')
    .attr('transform', (d, i) => `translate(0, ${i * rowHeight + paddingTop})`)
    .attr(
      'fill',
      (d, i) => DEFAULT_COLOR_MAP_DARK[i % DEFAULT_COLOR_MAP_DARK.length]
    )
    .selectAll('circle')
    .data((d) => dodge(d, circleRadius * 2 + circlePadding, circleYScale))
    .join('circle')
    .attr('cx', (d) => genesUpstreamScale.bandwidth() - (d.x + 2))
    .attr('cy', (d) => d.y)
    .attr('r', circleRadius);

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
    .append('rect')
    .attr('class', 'gene-downstream-distance-bar')
    .attr('fill', '#bbbbbb')
    .attr('x', genesUpstreamScale.bandwidth() / 2 - distanceBarWidth / 2)
    .attr('y', Object.values(categories).length * rowHeight + paddingTop)
    .attr('width', distanceBarWidth)
    .attr('height', (d) => distanceHeightScale(d.absDistance));

  // ---------------------------------------------------------------------------
  // Draw downstream genes
  const genesDownstream = data.genesDownstreamByDist.slice(0, maxGenes);
  const genesDownstreamScale = scaleBand()
    .domain(genesDownstream.map((d) => d.name))
    .range([0, width / 2 - rowHeight / 2]);

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
    .append('text')
    .attr('class', 'gene-upstream-label')
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

  // Draw beeswarm plot
  genesDownstreamG
    .selectAll('.gene-downstream-beeswarm')
    .data(
      (d) => Object.values(d.samplesByCategory),
      (d) => d.name
    )
    .join('g')
    .attr('class', 'gene-downstream-beeswarm')
    .attr('transform', (d, i) => `translate(0, ${i * rowHeight + paddingTop})`)
    .attr(
      'fill',
      (d, i) => DEFAULT_COLOR_MAP_DARK[i % DEFAULT_COLOR_MAP_DARK.length]
    )
    .selectAll('circle')
    .data((d) => dodge(d, circleRadius * 2 + circlePadding, circleYScale))
    .join('circle')
    .attr('cx', (d) => d.x + circleRadius + 1)
    .attr('cy', (d) => d.y)
    .attr('r', circleRadius);

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
    .append('rect')
    .attr('class', 'gene-downstream-distance-bar')
    .attr('fill', '#bbbbbb')
    .attr('x', genesDownstreamScale.bandwidth() / 2 - distanceBarWidth / 2)
    .attr('y', Object.values(categories).length * rowHeight + paddingTop)
    .attr('width', distanceBarWidth)
    .attr('height', (d) => distanceHeightScale(d.absDistance));
};

const getDistToClosestElement = (genePos, genes, enhancerPos) =>
  Object.values(genes).reduce(
    (d, gene) => Math.min(Math.abs(genePos - gene.position), d),
    Math.abs(genePos - enhancerPos)
  );

const EnhancerGenePlot = ({ position, relPosition, styles } = {}) => {
  const [plotEl, setPlotEl] = useState(null);
  const [tile, setTile] = useState(null);
  const [tilesetInfo, setTilesetInfo] = useState(null);
  const [width, setWidth] = useState(null);
  const prevWidth = usePrevious(width);

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
      let maxRelDistance = 0;
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
          const relDistance = getDistToClosestElement(
            relGenePos,
            genes,
            relPosition
          );
          genes[geneName] = {
            name: geneName,
            position: relGenePos,
            absDistance,
            relDistance,
            isDownstream,
            samplesByCategory: {},
          };

          Object.keys(categories).forEach((category) => {
            genes[geneName].samplesByCategory[category] = [];
          });

          minAbsDistance = Math.min(minAbsDistance, absDistance);
          maxAbsDistance = Math.max(maxAbsDistance, absDistance);
          maxRelDistance = Math.max(maxRelDistance, relDistance);

          if (isDownstream) genesDownstreamByDist.push(genes[geneName]);
          else genesUpstreamByDist.push(genes[geneName]);
        }

        const sample = entry.fields[10];
        genes[geneName].samplesByCategory[samples[sample].name].push({
          name: geneName,
          value: entry.importance,
        });
        maxScore = Math.max(maxScore, entry.importance);
        categoryAggregation[samples[sample].name].numEnhancers++;
      });

      const scoreScale = scaleLinear()
        .domain([0, genes.maxScore])
        .range([1, 20]);
      const absDistScale = scaleLinear()
        .domain([0, genes.maxAbsDistance])
        .range([1, 20]);
      const relDistScale = scaleLinear()
        .domain([0, genes.maxRelDistance])
        .range([1, 20]);

      const genesDownstreamByDistArr = [];
      while (genesDownstreamByDist.length)
        genesDownstreamByDistArr.push(genesDownstreamByDist.pop());

      const genesUpstreamByDistArr = [];
      while (genesUpstreamByDist.length)
        genesUpstreamByDistArr.push(genesUpstreamByDist.pop());

      return {
        minAbsDistance,
        maxAbsDistance,
        maxRelDistance,
        maxScore,
        scoreScale,
        absDistScale,
        relDistScale,
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
      renderEnhancerGenePlot(plotEl, width, data, tile);
    },
    // `tile` is excluded on purpose because `tile` has already been updated
    // when `data` updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plotEl, width, data]
  );

  return (
    <Grid container style={styles}>
      {isInit ? (
        <Grid item className={classes.plot}>
          <svg ref={plotElRef} className={classes.plotSvg}>
            <g id="genes-upstream"></g>
            <g id="enhancers"></g>
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
  position: null,
  relPosition: null,
  styles: {},
};

EnhancerGenePlot.propTypes = {
  position: PropTypes.number,
  relPosition: PropTypes.number,
  styles: PropTypes.object,
};

export default EnhancerGenePlot;
