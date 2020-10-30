import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HiGlassComponent } from 'higlass';
import {
  debounce,
  deepClone,
  isString,
  nthIndexOf,
  pipe,
} from '@flekschas/utils';

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
import RadioGroup from '@material-ui/core/RadioGroup';
import Switch from '@material-ui/core/Switch';
import Toolbar from '@material-ui/core/Toolbar';
import ButtonBase from '@material-ui/core/ButtonBase';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import HelpIcon from '@material-ui/icons/Help';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import SearchIcon from '@material-ui/icons/Search';

import EnhancerGenePlot from './EnhancerGenePlot';
import Logo from './Logo';
import SearchField from './SearchField';
import Welcome from './Welcome';

import useDebounce from './use-debounce';
import useQueryString from './use-query-string';
import usePrevious from './use-previous';
import { download, toAbsPosition, toFixed } from './utils';
import {
  DEFAULT_X_DOMAIN_START,
  DEFAULT_X_DOMAIN_END,
  DEFAULT_VIEW_CONFIG_ENHANCER,
  DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY,
  GENE_SEARCH_URL,
  VARIANT_SEARCH_URL,
  SVG_SKELETON,
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
    maxHeight: 'calc(100vh - 8rem)',
    overflow: 'auto',
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
  iconRadio: {
    padding: theme.spacing(0.25, 0),
    marginLeft: -theme.spacing(1) / 2,
  },
  iconRadioActive: {
    color: 'black',
  },
  iconRadioLegend: {
    margin: theme.spacing(2, 0, 0.25, 0),
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
  drawerGrid: {
    height: '100%',
  },
  drawerPaper: {
    width: drawerWidth,
  },
  settings: {
    position: 'relative',
    flexGrow: 1,
  },
  settingsContent: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden auto',
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
  fullWidthHeight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  higlass: {
    display: 'flex',
    flexGrow: 1,
  },
  higlassEnhancerContainer: {
    flexWrap: 'nowrap',
    minHeight: '100%',
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
    position: 'relative',
    padding: '2px',
    fontSize: '0.8rem',
    background: theme.palette.grey['100'],
  },
  higlassTitleBarText: {
    fontSize: '0.8rem',
  },
  higlassTitleBarTitle: {
    padding: '0 2px',
    fontWeight: 'bold',
  },
  higlassTitleBarIcon: {
    color: theme.palette.grey['400'],
    '&:hover': {
      color: 'black',
    },
  },
  higlassTitleBarIconActive: {
    color: 'black',
    '&:hover': {
      color: 'black',
    },
  },
  higlassTitleBarHelpPopeover: {
    maxWidth: '20rem',
    padding: '0.5rem',
    fontSize: '0.8rem',
    '&+p': {
      paddingTop: 0,
    },
  },
  higlassInfoBarTitle: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    '&::after': {
      content: ':',
    },
  },
  higlassEnhancerInfoBar: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    minHeight: 'min-content',
    padding: '0 4px',
    color: theme.palette.grey['600'],
    borderTop: `1px solid ${theme.palette.grey['300']}`,
    '&:first-child': {
      borderTop: 0,
    },
    '& >*:first-child': {
      paddingTop: 2,
    },
    '& >*:last-child': {
      paddingBottom: 2,
      borderBottom: `1px solid ${theme.palette.grey['100']}`,
    },
  },
  higlassEnhancerGenePlot: {
    minHeight: '6rem',
  },
  higlassEnhancerGenePlotPlaceholder: {
    minHeight: '6rem',
    fontStyle: 'italic',
    color: theme.palette.grey['600'],
    background: theme.palette.grey['100'],
  },
  higlassDnaAccessibilityInfoBar: {
    color: theme.palette.grey['600'],
    padding: '2px 4px',
    borderBottom: `1px solid ${theme.palette.grey['100']}`,
  },
  higlassDnaAccessibilityInfoBarRegion: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  higlassSeparator: {
    zIndex: 1,
    margin: `-${theme.spacing(1)}px 0`,
    width: 1,
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

const extractSvgCore = (svg) => {
  const fifthLn = nthIndexOf(svg, '\n', 4);
  const lastLn = svg.lastIndexOf('\n');
  const width = +svg.substring(
    svg.indexOf('width="') + 7,
    svg.indexOf('px', svg.indexOf('width="') + 7)
  );
  const height = +svg.substring(
    svg.indexOf('height="') + 8,
    svg.indexOf('px', svg.indexOf('height="') + 8)
  );
  return [svg.substring(fifthLn + 1, lastLn), width, height];
};

const locationSearch = async (query) => {
  if (!query) return undefined;

  const match = query.match(/^chr(\d+):(\d)+$/);
  if (
    match &&
    ((+match[1] > 0 && +match[1] < 23) ||
      +match[1].toLowerCase() === 'x' ||
      +match[1].toLowerCase() === 'y')
  ) {
    return [
      {
        chr: `chr${match[1]}`,
        txStart: +match[2],
        txEnd: +match[2] + 1,
        score: 0,
        geneName: query,
        type: 'nucleotide',
      },
    ];
  }

  return undefined;
};

const Viewer = (props) => {
  const [infoOpen, setInfoOpen] = useQueryString('i', true, {
    decoder: (v) => (v === undefined ? undefined : v === 'true'),
  });
  const [focusGene, setFocusGene] = useQueryString('g', '');
  const [focusVariant, setFocusVariant] = useQueryString('v', 'rs1250566');
  const [hideUnfocused, setHideUnfocused] = useQueryString('hide-unfocused');
  const [matrixColoring, setMatrixColoring] = useQueryString('mc', 'solid');
  const [variantYScale, setVariantYScale] = useQueryString('vs', 'pValue');
  const [dnaAccessLabels, setDnaAccessLabels] = useQueryString(
    'al',
    'indicator'
  );
  const [xDomainStart, setXDomainStart] = useQueryString(
    's',
    props.chromInfo.absToChr(DEFAULT_X_DOMAIN_START).slice(0, 2).join(':'),
    {
      encoder: chrPosUrlEncoder,
      decoder: chrPosUrlDecoder,
    }
  );
  const [xDomainEnd, setXDomainEnd] = useQueryString(
    'e',
    props.chromInfo.absToChr(DEFAULT_X_DOMAIN_END).slice(0, 2).join(':'),
    {
      encoder: chrPosUrlEncoder,
      decoder: chrPosUrlDecoder,
    }
  );
  const [showEnhancerDetails, setShowEnhancerDetails] = useQueryString(
    'ed',
    true,
    {
      decoder: (v) => (v === undefined ? undefined : v === 'true'),
    }
  );
  const [showDnaAccessDetails, setShowDnaAccessDetails] = useQueryString(
    'ad',
    true,
    {
      decoder: (v) => (v === undefined ? undefined : v === 'true'),
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

  const focusVariantRelPosition = useMemo(
    () => (focusVariantOption ? +focusVariantOption.txStart : null),
    [focusVariantOption]
  );

  const xDomainStartAbs = useMemo(
    () => toAbsPosition(xDomainStart, props.chromInfo),
    [xDomainStart, props.chromInfo]
  );

  const xDomainEndAbs = useMemo(
    () => toAbsPosition(xDomainEnd, props.chromInfo),
    [xDomainEnd, props.chromInfo]
  );

  const xDomainStartAbsDb = useDebounce(xDomainStartAbs, 1000);
  const xDomainEndAbsDb = useDebounce(xDomainEndAbs, 1000);

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

  const viewConfigEnhancerHeight = useMemo(
    () =>
      viewConfigEnhancer.views[0].tracks.top.reduce(
        (height, track) => height + track.height,
        0
      ),
    [viewConfigEnhancer]
  );

  const getDnaAccessibilityXDomain = () => {
    if (focusVariantPosition) {
      return [focusVariantPosition - 2500, focusVariantPosition + 2500];
    }

    if (focusGeneStartPosition && focusGeneEndPosition) {
      const midPos =
        focusGeneStartPosition +
        (focusGeneEndPosition - focusGeneStartPosition) / 2;
      return [midPos - 2500, midPos + 2500];
    }

    return [xDomainStartAbs, xDomainEndAbs];
  };

  const viewConfigDnaAccessibility = useMemo(
    () =>
      pipe(
        updateViewConfigFocusVariant(focusVariantPosition, [2]),
        updateViewConfigVariantYScale(variantYScale),
        updateViewConfigDnaAccessLabels(dnaAccessLabels),
        updateViewConfigXDomain(
          ...getDnaAccessibilityXDomain(
            focusVariantPosition,
            focusGeneStartPosition,
            focusGeneEndPosition,
            xDomainStartAbsDb,
            xDomainEndAbsDb
          ),
          true
        )
      )(deepClone(DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // `xDomainStartAbs` and `xDomainEndAbs` are ommitted on purpose to avoid
      // updating the view-config on every pan or zoom event.
      focusVariantPosition,
      focusGeneStartPosition,
      focusGeneEndPosition,
      xDomainStartAbsDb,
      xDomainEndAbsDb,
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

  const changeVariantYScale = (value) => () => {
    setVariantYScale(value);
  };

  const changeMatrixColoring = (value) => () => {
    setMatrixColoring(value);
  };

  const changeDnaAccessLabels = (value) => () => {
    setDnaAccessLabels(value);
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
    } else if (event.type === 'annotation') {
      console.log('clicked on annotation', event.payload);
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

  const higlassEnhancerDetailsClickHandler = () => {
    setShowEnhancerDetails(!showEnhancerDetails);
  };

  const higlassDnaAccessDetailsClickHandler = () => {
    setShowDnaAccessDetails(!showDnaAccessDetails);
  };

  const mergeSvgs = (enhancerSvg, dnaAccessSvg) => {
    const [enhancerCoreSvg, enhancerWidth, enhancerHeight] = extractSvgCore(
      enhancerSvg
    );
    const [dnaAccessCoreSvg, dnaAccessWidth, dnaAccessHeight] = extractSvgCore(
      dnaAccessSvg
    );

    const actualEnhancerHeight = viewConfigEnhancer.views[0].tracks.top.reduce(
      (height, track) => height + track.height,
      0
    );
    const actualDnaAccessHeight = viewConfigDnaAccessibility.views[0].tracks.top.reduce(
      (height, track) => height + track.height,
      0
    );
    const padding = 24;

    let mergedSvg = SVG_SKELETON;
    mergedSvg = mergedSvg.replace(
      '_WIDTH_',
      enhancerWidth + dnaAccessWidth + padding
    );
    mergedSvg = mergedSvg.replace(
      '_HEIGHT_',
      Math.max(
        enhancerHeight,
        dnaAccessHeight,
        actualEnhancerHeight,
        actualDnaAccessHeight
      )
    );
    mergedSvg = mergedSvg.replace('_ENHANCER_', enhancerCoreSvg);
    mergedSvg = mergedSvg.replace('_DNA_ACCESS_X_', enhancerWidth + padding);
    mergedSvg = mergedSvg.replace('_DNA_ACCESS_', dnaAccessCoreSvg);

    return mergedSvg;
  };

  const higlassExportAsSvg = () => {
    const mergedSvg = mergeSvgs(
      higlassEnhancerApi.current.exportAsSvg(),
      higlassDnaAccessApi.current.exportAsSvg()
    );

    download(
      'abc-enhancers.svg',
      new Blob([mergedSvg], { type: 'image/svg+xml' })
    );
  };

  // Run on every render
  const classes = useStyles();

  const higlassEnhancerDetailsIconClass = showEnhancerDetails
    ? classes.higlassTitleBarIconActive
    : classes.higlassTitleBarIcon;

  const higlassDnaAccessDetailsIconClass = showDnaAccessDetails
    ? classes.higlassTitleBarIconActive
    : classes.higlassTitleBarIcon;

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
              customSearch={locationSearch}
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
        <Grid container direction="column" className={classes.drawerGrid}>
          <Grid item>
            <ButtonBase className={classes.toolbar} style={{ width: '100%' }}>
              <h1 className={classes.h1} onClick={infoOpenHandler}>
                <Logo />
              </h1>
            </ButtonBase>
            <Divider />
          </Grid>
          <Grid container item className={classes.grow} direction="column">
            <Grid item>
              <Box m={1}>
                <Box m={0}>
                  <FormControl variant="outlined" margin="dense" fullWidth>
                    <InputLabel htmlFor="x-domain-start">
                      Region Start
                    </InputLabel>
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
            </Grid>
            <Grid item className={classes.settings}>
              <Box m={0} className={classes.settingsContent}>
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
                    <FormLabel
                      component="legend"
                      className={classes.iconRadioLegend}
                    >
                      Variant y-scale
                    </FormLabel>
                    <RadioGroup
                      aria-label="variantYScale"
                      name="variantYScale"
                      value={variantYScale}
                    >
                      <FormControlLabel
                        label="p-value"
                        value="pValue"
                        className={classes.iconRadio}
                        control={
                          <IconButton
                            size="small"
                            onClick={changeVariantYScale('pValue')}
                          >
                            {variantYScale === 'pValue' ? (
                              <RadioButtonCheckedIcon
                                className={classes.iconRadioActive}
                                fontSize="inherit"
                              />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        }
                      />
                      <FormControlLabel
                        label="Posterior probability"
                        value="posteriorProbability"
                        className={classes.iconRadio}
                        control={
                          <IconButton
                            size="small"
                            onClick={changeVariantYScale(
                              'posteriorProbability'
                            )}
                          >
                            {variantYScale === 'posteriorProbability' ? (
                              <RadioButtonCheckedIcon
                                className={classes.iconRadioActive}
                                fontSize="inherit"
                              />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>
                <Box m={1}>
                  <FormControl component="fieldset">
                    <FormLabel
                      component="legend"
                      className={classes.iconRadioLegend}
                    >
                      Matrix coloring
                    </FormLabel>
                    <RadioGroup
                      aria-label="matrixColoring"
                      name="matrixColoring"
                      value={matrixColoring}
                    >
                      <FormControlLabel
                        label="Solid"
                        value="solid"
                        className={classes.iconRadio}
                        control={
                          <IconButton
                            size="small"
                            onClick={changeMatrixColoring('solid')}
                          >
                            {matrixColoring === 'solid' ? (
                              <RadioButtonCheckedIcon
                                className={classes.iconRadioActive}
                                fontSize="inherit"
                              />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        }
                      />
                      <FormControlLabel
                        label="Number of predictions"
                        value="frequency"
                        className={classes.iconRadio}
                        control={
                          <IconButton
                            size="small"
                            onClick={changeMatrixColoring('frequency')}
                          >
                            {matrixColoring === 'frequency' ? (
                              <RadioButtonCheckedIcon
                                className={classes.iconRadioActive}
                                fontSize="inherit"
                              />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        }
                      />
                      <FormControlLabel
                        label="Highest prediction score"
                        value="highestImportance"
                        className={classes.iconRadio}
                        control={
                          <IconButton
                            size="small"
                            onClick={changeMatrixColoring('highestImportance')}
                          >
                            {matrixColoring === 'highestImportance' ? (
                              <RadioButtonCheckedIcon
                                className={classes.iconRadioActive}
                                fontSize="inherit"
                              />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        }
                      />
                      <FormControlLabel
                        label="Prediction score of the closest TSS interaction"
                        value="closestImportance"
                        className={classes.iconRadio}
                        control={
                          <IconButton
                            size="small"
                            onClick={changeMatrixColoring('closestImportance')}
                          >
                            {matrixColoring === 'closestImportance' ? (
                              <RadioButtonCheckedIcon
                                className={classes.iconRadioActive}
                                fontSize="inherit"
                              />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>
                <Box m={1}>
                  <FormControl component="fieldset">
                    <FormLabel
                      component="legend"
                      className={classes.iconRadioLegend}
                    >
                      DNA accessibility labels
                    </FormLabel>
                    <RadioGroup
                      aria-label="dnaAccessLabels"
                      name="dnaAccessLabels"
                      value={dnaAccessLabels}
                    >
                      <FormControlLabel
                        label="Indicator"
                        value="indicator"
                        className={classes.iconRadio}
                        control={
                          <IconButton
                            size="small"
                            onClick={changeDnaAccessLabels('indicator')}
                          >
                            {dnaAccessLabels === 'indicator' ? (
                              <RadioButtonCheckedIcon
                                className={classes.iconRadioActive}
                                fontSize="inherit"
                              />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        }
                      />
                      <FormControlLabel
                        label="Text"
                        value="text"
                        className={classes.iconRadio}
                        control={
                          <IconButton
                            size="small"
                            onClick={changeDnaAccessLabels('text')}
                          >
                            {dnaAccessLabels === 'text' ? (
                              <RadioButtonCheckedIcon
                                className={classes.iconRadioActive}
                                fontSize="inherit"
                              />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        }
                      />
                      <FormControlLabel
                        label="Hidden"
                        value="hidden"
                        className={classes.iconRadio}
                        control={
                          <IconButton
                            size="small"
                            onClick={changeDnaAccessLabels('hidden')}
                          >
                            {dnaAccessLabels === 'hidden' ? (
                              <RadioButtonCheckedIcon
                                className={classes.iconRadioActive}
                                fontSize="inherit"
                              />
                            ) : (
                              <RadioButtonUncheckedIcon fontSize="inherit" />
                            )}
                          </IconButton>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>
              </Box>
            </Grid>
            <Grid item>
              <Divider />
              <Box m={1}>
                <Button
                  variant="contained"
                  margin="dense"
                  onClick={higlassExportAsSvg}
                  fullWidth
                  disableElevation
                >
                  Export as SVG
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <div className={classes.higlass}>
          <Grid
            container
            direction="column"
            className={classes.higlassEnhancer}
          >
            <Grid
              item
              className={classes.higlassTitleBar}
              container
              justify="space-between"
              alignItems="center"
              wrap="nowrap"
            >
              <Grid item container wrap="nowrap" alignItems="center">
                <Typography
                  component="h3"
                  className={`${classes.higlassTitleBarText} ${classes.higlassTitleBarTitle}`}
                  noWrap
                >
                  Enhancers
                </Typography>
                <IconButton
                  aria-label="help"
                  aria-describedby={higlassEnhancerHelpId}
                  className={classes.higlassTitleBarIcon}
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
                    enhancer. Promoter regions are indicated by translucent
                    light gray overlays.
                  </Typography>
                  <Typography className={classes.higlassTitleBarHelpPopeover}>
                    {' '}
                    You can filter enhancers via their target gene or by variant
                    (the dot plot below the gene annotations). Click on a
                    variant or gene to select it. Selections are shown in
                    pink/red.
                  </Typography>
                </Popover>
              </Grid>
              <Grid item>
                <IconButton
                  aria-label="details"
                  className={higlassEnhancerDetailsIconClass}
                  size="small"
                  onClick={higlassEnhancerDetailsClickHandler}
                >
                  <InfoIcon fontSize="inherit" />
                </IconButton>
              </Grid>
            </Grid>
            <Grid
              item
              className={classes.grow}
              style={{ position: 'relative' }}
            >
              <div
                className={classes.fullWidthHeight}
                style={{ overflow: 'auto' }}
              >
                <Grid
                  container
                  direction="column"
                  className={classes.higlassEnhancerContainer}
                >
                  {showEnhancerDetails && (
                    <Grid item className={classes.higlassEnhancerInfoBar}>
                      <Typography
                        component="h4"
                        className={classes.higlassInfoBarTitle}
                        noWrap
                      >
                        Enhancer Regions
                      </Typography>
                      {focusGene && focusVariant && (
                        <Typography
                          className={classes.higlassTitleBarText}
                          noWrap
                        >
                          <span className={classes.pink}>■</span> Enhancers
                          containing <em>{focusVariant}</em> and predicted to
                          regulate <em>{focusGene}</em>
                        </Typography>
                      )}
                      {focusGene && !focusVariant && (
                        <Typography
                          className={classes.higlassTitleBarText}
                          noWrap
                        >
                          <span className={classes.pink}>■</span> Enhancers
                          predicted to regulate <em>{focusGene}</em>
                        </Typography>
                      )}
                      {!focusGene && focusVariant && (
                        <Typography
                          className={classes.higlassTitleBarText}
                          noWrap
                        >
                          <span className={classes.pink}>■</span> Enhancers
                          containing <em>{focusVariant}</em>
                        </Typography>
                      )}
                      {focusGene || focusVariant ? (
                        <Typography
                          className={classes.higlassTitleBarText}
                          noWrap
                        >
                          <span className={classes.gray}>■</span> All other
                          predicted enhancers
                        </Typography>
                      ) : (
                        <Typography
                          className={classes.higlassTitleBarText}
                          noWrap
                        >
                          <span className={classes.black}>■</span> All predicted
                          enhancers
                        </Typography>
                      )}
                    </Grid>
                  )}
                  <Grid
                    item
                    className={classes.grow}
                    style={{ height: `${viewConfigEnhancerHeight}px` }}
                  >
                    <HiGlassComponent
                      ref={higlassEnhancerInitHandler}
                      viewConfig={viewConfigEnhancer}
                      options={{
                        sizeMode: 'bounded',
                        globalMousePosition: true,
                      }}
                    />
                  </Grid>
                  <Grid item className={classes.higlassEnhancerInfoBar}>
                    {showEnhancerDetails && (
                      <Typography
                        component="h4"
                        className={classes.higlassInfoBarTitle}
                        noWrap
                      >
                        Enhancer-Gene Connections
                      </Typography>
                    )}
                    {showEnhancerDetails && focusVariant && (
                      <Typography className={classes.higlassTitleBarText}>
                        Enhancer overlapping <em>{focusVariant}</em> and its
                        predicted connections to upstream (left) and downstream
                        (right) genes.
                      </Typography>
                    )}
                  </Grid>
                  <Grid item className={classes.higlassEnhancerGenePlot}>
                    {focusVariant ? (
                      <EnhancerGenePlot
                        position={focusVariantPosition}
                        relPosition={focusVariantRelPosition}
                      />
                    ) : (
                      <Grid
                        container
                        justify="center"
                        alignItems="center"
                        className={classes.higlassEnhancerGenePlotPlaceholder}
                      >
                        <Typography>Select a variant to see details</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </div>
            </Grid>
          </Grid>
          <div className={classes.higlassSeparator} />
          <Grid
            container
            direction="column"
            className={classes.higlassDnaAccessibility}
          >
            <Grid
              item
              className={classes.higlassTitleBar}
              container
              justify="space-between"
              alignItems="center"
              wrap="nowrap"
            >
              <Grid item container alignItems="center" wrap="nowrap">
                <Typography
                  component="h3"
                  className={`${classes.higlassTitleBarText} ${classes.higlassTitleBarTitle}`}
                  noWrap
                >
                  DNA Accessibility
                </Typography>
                <IconButton
                  aria-label="help"
                  aria-describedby={higlassDnaAccessHelpId}
                  className={classes.higlassTitleBarIcon}
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
              <Grid item>
                <IconButton
                  aria-label="info"
                  className={higlassDnaAccessDetailsIconClass}
                  size="small"
                  onClick={higlassDnaAccessDetailsClickHandler}
                >
                  <InfoIcon fontSize="inherit" />
                </IconButton>
              </Grid>
            </Grid>
            <Grid item container direction="column" className={classes.grow}>
              {showDnaAccessDetails && (
                <Grid item className={classes.higlassDnaAccessibilityInfoBar}>
                  <Typography
                    component="h4"
                    className={classes.higlassInfoBarTitle}
                    noWrap
                  >
                    DNase- or ATAC-Seq Assays
                  </Typography>
                  <div className={classes.higlassDnaAccessibilityInfoBarRegion}>
                    <span>├</span>
                    <Typography
                      align="center"
                      className={classes.higlassTitleBarText}
                      noWrap
                    >
                      {toFixed(dnaAccessibilityRegionSize, 1)}{' '}
                      <abbr title="kilo base pairs">kbp</abbr>
                    </Typography>
                    <span>┤</span>
                  </div>
                </Grid>
              )}
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
                    globalMousePosition: true,
                  }}
                />
              </Grid>
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
            <Welcome infoCloseHandler={infoCloseHandler} />
          </div>
        </Fade>
      </Modal>
    </div>
  );
};

Viewer.propTypes = {
  chromInfo: PropTypes.object.isRequired,
};

export default Viewer;
