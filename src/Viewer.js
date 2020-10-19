import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HiGlassComponent } from 'higlass';
import { debounce, deepClone, isString, pipe } from '@flekschas/utils';
import AppBar from '@material-ui/core/AppBar';
import Backdrop from '@material-ui/core/Backdrop';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Fade from '@material-ui/core/Fade';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import Modal from '@material-ui/core/Modal';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Popover from '@material-ui/core/Popover';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Switch from '@material-ui/core/Switch';
import Toolbar from '@material-ui/core/Toolbar';
import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import HelpIcon from '@material-ui/icons/Help';
import SearchIcon from '@material-ui/icons/Search';

import Logo from './Logo';
import SearchField from './SearchField';

import useQueryString from './use-query-string';
import usePrevious from './use-previous';
import { toAbsPosition, toFixed } from './utils';
import {
  DEFAULT_X_DOMAIN_START,
  DEFAULT_X_DOMAIN_END,
  DEFAULT_VIEW_CONFIG_ENHANCER,
  DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY,
  GENE_SEARCH_URL,
  VARIANT_SEARCH_URL,
} from './constants';

import 'higlass/dist/hglib.css';
import './Viewer.css';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  black: {
    color: 'black',
  },
  gray: {
    color: theme.palette.grey['400'],
  },
  pink: {
    color: '#cc0078',
  },
  root: {
    position: 'absolute',
    display: 'flex',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  h1: {
    height: '100%',
    margin: '0',
    padding: '0',
    fontSize: '1rem',
    lineHeight: '1rem',
    fontWeight: 'bold',
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: '0.25rem',
    boxShadow: theme.shadows[4],
    maxWidth: '60rem',
    padding: theme.spacing(2, 4),
    outline: 0,
    '&>h2': {
      display: 'flex',
      justifyContent: 'center',
      margin: theme.spacing(2, 0, 3),
    },
    '&>p': {
      fontSize: '1.125em',
    },
  },
  startExploring: {
    color: 'white',
    background: '#cc0078 linear-gradient(45deg, #cc0078 30%, #cc0066 90%)',
    boxShadow: '0 1px 6px 1px rgba(255, 76, 151, .3)',
    '&:hover': {
      boxShadow: '0 1px 6px 1px rgba(255, 76, 151, .5)',
    },
    '&:focus': {
      boxShadow: '0 1px 6px 1px rgba(255, 76, 151, .5)',
    },
  },
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    color: theme.palette.common.black,
    backgroundColor: theme.palette.common.white,
    boxShadow: `0 1px 0 0 ${theme.palette.grey['300']}`,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  textInput: {
    minWidth: '100%',
  },
  toolbar: theme.mixins.toolbar,
  content: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    padding: theme.spacing(1),
    backgroundColor: 'white',
  },
  grow: {
    flexGrow: 1,
  },
  higlass: {
    display: 'flex',
    flexGrow: 1,
  },
  higlassEnhancer: {
    flexGrow: 1,
    margin: '-8px 0 -8px -8px',
  },
  higlassDnaAccessibility: {
    width: '20rem',
    margin: '-8px -8px -8px 0',
  },
  higlassTitleBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    padding: '2px',
    fontSize: '0.8rem',
    background: theme.palette.grey['100'],
  },
  higlassTitleBarTitle: {
    padding: '0 2px',
    fontSize: '0.8rem',
  },
  higlassTitleBarHelp: {
    color: theme.palette.grey['400'],
    '&:hover': {
      color: 'black',
    },
  },
  higlassTitleBarHelpPopeover: {
    maxWidth: '20rem',
    padding: '0.5rem',
    fontSize: '0.8rem',
  },
  higlassEnhancerInfoBar: {
    padding: '2px 4px',
    color: theme.palette.grey['600'],
  },
  higlassDnaAccessibilityInfoBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 4px',
    color: theme.palette.grey['600'],
  },
  higlassSeparator: {
    width: 1,
    margin: '-8px 0',
    background: theme.palette.grey['300'],
  },
  toolbarExtra: {
    paddingLeft: 0,
    paddingRight: 0,
    alignItems: 'flex-end',
  },
}));

