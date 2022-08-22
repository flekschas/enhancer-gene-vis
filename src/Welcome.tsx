import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { useRecoilValue } from 'recoil';
import SettingsIcon from '@material-ui/icons/Settings';
import { makeStyles } from '@material-ui/core/styles';

import Logo from './Logo';

import {
  showWelcomeState,
  WelcomeIntroState,
} from './state/app-settings-state';

import imgEnhancerView1 from './images/enhancer-view-1.png';
import imgEnhancerView2 from './images/enhancer-view-2.png';
import imgEnhancerView3 from './images/enhancer-view-3.png';
import imgEnhancerView4 from './images/enhancer-view-4.png';
import imgEnhancerView5 from './images/enhancer-view-5.png';
import imgGeneView1 from './images/gene-view-1.png';
import imgGeneView2 from './images/gene-view-2.png';

const useStyles = makeStyles((theme) => ({
  root: {
    '&>p': {
      fontSize: '1.125em',
    },
  },
  title: {
    display: 'flex',
    justifyContent: 'center',
    margin: theme.spacing(2, 0, 3),
  },
  note: {
    color: theme.palette.grey['400'],
    marginTop: '1em',
  },
  icon: {
    color: theme.palette.grey['400'],
    '&:hover': {
      color: 'black',
    },
  },
  showIntro: {
    minWidth: '10.5rem',
    marginRight: '0.5rem',
  },
  startExploring: {
    minWidth: '10.5rem',
    marginLeft: '0.5rem',
    color: 'white',
    background: '#cc0078 linear-gradient(45deg, #cc0078 30%, #cc0066 90%)',
    boxShadow: '0 1px 6px 1px rgba(255, 76, 151, .3)',
    '&:hover': {
      boxShadow: '0 1px 6px 1px rgba(255, 76, 151, .5)',
      background: '#d90080 linear-gradient(45deg, #d90080 30%, #d9006c 90%)',
    },
    '&:focus': {
      boxShadow: '0 1px 6px 1px rgba(255, 76, 151, .5)',
    },
  },
  introTitle: {
    fontSize: '2.75em',
    letterSpacing: '-0.075rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    '&+h3': {
      marginTop: 16,
    },
  },
  introHeadline: {
    fontSize: '1.5em',
    fontWeight: 700,
    margin: theme.spacing(6, 0, 2, 0),
  },
  introSubHeadline: {
    fontSize: '1.125em',
    fontWeight: 700,
    margin: theme.spacing(2, 0, 1, 0),
  },
  introStartExploring: {
    margin: theme.spacing(4, 0, 2, 0),
  },
  figure: {
    margin: theme.spacing(4, 6),
    '& img': {
      width: '100%',
      height: 'auto',
    },
  },
}));

