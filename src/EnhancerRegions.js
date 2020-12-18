import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRecoilValue, useSetRecoilState, useRecoilState } from 'recoil';
import { HiGlassComponent } from 'higlass';
import { debounce, deepClone, isParentOf, pipe } from '@flekschas/utils';

import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { useChromInfo } from './ChromInfoProvider';
import EnhancerRegionsInfo from './EnhancerRegionsInfo';
import EnhancerRegionsHelp from './EnhancerRegionsHelp';
import EnhancerRegionsSettings from './EnhancerRegionsSettings';
import TitleBar from './TitleBar';

import {
  enhancerRegionsColorEncodingState,
  enhancerRegionsHideUnfocusedState,
  focusGeneEndWithAssembly,
  focusGeneOptionState,
  focusGeneStartWithAssembly,
  focusVariantOptionState,
  focusVariantPositionWithAssembly,
  higlassEnhancerRegionsState,
  useEnhancerRegionsShowInfos,
  useFocusGene,
  useFocusVariant,
  useXDomainEndWithAssembly,
  useXDomainStartWithAssembly,
  variantYScaleState,
  xDomainEndAbsWithAssembly,
  xDomainStartAbsWithAssembly,
  variantTracksState,
} from './state';

import {
  updateViewConfigFocusGene,
  updateViewConfigFocusVariant,
  updateViewConfigVariantYScale,
  updateViewConfigXDomain,
  updateViewConfigVariantTracks,
} from './view-config';

import { DEFAULT_VIEW_CONFIG_ENHANCER } from './constants';

import 'higlass/dist/hglib.css';

import './EnhancerRegions.css';

const useStyles = makeStyles((theme) => ({
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
  higlassContainer: {
    position: 'relative',
    minHeight: '100%',
    overflow: 'hidden',
  },
  panZoomTip: {
    position: 'absolute',
    zIndex: 11,
    top: 0,
    left: 0,
    right: 0,
    padding: '0 2px',
    fontSize: '0.8rem',
    lineHeight: '1.5rem',
    background: theme.palette.grey['100'],
    textAlign: 'center',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    opacity: 1,
    animation: '0.75s ease 3s 1 running forwards fadeout',
    '-webkit-touch-callout': 'none',
    '-webkit-user-select': 'none',
    '-khtml-user-select': 'none',
    '-moz-user-select': 'none',
    '-ms-user-select': 'none',
    userSelect: 'none',
    transition: '0.25s ease opacity, 0.25s ease transform',
    '&:hover': {
      opacity: 0,
    },
  },
  panZoomTipNormal: {
    color: theme.palette.grey['600'],
  },
  panZoomTipNormalHover: {
    fontWeight: 'bold',
    color: 'black',
    background: '#aaa',
    animation: '0.75s ease 5s 1 running forwards fadeout',
  },
  panZoomTipActive: {
    color: 'white',
    background: '#dd55a5',
    animation: '0.75s ease 5s 1 running forwards fadeout',
  },
  panZoomTipActiveHover: {
    fontWeight: 'bold',
    color: 'white',
    background: '#cc0078',
    animation: '0.75s ease 5s 1 running forwards fadeout',
  },
}));

const updateViewConfigFocusStyle = (hideUnfocused) => (viewConfig) => {
  viewConfig.views[0].tracks.top[4].options.focusStyle = hideUnfocused
    ? 'filtering'
    : 'highlighting';
  viewConfig.views[0].tracks.top[4].options.stratification.axisNoGroupColor = !hideUnfocused;

  return viewConfig;
};

const updateViewConfigColorEncoding = (coloring) => (viewConfig) => {
  viewConfig.views[0].tracks.top[4].options.opacityEncoding = coloring;
  return viewConfig;
};