const chrPosUrlEncoder = (chrPos) =>
  chrPos ? chrPos.replace(':', '.') : chrPos;

const chrPosUrlDecoder = (chrPos) =>
  chrPos ? chrPos.replace('.', ':') : chrPos;

const getFocusGeneRegion = (viewConfig) => {
  return viewConfig.views[0].overlays[1] &&
    viewConfig.views[0].overlays[1].options.extent &&
    viewConfig.views[0].overlays[1].options.extent.length
    ? [...viewConfig.views[0].overlays[1].options.extent[0]]
    : null;
};

const getFocusVariantRegion = (viewConfig) =>
  viewConfig.views[0].tracks.top[2].options.focusRegion
    ? [...viewConfig.views[0].tracks.top[2].options.focusRegion]
    : null;

const updateViewConfigXDomain = (newXDomainStart, newXDomainEnd, force) => (
  viewConfig
) => {
  const xDomain = [...viewConfig.views[0].initialXDomain];
  const focusGeneRegion = getFocusGeneRegion(viewConfig);
  const focusVariantRegion = getFocusVariantRegion(viewConfig);

  if (!Number.isNaN(+newXDomainStart)) {
    xDomain[0] = newXDomainStart;
  }
  if (!Number.isNaN(+newXDomainEnd)) {
    xDomain[1] = newXDomainEnd;
  }

  if (focusGeneRegion && !force) {
    xDomain[0] = focusGeneRegion[0] - 100000;
    xDomain[1] = focusGeneRegion[1] + 100000;
  }

  if (focusVariantRegion && !force) {
    xDomain[0] = Math.min(xDomain[0], focusVariantRegion[0] - 100000);
    xDomain[1] = Math.max(xDomain[1], focusVariantRegion[1] + 100000);
  }

  viewConfig.views[0].initialXDomain = xDomain;

  return viewConfig;
};

const updateViewConfigFocusGene = (gene, start, end) => (viewConfig) => {
  const n = viewConfig.views[0].tracks.top.length;

  if (gene) {
    viewConfig.views[0].tracks.top[n - 1].options.focusGene = gene;
    viewConfig.views[0].overlays[1].options.extent = [[start, end]];
  } else {
    delete viewConfig.views[0].tracks.top[n - 1].options.focusGene;
    delete viewConfig.views[0].overlays[1].options.extent;
  }

  return viewConfig;
};

const updateViewConfigFocusVariant = (position, trackIdxs = []) => (
  viewConfig
) => {
  if (Number.isNaN(+position) || position === null) {
    trackIdxs.forEach((trackIdx) => {
      delete viewConfig.views[0].tracks.top[trackIdx].options.focusRegion;
    });
    viewConfig.views[0].overlays[0].options.extent = [];
  } else {
    const focusRegion = [position - 0.5, position + 0.5];
    trackIdxs.forEach((trackIdx) => {
      viewConfig.views[0].tracks.top[
        trackIdx
      ].options.focusRegion = focusRegion;
    });

    viewConfig.views[0].overlays[0].options.extent = [focusRegion];
  }

  return viewConfig;
};

const updateViewConfigFocusStyle = (hideUnfocused) => (viewConfig) => {
  viewConfig.views[0].tracks.top[4].options.focusStyle =
    hideUnfocused === 'true' ? 'filtering' : 'highlighting';
  viewConfig.views[0].tracks.top[4].options.stratification.axisNoGroupColor =
    hideUnfocused !== 'true';

  return viewConfig;
};

const updateViewConfigVariantYScale = (yScale) => (viewConfig) => {
  viewConfig.views[0].tracks.top[2].options.valueColumn =
    yScale === 'pValue' ? 7 : 8;

  return viewConfig;
};

const updateViewConfigMatrixColoring = (coloring) => (viewConfig) => {
  viewConfig.views[0].tracks.top[4].options.opacityEncoding = coloring;
  return viewConfig;
};

const updateViewConfigDnaAccessLabels = (labels) => (viewConfig) => {
  viewConfig.views[0].tracks.top[3].options.showRowLabels =
    !labels || labels === 'hidden' ? false : labels;
  return viewConfig;
};