type WelcomeProps = {
  closeHandler: (e: React.MouseEvent<HTMLButtonElement>) => void;
  openIntroHandler: (e: React.MouseEvent<HTMLButtonElement>) => void;
  closeIntroHandler: (e: React.MouseEvent<HTMLButtonElement>) => void;
};
const Welcome = React.memo(function Welcome({
  closeHandler,
  openIntroHandler,
  closeIntroHandler,
}: WelcomeProps) {
  const showWelcome = useRecoilValue(showWelcomeState);

  const classes = useStyles();

  if (showWelcome === WelcomeIntroState.SHOW_DETAILED)
    return (
      <div className={classes.root}>
        <Typography
          id="intro-title"
          align="center"
          variant="h2"
          component="h2"
          noWrap
          className={classes.introTitle}
        >
          Introduction
        </Typography>
        <Typography
          id="intro-enhancer-view"
          align="center"
          variant="h3"
          component="h3"
          noWrap
          className={classes.introHeadline}
        >
          1. Enhancer-Centered View
        </Typography>
        <p>
          The goal of this web application is to provide a visual interface to
          enhancer-gene connections predicted by the{' '}
          <em>Activity-By-Contact</em> (ABC) model. Enhancers are genomic
          regions that have the ability to regulate the activity of nearby
          genes. One way to visualize this regulatory connection is by drawing
          an arc between the enhancer region and the gene as follows:
        </p>
        <figure className={classes.figure}>
          <img src={imgEnhancerView1} alt="Enhancer-Gene Connection Overview" />
        </figure>
        <p>
          However, enhancers are not always active in every cell type or sample.
          Hence, in reality the looks more like below where <em>Enhancer 1</em>{' '}
          is inactive in <em>Sample 1</em> while <em>Enhancer 2</em> is inactive
          in <em>Sample 3</em>.
        </p>
        <figure className={classes.figure}>
          <img
            src={imgEnhancerView2}
            alt="Enhancer-Gene Connection By Sample"
          />
        </figure>
        <p>
          Since we have predicted enhancer-gene connections across 131 samples,
          showing all arcs at once or having a separate arc track for each
          sample is not very effective visually. In other words, it would either
          be hard to differentiate samples in case we show all arcs in one track
          or it would be impossible to get a complete overview due the vertical
          space consumption if we showed a separate arc track for each sample.
        </p>
        <p>
          Therefore, we separately visualize the distribution of outgoing and
          incoming arcs as shown below. Each sample is represented by a row and
          an active enhancer region (outgoing arc) is displayed as a rectangle.
          For the regulated genes, we are drawing a bar that encodes the number
          of enhancers (i.e., incoming arcs) regulating this gene as the height.
        </p>
        <figure className={classes.figure}>
          <img
            src={imgEnhancerView3}
            alt="Optimized Enhancer-Gene Connection Representation"
          />
        </figure>
        <p>
          While we loose some details (no worries, we will bring those details
          back), this representation is visually much more scalable. To make
          this visualization more effective we can sort similar samples into
          groups and add color to help distinguish between the different sample
          groups.
        </p>
        <figure className={classes.figure}>
          <img
            src={imgEnhancerView4}
            alt="Sample-Grouped Enhancer-Gene Connection Representation"
          />
        </figure>
        <p>
          As mentioned above, by separetly visualizing the distribution of
          enhancer regions and the distribution of sample groups regulating
          genes, we are loosing the information which enhancer region regulates
          which gene. We're going to bring this information back by allowing you
          to focus on specific regions and sample groups. For instance, in the
          following example we focused on <em>Gene 2</em>, which will
          subsequently highlight all enhancers regulating this gene (shown in
          pink) and also bring back the arcs to hint at enhancers outside the
          current field of view.
        </p>
        <figure className={classes.figure}>
          <img
            src={imgEnhancerView5}
            alt="Focused Enhancer-Gene Connection Representation"
          />
        </figure>
        <p>
          In the application there are two ways to enable focusing. First, you
          can click on one of the following visual elements: a gene, a variant,
          or an enhancer region. To select a custom focus region you can also
          brush on the genomic position track. Second, you can search for and
          enter a gene (e.g., PPIF), variant (e.g., rs1250566), or custom region
          (e.g., chr1:1-chr2:2, chr10:81230693-80993117, or
          chr10:81230693+10000) in the search bar at the top.
        </p>
        <Typography
          id="intro-enhancer-view-sample-filtering"
          align="center"
          variant="h4"
          component="h4"
          noWrap
          className={classes.introSubHeadline}
        >
          Sample Filtering
        </Typography>
        <p>
          In addition to focusing on certain enhancer-gene connections, you can
          also filter out samples using the list on the side bar. Note that the
          filtering will be applied to all visualizations including the
          Gene-Centered View and the DNA Accessibility View.
        </p>
        <Typography
          id="intro-enhancer-view-genetic-variations"
          align="center"
          variant="h4"
          component="h4"
          noWrap
          className={classes.introSubHeadline}
        >
          Custom Genetic Variations
        </Typography>
        <p>
          To identify critical enhancers, our application includes a track for
          displaying genetic point variations, e.g., disease risk variants.
          These variants are visualized as points that are position either by
          their associated p-value or posterior probability along the y-axis. By
          default, we show <abbr title="">IBD</abbr>
          -associated variants but you can load your variants if you like by
          clicking on <em>Edit Variants</em> in the side bar. There are two
          options for loading custom variants. You can either specify the URL of
          a{' '}
          <a
            href="https://docs.higlass.io/higlass_server.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            HiGlass server
          </a>{' '}
          (which is the underlying genome browser toolkit we are using) and
          tileset UUID of your{' '}
          <a
            href="https://docs.higlass.io/data_preparation.html#bed-files"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>.beddb</code> track
          </a>
          . Or you can load a local
          <a
            href="https://bedtools.readthedocs.io/en/latest/content/general-usage.html#bed-format"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>.bed</code> file
          </a>{' '}
          from your computer. Make sure to specify the correct column number for
          the p-value and posterior probability!
        </p>
        <p>
          <strong>Experimental:</strong> If you want to share a view with a
          custom variant track with your colleagues can either setup your own
          HiGlass server or you can use{' '}
          <a href="https://resgen.io" target="_blank" rel="noopener noreferrer">
            Resgen.io
          </a>
          &mdash;a service for hosting and visualizing genomic data.
        </p>
        <Typography
          id="intro-enhancer-view-settings"
          align="center"
          variant="h4"
          component="h4"
          noWrap
          className={classes.introSubHeadline}
        >
          Settings
        </Typography>
        <p>
          Finally, you can adjust the color encoding of the rectangles
          representing enhancer regions via the settings menu (click on{' '}
          <IconButton size="small" className={classes.icon}>
            <SettingsIcon fontSize="inherit" />
          </IconButton>
          ). By default (<em>Solid</em>) we render rectangles in a solid color
          whenever a region is predicted to regulate at least one gene.
          Alternatively you can choose to encode number of regulated genes as
          the color (<em>Number of predictions</em>). In this case, darker
          rectangles hint at enhancers that regulate many genes. Additionally,
          you can also color rectangles by the highest ABC prediction score (
          <em>Highest prediction score</em>) or the ABC prediction score of the
          connection to the closest gene (<em>Closest prediction score</em>).
        </p>
        <Typography
          id="intro-gene-view"
          align="center"
          variant="h3"
          component="h3"
          noWrap
          className={classes.introHeadline}
        >
          2. Gene-Centered View
        </Typography>
        <p>
          Sometimes it can be insightful to gain an overview of all upstream and
          downstream genes that are regulated by a specific enhancer region.
          That's what this view is for. In the tabular layout, each row
          corresponds to a sample group and the columns represent the genes
          ordered by distance to the enhancer region, which is shown as the
          center column. Hence, genes to the left are upstream of the enhancer
          and genes to the right are downstream. The number of genes/columns is
          limited by the available screen space. For instance, consider the
          following situation, where the numbers in the cells indicate the
          number of enhancer-gene connections across the three sample groups.
        </p>
        <figure className={classes.figure}>
          <img src={imgGeneView1} alt="Gene-Centered View Setup" />
        </figure>
        <p>
          To make this view more effective, the cells encode the percentage of
          samples within a sample group that contain a predicted enhancer-gene
          connection as the rectangle area.
        </p>
        <figure className={classes.figure}>
          <img src={imgGeneView2} alt="Gene-Centered View Visualization" />
        </figure>
        <p>
          For instance, in the example above, <em>Group A&mdash;Gene 2</em> is
          the largest rectangle because three out of four sample from{' '}
          <em>Group A</em> regulate <em>Gene 2</em>. On the other hand,{' '}
          <em>Group C&mdash;Gene 3</em> is the smallest rectangle because only
          one out of 5 samples from <em>Group C</em> regulate <em>Gene 3</em>.
        </p>
        <p>
          For more detais on which exact sample contains a prediction you can
          mouse over a cell.
        </p>
        <Typography
          id="intro-gene-view-settings"
          align="center"
          variant="h4"
          component="h4"
          noWrap
          className={classes.introSubHeadline}
        >
          Settings
        </Typography>
        <p>
          This view offers a couple of additional cell encoding to provide
          different perspectives of the gene regulation landscape of a specific
          enhancer. The rectangle size can also encode the absolute number of
          predicted enhancer-gene connections by sample group (
          <em>Abs. number of predictions</em>).
        </p>
        <p>
          Additionally, you can look at the distribution of enhancer-gene
          connections by their ABC prediction score as a{' '}
          <a
            href="https://flowingdata.com/2016/09/08/beeswarm-plot-in-r-to-show-distributions/"
            target="_blank"
            rel="noopener noreferrer"
          >
            bee swarm plot
          </a>
          (<em>Distribution by prediction score</em>). With this setting, each
          enhancer-gene connection is represented as a small dot and positioned
          on the cell's y-axis by it's ABC prediction score. The closer the dot
          is placed to the top of the cell the higher the prediction score. The
          dots' x position is determined by the number of other dots with a
          similar prediction score. In other words the more dots stack along a
          cell's x-axis the more enhancer-gene Connections have the same
          prediction score.
        </p>
        <p>
          The final visual encoding (<em>Sample array</em>) visualizes
          enhancer-gene connections as filled cells within an invisible grid
          where each sample has a fixed position across all genes. Think of a
          microarray or well plate where each sample allocates a fixed well and
          lights up when this samples contains a enhancer-gene connection. The
          benefit of this encoding is that it allows you to quickly scan cross a
          row to see of the focused enhancer is regulating other genes in the
          same sample. You can even mouse over a well in the array view and it
          highlight the well across the entire row.
        </p>
        <Typography
          id="intro-dna-accessibility-view"
          align="center"
          variant="h3"
          component="h3"
          noWrap
          className={classes.introHeadline}
        >
          3. DNA Accessibility View
        </Typography>
        <p>
          Since the ABC model relies on the DNase I hypersensitivy, we provide
          an accompanying view of the DNA accessibility across all samples for
          quick visual debugging of predicted enhancer regions. The DNase- or
          ATAC-seq measurements, are visualized as a vertically-stacked list of
          line charts. Each row corresponds to a sample and the order of samples
          is the same as in the <em>Enhancer-Centered View</em>. By default,
          each row is individually normalized to focus on shape similarities
          rather than the absolute magnitude (i.e., read count). This behavior
          can be adjusted view the settings.
        </p>
        <Typography align="center" className={classes.introStartExploring}>
          <Button
            className={classes.showIntro}
            onClick={closeIntroHandler}
            variant="contained"
            disableElevation
          >
            Back
          </Button>
          <Button
            className={classes.startExploring}
            onClick={closeHandler}
            variant="contained"
            disableElevation
          >
            Start Exploring!
          </Button>
        </Typography>
        <Typography align="center" className={classes.note}>
          <em>
            You can reopen this tutorial by clicking on "ABC Enhancer-Gene
            Connections" in the upper left corner!
          </em>
        </Typography>
      </div>
    );

  return (
    <div className={classes.root}>
      <Typography
        id="title"
        align="center"
        variant="h5"
        component="h2"
        noWrap
        className={classes.title}
      >
        <Logo
          styles={{
            width: 'auto',
          }}
        />
      </Typography>
      <p id="description">
        This web application visualizes genome-wide enhancer-gene connections
        predicted with the <em>Activity-By-Contact</em> (ABC) model. You can
        interactively browse the entire human genome (hg19), filter enhancers by
        region, gene, or sample, and link enhancers to genetic risk variants.
      </p>
      <p>
        For more background information please refer to our publication:{' '}
        <a
          href="https://www.nature.com/articles/s41586-021-03446-x"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nasser et al., Genome-wide enhancer maps link risk variants to disease
          genes, <em>Nature</em> (2021)
        </a>
        .
      </p>
      <p>
        For more information about the visualizations, please click on{' '}
        <em>Show Introduction</em>. If you find a bug or have ideas for
        improvements, please don't hesitate{' '}
        <a
          href="https://github.com/flekschas/enhancer-gene-vis/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          open an issue on GitHub
        </a>{' '}
        or ping{' '}
        <a
          href="https://twitter.com/flekschas/"
          target="_blank"
          rel="noopener noreferrer"
        >
          @flekschas
        </a>
        .
      </p>
      <Typography align="center">
        <Button
          className={classes.showIntro}
          onClick={openIntroHandler}
          variant="contained"
          disableElevation
        >
          Show Introduction
        </Button>
        <Button
          className={classes.startExploring}
          onClick={closeHandler}
          variant="contained"
          disableElevation
        >
          Start Exploring!
        </Button>
      </Typography>
    </div>
  );
});

export default Welcome;