const EnhancerRegion = React.memo((props) => {
  const chromInfo = useChromInfo();

  const [focusGeneOption, setFocusGeneOption] = useRecoilState(
    focusGeneOptionState
  );

  const setFocusGene = useFocusGene()[1];
  const setFocusVariant = useFocusVariant()[1];
  const setXDomainStart = useXDomainStartWithAssembly(chromInfo)[1];
  const setXDomainEnd = useXDomainEndWithAssembly(chromInfo)[1];
  const setFocusVariantOption = useSetRecoilState(focusVariantOptionState);
  const setHiglass = useSetRecoilState(higlassEnhancerRegionsState);

  const variantTracks = useRecoilValue(variantTracksState);
  const hideUnfocused = useRecoilValue(enhancerRegionsHideUnfocusedState);
  const variantYScale = useRecoilValue(variantYScaleState);
  const colorEncoding = useRecoilValue(enhancerRegionsColorEncodingState);
  const focusVariantPosition = useRecoilValue(
    focusVariantPositionWithAssembly(chromInfo)
  );
  const xDomainStartAbs = useRecoilValue(
    xDomainStartAbsWithAssembly(chromInfo)
  );
  const xDomainEndAbs = useRecoilValue(xDomainEndAbsWithAssembly(chromInfo));
  const focusGeneStart = useRecoilValue(focusGeneStartWithAssembly(chromInfo));
  const focusGeneEnd = useRecoilValue(focusGeneEndWithAssembly(chromInfo));

  const [higlassMouseOver, setHiglassMouseOver] = useState(false);
  const [higlassFocus, setHiglassFocus] = useState(false);
  const higlassContainerRef = useRef(null);
  const higlassEnhancerClickSelection = useRef(null);
  const higlassMouseDown = useRef(false);
  const higlassNumMouseOver = useRef(0);
  const higlassNumFocus = useRef(0);
  const higlassNumFocusMouseOut = useRef(0);

  const shouldSkipUpdatingXDomain = () => {
    if (higlassEnhancerClickSelection.current) {
      higlassEnhancerClickSelection.current = false;
      return true;
    }
    return false;
  };

  useEffect(() => {
    higlassNumMouseOver.current += higlassMouseOver;
  }, [higlassMouseOver]);

  useEffect(() => {
    higlassNumFocus.current += higlassFocus;
  }, [higlassFocus]);

  useEffect(() => {
    if (higlassFocus) higlassNumFocusMouseOut.current += !higlassMouseOver;
    else higlassNumFocusMouseOut.current = 0;
  }, [higlassFocus, higlassMouseOver]);

  const viewConfig = useMemo(
    () =>
      pipe(
        updateViewConfigVariantTracks(variantTracks),
        updateViewConfigFocusGene(
          focusGeneOption ? focusGeneOption.geneName : null,
          focusGeneStart,
          focusGeneEnd
        ),
        updateViewConfigFocusVariant(focusVariantPosition, [2, 4]),
        updateViewConfigFocusStyle(hideUnfocused),
        updateViewConfigColorEncoding(colorEncoding),
        updateViewConfigVariantYScale(variantYScale),
        updateViewConfigXDomain(xDomainStartAbs, xDomainEndAbs, {
          force: shouldSkipUpdatingXDomain,
        })
      )(deepClone(DEFAULT_VIEW_CONFIG_ENHANCER)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // `xDomainStartAbs` and `xDomainEndAbs` are ommitted on purpose to avoid
      // updating the view-config on every pan or zoom event.
      variantTracks,
      focusGeneOption,
      focusGeneStart,
      focusGeneEnd,
      focusVariantPosition,
      hideUnfocused,
      colorEncoding,
      variantYScale,
    ]
  );

  const viewConfigHeight = useMemo(
    () =>
      viewConfig.views[0].tracks.top.reduce(
        (height, track) => height + track.height,
        0
      ),
    [viewConfig]
  );

  const higlassBlockClasses = useMemo(
    () => (higlassFocus ? 'higlass-block focus' : 'higlass-block'),
    [higlassFocus]
  );

  // HiGlass Functions
  const higlassClickHandler = (event) => {
    if (event.type === 'gene-annotation') {
      setFocusGene(event.payload.name);
      higlassEnhancerClickSelection.current = true;
      setFocusGeneOption({
        chr: event.payload.fields[0],
        txStart: event.payload.fields[1],
        txEnd: event.payload.fields[2],
        geneName: event.payload.name,
        type: 'gene',
      });
    } else if (event.type === 'snp') {
      setFocusVariant(event.payload.name);
      higlassEnhancerClickSelection.current = true;
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
      chromInfo.absToChr(absPos).slice(0, 2).join(':')
    );
    setXDomainStart(newXDomainStart);
    setXDomainEnd(newXDomainEnd);
  };
  const higlassLocationChangeHandlerDb = debounce(
    higlassLocationChangeHandler,
    250
  );

  const windowMouseDownClearHandler = useCallback((e) => {
    if (!isParentOf(e.target, higlassContainerRef.current)) {
      setHiglassFocus(false);
    }
    higlassMouseDown.current = false;
  }, []);

  useEffect(
    () => {
      window.addEventListener('mouseup', windowMouseDownClearHandler);
      window.addEventListener('blur', windowMouseDownClearHandler);
    },
    // Execute only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const higlassMouseDownHandler = useCallback(() => {
    higlassMouseDown.current = true;
  }, []);

  const higlassInitHandler = useCallback(
    (higlassInstance) => {
      if (higlassInstance !== null) {
        setHiglass(higlassInstance.api);
        higlassInstance.api.on('click', higlassClickHandler);
        higlassInstance.api.on(
          'location',
          higlassLocationChangeHandlerDb,
          'context'
        );
        higlassInstance.api
          .getComponent()
          .element.addEventListener('mousedown', higlassMouseDownHandler);
      }
    },
    // Execute only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const higlassFocusHandler = () => {
    setHiglassFocus(true);
  };

  const higlassBlurHandler = () => {
    if (!higlassMouseDown.current) {
      setHiglassFocus(false);
    }
  };

  const higlassContainerMouseEnterHandler = () => {
    setHiglassMouseOver(true);
  };

  const higlassContainerMouseLeaveHandler = () => {
    setHiglassMouseOver(false);
  };

  // Run on every render
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <TitleBar
        id="enhancer-regions"
        title="Enhancer Regions"
        useShowInfo={useEnhancerRegionsShowInfos}
        Info={EnhancerRegionsInfo}
        Help={EnhancerRegionsHelp}
        Settings={EnhancerRegionsSettings}
      />
      <div
        className={`higlass-container ${classes.higlassContainer}`}
        onMouseEnter={higlassContainerMouseEnterHandler}
        onMouseLeave={higlassContainerMouseLeaveHandler}
        ref={higlassContainerRef}
        style={{ height: `${viewConfigHeight}px` }}
      >
        {higlassFocus &&
          !higlassMouseOver &&
          higlassNumFocus.current < 2 &&
          higlassNumFocusMouseOut.current < 1 && (
            <Typography
              // Just a hack to trigger a dom rerendering which in turn
              // triggers the fadeout animation
              component="div"
              className={`panZoomTip ${classes.panZoomTip} ${classes.panZoomTipActive}`}
              noWrap
            >
              Click outside to deactivate pan & zoom!
            </Typography>
          )}
        {higlassFocus &&
          higlassMouseOver &&
          higlassNumFocus.current < 2 &&
          higlassNumFocusMouseOut.current < 1 && (
            <Typography
              // Just a hack to trigger a dom rerendering which in turn
              // triggers the fadeout animation
              component="span"
              className={`panZoomTip ${classes.panZoomTip} ${classes.panZoomTipActiveHover}`}
              noWrap
            >
              You can now pan & zoom the plot!
            </Typography>
          )}
        {!higlassFocus && higlassMouseOver && higlassNumMouseOver.current < 2 && (
          <Typography
            // Just a hack to trigger a dom rerendering which in turn
            // triggers the fadeout animation
            component="div"
            className={`panZoomTip ${classes.panZoomTip} ${classes.panZoomTipNormalHover}`}
            noWrap
          >
            Click to activate pan & zoom!
          </Typography>
        )}
        {!higlassFocus && !higlassMouseOver && higlassNumMouseOver.current < 2 && (
          <Typography
            // Just a hack to trigger a dom rerendering which in turn
            // triggers the fadeout animation
            component="span"
            className={`panZoomTip ${classes.panZoomTip} ${classes.panZoomTipNormal}`}
            noWrap
          >
            This plot is interactive!
          </Typography>
        )}
        <div
          className={higlassBlockClasses}
          onMouseDown={higlassMouseDownHandler}
          onFocus={higlassFocusHandler}
          onBlur={higlassBlurHandler}
          tabIndex="0"
        />
        <HiGlassComponent
          ref={higlassInitHandler}
          viewConfig={viewConfig}
          options={{
            sizeMode: 'bounded',
            globalMousePosition: true,
          }}
        />
      </div>
    </div>
  );
});

export default EnhancerRegion;