const Viewer = (props) => {
  const [infoOpen, setInfoOpen] = useQueryString('info', true, {
    decoder: (v) => v === 'true',
  });
  const [focusGene, setFocusGene] = useQueryString('gene', '');
  const [focusVariant, setFocusVariant] = useQueryString(
    'variant',
    'rs1250566'
  );
  const [hideUnfocused, setHideUnfocused] = useQueryString('hide-unfocused');
  const [matrixColoring, setMatrixColoring] = useQueryString(
    'matrix-coloring',
    'solid'
  );
  const [variantYScale, setVariantYScale] = useQueryString(
    'varient-scale',
    'pValue'
  );
  const [dnaAccessLabels, setDnaAccessLabels] = useQueryString(
    'access-labels',
    'indicator'
  );
  const [xDomainStart, setXDomainStart] = useQueryString(
    'start',
    props.chromInfo.absToChr(DEFAULT_X_DOMAIN_START).slice(0, 2).join(':'),
    {
      encoder: chrPosUrlEncoder,
      decoder: chrPosUrlDecoder,
    }
  );
  const [xDomainEnd, setXDomainEnd] = useQueryString(
    'end',
    props.chromInfo.absToChr(DEFAULT_X_DOMAIN_END).slice(0, 2).join(':'),
    {
      encoder: chrPosUrlEncoder,
      decoder: chrPosUrlDecoder,
    }
  );

  const [focusGeneOption, setFocusGeneOption] = useState(null);
  const [focusVariantOption, setFocusVariantOption] = useState(null);
  const prevFocusGeneOption = usePrevious(focusGeneOption);
  const prevFocusVariantOption = usePrevious(focusVariantOption);
  const higlassEnhancerApi = useRef(null);
  const higlassDnaAccessApi = useRef(null);
  const [
    higlassEnhancerHelpAnchorEl,
    setHiglassEnhancerHelpAnchorEl,
  ] = useState(null);
  const [
    higlassDnaAccessHelpAnchorEl,
    setHiglassDnaAccessHelpAnchorEl,
  ] = useState(null);

  // Derived State
  const focusGeneVariantOptions = useMemo(
    () => {
      const _focusGeneVariant = [];
      // Add the focus element that has not changed first!
      if (focusGeneOption && focusGeneOption === prevFocusGeneOption)
        _focusGeneVariant.push(focusGeneOption);
      if (focusVariantOption && focusVariantOption === prevFocusVariantOption)
        _focusGeneVariant.push(focusVariantOption);
      // Now add the focused element that has changed!
      if (focusGeneOption && focusGeneOption !== prevFocusGeneOption)
        _focusGeneVariant.push(focusGeneOption);
      if (focusVariantOption && focusVariantOption !== prevFocusVariantOption)
        _focusGeneVariant.push(focusVariantOption);
      return _focusGeneVariant;
    },
    // `prevFocusGeneOption` and `prevFocusVariantOption` are ommitted
    // on purpose to avoid circular updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusGeneOption, focusVariantOption]
  );

  const focusGeneStartPosition = useMemo(
    () =>
      focusGeneOption
        ? toAbsPosition(
            `${focusGeneOption.chr}:${focusGeneOption.txStart}`,
            props.chromInfo
          )
        : null,
    [focusGeneOption, props.chromInfo]
  );

  const focusGeneEndPosition = useMemo(
    () =>
      focusGeneOption
        ? toAbsPosition(
            `${focusGeneOption.chr}:${focusGeneOption.txEnd}`,
            props.chromInfo
          )
        : null,
    [focusGeneOption, props.chromInfo]
  );

  const focusVariantPosition = useMemo(
    () =>
      focusVariantOption
        ? toAbsPosition(
            `${focusVariantOption.chr}:${focusVariantOption.txStart}`,
            props.chromInfo
          )
        : null,
    [focusVariantOption, props.chromInfo]
  );

  const xDomainStartAbs = useMemo(
    () => toAbsPosition(xDomainStart, props.chromInfo),
    [xDomainStart, props.chromInfo]
  );

  const xDomainEndAbs = useMemo(
    () => toAbsPosition(xDomainEnd, props.chromInfo),
    [xDomainEnd, props.chromInfo]
  );

  const viewConfigEnhancer = useMemo(
    () =>
      pipe(
        updateViewConfigFocusGene(
          focusGeneOption ? focusGeneOption.geneName : null,
          focusGeneStartPosition,
          focusGeneEndPosition
        ),
        updateViewConfigFocusVariant(focusVariantPosition, [2, 4]),
        updateViewConfigFocusStyle(hideUnfocused),
        updateViewConfigMatrixColoring(matrixColoring),
        updateViewConfigVariantYScale(variantYScale),
        updateViewConfigXDomain(xDomainStartAbs, xDomainEndAbs)
      )(deepClone(DEFAULT_VIEW_CONFIG_ENHANCER)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // `xDomainStartAbs` and `xDomainEndAbs` are ommitted on purpose to avoid
      // updating the view-config on every pan or zoom event.
      focusGeneOption,
      focusGeneStartPosition,
      focusGeneEndPosition,
      focusVariantPosition,
      hideUnfocused,
      matrixColoring,
      variantYScale,
    ]
  );

  const viewConfigDnaAccessibility = useMemo(
    () =>
      pipe(
        updateViewConfigFocusVariant(focusVariantPosition, [2]),
        updateViewConfigVariantYScale(variantYScale),
        updateViewConfigDnaAccessLabels(dnaAccessLabels),
        updateViewConfigXDomain(
          focusVariantPosition ? focusVariantPosition - 2500 : xDomainStartAbs,
          focusVariantPosition ? focusVariantPosition + 2500 : xDomainEndAbs,
          true
        )
      )(deepClone(DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // `xDomainStartAbs` and `xDomainEndAbs` are ommitted on purpose to avoid
      // updating the view-config on every pan or zoom event.
      focusVariantPosition,
      variantYScale,
      dnaAccessLabels,
      props.chromInfo,
    ]
  );

  const dnaAccessibilityRegionSize = useMemo(
    () =>
      focusVariantPosition
        ? 5
        : Math.round((xDomainEndAbs - xDomainStartAbs) / 1000),
    [focusVariantPosition, xDomainStartAbs, xDomainEndAbs]
  );

  const numericalXDomainStart = useMemo(
    () =>
      isString(xDomainStart) && xDomainStart.indexOf(':') >= 0
        ? props.chromInfo.chrToAbs([
            xDomainStart.split(':')[0],
            +xDomainStart.split(':')[1],
          ])
        : +xDomainStart,
    [xDomainStart, props.chromInfo]
  );

  const numericalXDomainEnd = useMemo(
    () =>
      isString(xDomainEnd) && xDomainEnd.indexOf(':') >= 0
        ? props.chromInfo.chrToAbs([
            xDomainEnd.split(':')[0],
            +xDomainEnd.split(':')[1],
          ])
        : +xDomainEnd,
    [xDomainEnd, props.chromInfo]
  );

  const clearFocusGene = () => {
    setFocusGene('');
    setFocusGeneOption(null);
  };

  const focusGeneChangeHandler = (newValue) => {
    if (newValue) {
      setFocusGene(newValue.geneName);
      setFocusGeneOption(newValue);
    } else {
      clearFocusGene();
    }
  };

  const clearFocusVariant = () => {
    setFocusVariant('');
    setFocusVariantOption(null);
  };

  const focusVariantChangeHandler = (newValue) => {
    if (newValue) {
      setFocusVariant(newValue.geneName);
      setFocusVariantOption(newValue);
    } else {
      clearFocusVariant();
    }
  };

  const focusGeneVariantChangeHandler = (newValues) => {
    if (newValues.length) {
      const newFocusElements = {};
      // We only allow exactly two selections
      newValues.slice(newValues.length - 2).forEach((newValue) => {
        switch (newValue.type) {
          case 'gene':
            newFocusElements.gene = newValue;
            if (focusGene !== newValue.geneName) {
              setFocusGene(newValue.geneName);
              setFocusGeneOption(newValue);
            }
            break;

          case 'variant':
            newFocusElements.variant = newValue;
            if (focusVariant !== newValue.geneName) {
              setFocusVariant(newValue.geneName);
              setFocusVariantOption(newValue);
            }
            break;

          default:
            // eslint-disable-next-line no-console
            console.warn('Unknown focus element', newValue);
            break;
        }
      });
      // Unset focus elements
      if (focusGene && !newFocusElements.gene) clearFocusGene();
      if (focusVariant && !newFocusElements.variant) clearFocusVariant();
    } else {
      clearFocusGene();
      clearFocusVariant();
    }
  };

  const hideUnfocusedChangeHandler = (event) => {
    setHideUnfocused(event.target.checked.toString());
  };

  const variantYScaleChangeHandler = (event) => {
    setVariantYScale(event.target.value);
  };

  const matrixColoringChangeHandler = (event) => {
    setMatrixColoring(event.target.value);
  };

  const dnaAccessLabelsChangeHandler = (event) => {
    setDnaAccessLabels(event.target.value);
  };

  const xDomainStartChangeHandler = (event) => {
    setXDomainStart(event.target.value);
  };

  const xDomainEndChangeHandler = (event) => {
    setXDomainEnd(event.target.value);
  };

  // HiGlass Functions
  const higlassClickHandler = (event) => {
    if (event.type === 'gene-annotation') {
      setFocusGene(event.payload.name);
      setFocusGeneOption({
        chr: event.payload.fields[0],
        txStart: event.payload.fields[1],
        txEnd: event.payload.fields[2],
        geneName: event.payload.name,
        type: 'gene',
      });
    } else if (event.type === 'snp') {
      setFocusVariant(event.payload.name);
      setFocusVariantOption({
        chr: event.payload.fields[0],
        txStart: event.payload.fields[1],
        txEnd: event.payload.fields[2],
        geneName: event.payload.name,
        score: event.payload.importance,
        type: 'variant',
      });
    }
  };

  const higlassLocationChangeHandler = (event) => {
    const [newXDomainStart, newXDomainEnd] = event.xDomain.map((absPos) =>
      props.chromInfo.absToChr(absPos).slice(0, 2).join(':')
    );
    setXDomainStart(newXDomainStart);
    setXDomainEnd(newXDomainEnd);
  };
  const higlassLocationChangeHandlerDb = debounce(
    higlassLocationChangeHandler,
    250
  );

  const higlassEnhancerZoomToXDomain = (event) => {
    if (!higlassEnhancerApi.current) return;

    const newViewConfig = deepClone(viewConfigEnhancer);

    const xDomain = [...newViewConfig.views[0].initialXDomain];

    if (!Number.isNaN(+numericalXDomainStart)) {
      xDomain[0] = numericalXDomainStart;
    }
    if (!Number.isNaN(+numericalXDomainEnd)) {
      xDomain[1] = numericalXDomainEnd;
    }

    higlassEnhancerApi.current.zoomTo(
      'context',
      xDomain[0],
      xDomain[1],
      xDomain[0],
      xDomain[1],
      2000
    );
  };

  // Initializations
  useEffect(
    () => {
      (async () => {
        if (focusGene && !focusGeneOption) {
          const r = await fetch(`${GENE_SEARCH_URL}&ac=${focusGene}`);
          const results = await r.json();
          const result = results[0];
          result.type = 'gene';
          focusGeneChangeHandler(results[0]);
        }
        if (focusVariant && !focusVariantOption) {
          const r = await fetch(`${VARIANT_SEARCH_URL}&ac=${focusVariant}`);
          const results = await r.json();
          const result = results[0];
          result.type = 'variant';
          focusVariantChangeHandler(results[0]);
        }
      })();
    },
    // Execute only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const higlassEnhancerInitHandler = useCallback(
    (higlassInstance) => {
      if (higlassInstance !== null) {
        higlassEnhancerApi.current = higlassInstance.api;
        higlassInstance.api.on('click', higlassClickHandler);
        higlassInstance.api.on(
          'location',
          higlassLocationChangeHandlerDb,
          'context'
        );
      }
    },
    // Execute only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const higlassDnaAccessibilityInitHandler = useCallback((higlassInstance) => {
    if (higlassInstance !== null) {
      higlassDnaAccessApi.current = higlassInstance.api;
    }
  }, []);

  const higlassEnhancerHelpClickHandler = (event) => {
    setHiglassEnhancerHelpAnchorEl(event.currentTarget);
  };

  const higlassEnhancerHelpCloseHandler = () => {
    setHiglassEnhancerHelpAnchorEl(null);
  };

  const higlassDnaAccessHelpClickHandler = (event) => {
    setHiglassDnaAccessHelpAnchorEl(event.currentTarget);
  };

  const higlassDnaAccessHelpCloseHandler = () => {
    setHiglassDnaAccessHelpAnchorEl(null);
  };

  const higlassEnhancerHelpOpen = Boolean(higlassEnhancerHelpAnchorEl);
  const higlassEnhancerHelpId = higlassEnhancerHelpOpen
    ? 'simple-popover'
    : undefined;

  const higlassDnaAccessHelpOpen = Boolean(higlassDnaAccessHelpAnchorEl);
  const higlassDnaAccessHelpId = higlassEnhancerHelpOpen
    ? 'simple-popover'
    : undefined;

  const infoOpenHandler = () => {
    setInfoOpen(true);
  };

  const infoCloseHandler = () => {
    setInfoOpen(false);
  };

  // Run on every render
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar
          classes={{
            root: classes.toolbarExtra,
          }}
        >
          <FormControl fullWidth>
            <SearchField
              label={
                <Grid container direction="row" alignItems="center">
                  <SearchIcon fontSize="small" />
                  <span style={{ marginLeft: 3 }}>Gene or Variant</span>
                </Grid>
              }
              searchUrl={[
                { url: GENE_SEARCH_URL, type: 'gene' },
                { url: VARIANT_SEARCH_URL, type: 'variant' },
              ]}
              onChange={focusGeneVariantChangeHandler}
              value={focusGeneVariantOptions}
              variant="filled"
              larger
              fullWidth
              multiple
            />
          </FormControl>
        </Toolbar>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper,
        }}
        anchor="left"
      >
        <ButtonBase className={classes.toolbar}>
          <h1 className={classes.h1} onClick={infoOpenHandler}>
            <Logo />
          </h1>
        </ButtonBase>
        <Divider />
        <Box m={1}>
          <Box m={0}>
            <FormControl variant="outlined" margin="dense" fullWidth>
              <InputLabel htmlFor="x-domain-start">Region Start</InputLabel>
              <OutlinedInput
                id="x-domain-start"
                label="Region Start"
                onChange={xDomainStartChangeHandler}
                value={xDomainStart}
              />
            </FormControl>
          </Box>
          <Box m={0}>
            <FormControl variant="outlined" margin="dense" fullWidth>
              <InputLabel htmlFor="x-domain-end">Region End</InputLabel>
              <OutlinedInput
                id="x-domain-end"
                label="Region End"
                onChange={xDomainEndChangeHandler}
                value={xDomainEnd}
              />
            </FormControl>
          </Box>
          <Box m={0}>
            <Button
              variant="contained"
              margin="dense"
              onClick={higlassEnhancerZoomToXDomain}
              fullWidth
              disableElevation
            >
              Go
            </Button>
          </Box>
        </Box>
        <Divider />
        <Box m={1}>
          <FormControlLabel
            control={
              <Switch
                checked={hideUnfocused === 'true'}
                onChange={hideUnfocusedChangeHandler}
                name="hideUnfocused"
              />
            }
            label="Hide unfocused"
          />
        </Box>
        <Box m={1}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Variant y-scale</FormLabel>
            <RadioGroup
              aria-label="variantYScale"
              name="variantYScale"
              value={variantYScale}
              onChange={variantYScaleChangeHandler}
            >
              <FormControlLabel
                label="p-value"
                control={<Radio size="small" />}
                value="pValue"
              />
              <FormControlLabel
                label="Posterior probability"
                control={<Radio size="small" />}
                value="posteriorProbability"
              />
            </RadioGroup>
          </FormControl>
        </Box>
        <Box m={1}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Matrix coloring</FormLabel>
            <RadioGroup
              aria-label="matrixColoring"
              name="matrixColoring"
              value={matrixColoring}
              onChange={matrixColoringChangeHandler}
            >
              <FormControlLabel
                label="Solid"
                control={<Radio size="small" />}
                value="solid"
              />
              <FormControlLabel
                label="Number of predictions"
                control={<Radio size="small" />}
                value="frequency"
              />
              <FormControlLabel
                label="Highest prediction score"
                control={<Radio size="small" />}
                value="highestImportance"
              />
              <FormControlLabel
                label="Prediction score of the closest TSS interaction"
                control={<Radio size="small" />}
                value="closestImportance"
              />
            </RadioGroup>
          </FormControl>
        </Box>
        <Box m={1}>
          <FormControl component="fieldset">
            <FormLabel component="legend">DNA accessibility labels</FormLabel>
            <RadioGroup
              aria-label="dnaAccessLabels"
              name="dnaAccessLabels"
              value={dnaAccessLabels}
              onChange={dnaAccessLabelsChangeHandler}
            >
              <FormControlLabel
                label="Indicator"
                control={<Radio size="small" />}
                value="indicator"
              />
              <FormControlLabel
                label="Text"
                control={<Radio size="small" />}
                value="text"
              />
              <FormControlLabel
                label="Hidden"
                control={<Radio size="small" />}
                value="hidden"
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <div className={classes.higlass}>
          <Grid
            container
            direction="column"
            className={classes.higlassEnhancer}
          >
            <Grid item className={classes.higlassTitleBar}>
              <Typography
                align="center"
                className={classes.higlassTitleBarTitle}
                noWrap
              >
                <strong>Predicted Enhancers</strong>
              </Typography>
              <IconButton
                aria-label="help"
                aria-describedby={higlassEnhancerHelpId}
                className={classes.higlassTitleBarHelp}
                size="small"
                onClick={higlassEnhancerHelpClickHandler}
              >
                <HelpIcon fontSize="inherit" />
              </IconButton>
              <Popover
                id={higlassEnhancerHelpId}
                open={higlassEnhancerHelpOpen}
                anchorEl={higlassEnhancerHelpAnchorEl}
                onClose={higlassEnhancerHelpCloseHandler}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <Typography className={classes.higlassTitleBarHelpPopeover}>
                  This panel visualizes the predicted enhancers by sample type
                  as a matrix-like track. Each rectangle representes an
                  enhancer. You can filter enhancers via their target gene or by
                  variant (the dot plot below the gene annotations). Click on a
                  variant or gene to select it. Selections are shown in
                  pink/red.
                </Typography>
              </Popover>
            </Grid>
            <Grid item className={classes.grow}>
              <HiGlassComponent
                ref={higlassEnhancerInitHandler}
                viewConfig={viewConfigEnhancer}
                options={{
                  sizeMode: 'bounded',
                }}
              />
            </Grid>
            <Grid item className={classes.higlassEnhancerInfoBar}>
              {focusGene && focusVariant && (
                <Typography className={classes.higlassTitleBarTitle} noWrap>
                  <span className={classes.pink}>■</span> Enhancers containing{' '}
                  <em>{focusVariant}</em> and predicted to regulate{' '}
                  <em>{focusGene}</em>
                </Typography>
              )}
              {focusGene && !focusVariant && (
                <Typography className={classes.higlassTitleBarTitle} noWrap>
                  <span className={classes.pink}>■</span> Enhancers predicted to
                  regulate <em>{focusGene}</em>
                </Typography>
              )}
              {!focusGene && focusVariant && (
                <Typography className={classes.higlassTitleBarTitle} noWrap>
                  <span className={classes.pink}>■</span> Enhancers containing{' '}
                  <em>{focusVariant}</em>
                </Typography>
              )}
              {focusGene || focusVariant ? (
                <Typography className={classes.higlassTitleBarTitle} noWrap>
                  <span className={classes.gray}>■</span> All other predicted
                  enhancers
                </Typography>
              ) : (
                <Typography className={classes.higlassTitleBarTitle} noWrap>
                  <span className={classes.black}>■</span> All predicted
                  enhancers
                </Typography>
              )}
            </Grid>
          </Grid>
          <div className={classes.higlassSeparator} />
          <Grid
            container
            direction="column"
            className={classes.higlassDnaAccessibility}
          >
            <Grid item className={classes.higlassTitleBar}>
              <Typography
                align="center"
                className={classes.higlassTitleBarTitle}
                noWrap
              >
                <strong>DNA Accessibility</strong>
              </Typography>
              <IconButton
                aria-label="help"
                aria-describedby={higlassDnaAccessHelpId}
                className={classes.higlassTitleBarHelp}
                size="small"
                onClick={higlassDnaAccessHelpClickHandler}
              >
                <HelpIcon fontSize="inherit" />
              </IconButton>
              <Popover
                id={higlassDnaAccessHelpId}
                open={higlassDnaAccessHelpOpen}
                anchorEl={higlassDnaAccessHelpAnchorEl}
                onClose={higlassDnaAccessHelpCloseHandler}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <Typography className={classes.higlassTitleBarHelpPopeover}>
                  This panel visualizes the DNA accessibility of all 131
                  samples. Each track is individually normalized. Mouse over a
                  track to see the underlying value. To focus on a specific
                  locus specify a focus variant.
                </Typography>
              </Popover>
            </Grid>
            <Grid item className={classes.grow}>
              <HiGlassComponent
                ref={higlassDnaAccessibilityInitHandler}
                viewConfig={viewConfigDnaAccessibility}
                options={{
                  sizeMode: 'scroll',
                  pixelPreciseMarginPadding: true,
                  containerPaddingX: 0,
                  containerPaddingY: 0,
                  viewMarginTop: 0,
                  viewMarginBottom: 0,
                  viewMarginLeft: 0,
                  viewMarginRight: 0,
                  viewPaddingTop: 0,
                  viewPaddingBottom: 0,
                  viewPaddingLeft: 0,
                  viewPaddingRight: 16,
                }}
              />
            </Grid>
            <Grid item className={classes.higlassDnaAccessibilityInfoBar}>
              <span>├</span>
              <Typography
                align="center"
                className={classes.higlassTitleBarTitle}
                noWrap
              >
                {toFixed(dnaAccessibilityRegionSize, 1)}{' '}
                <abbr title="kilo base pairs">kbp</abbr>
              </Typography>
              <span>┤</span>
            </Grid>
          </Grid>
        </div>
      </main>
      <Modal
        aria-labelledby="info-title"
        aria-describedby="info-description"
        className={classes.modal}
        open={infoOpen}
        onClose={infoCloseHandler}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 250,
        }}
      >
        <Fade in={infoOpen}>
          <div className={classes.paper}>
            <Typography
              id="info-title"
              align="center"
              variant="h5"
              component="h2"
              noWrap
            >
              <Logo
                styles={{
                  width: 'auto',
                }}
              />
            </Typography>
            <p id="info-description">
              This web application visualizes genome-wide enhancer-gene
              interactions that were predicted with the{' '}
              <em>Activity-By-Contact</em> (ABC) model. You can interactively
              browse the entire human genome and filter enhancers by gene and
              containing variant.
            </p>
            <p>
              For information regarding the ABC model please refer to our
              initial publication:{' '}
              <a
                href="https://www.nature.com/articles/s41588-019-0538-0"
                target="_blank"
                rel="noopener noreferrer"
              >
                Fulco et al., Activity-by-contact model of enhancer–promoter
                regulation from thousands of CRISPR perturbations,{' '}
                <em>Nature Genetics</em> (2019)
              </a>
              .
            </p>
            <Typography align="center">
              <Button
                className={classes.startExploring}
                onClick={infoCloseHandler}
                variant="contained"
                primary
                disableElevation
              >
                Start Exploring!
              </Button>
            </Typography>
          </div>
        </Fade>
      </Modal>
    </div>
  );
};

export default Viewer;
