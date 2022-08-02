import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useRecoilValue,
  useSetRecoilState,
  useRecoilState,
  RecoilState,
} from 'recoil';
import {
  ChromosomeInfoResult,
  HiGlassApi,
  HiGlassApiClickEventData,
  HiGlassApiLocationEventData,
  HiGlassApiMouseTool,
  HiGlassApiRangeSelectionEventData,
  HiGlassComponent,
} from 'higlass';
import { SubscribeFnResult } from 'pub-sub-es';
import { debounce, deepClone, isParentOf, pipe, sum } from '@flekschas/utils';

import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import { useChromInfo } from '../../ChromInfoProvider';
import EnhancerRegionsInfo from './EnhancerRegionsInfo';
import EnhancerRegionsHelp from './EnhancerRegionsHelp';
import EnhancerRegionsSettings from './EnhancerRegionsSettings';
import TitleBar from '../../TitleBar';

import {
  higlassEnhancerRegionsState,
  useXDomainEndWithAssembly,
  useXDomainStartWithAssembly,
  variantYScaleState,
  xDomainEndAbsWithAssembly,
  xDomainStartAbsWithAssembly,
} from '../../state';
import { selectedSamplesState } from '../../state/filter-state';
import {
  focusGeneEndWithAssembly,
  focusGeneOptionState,
  focusGeneStartWithAssembly,
  focusRegionOptionState,
  focusRegionAbsWithAssembly,
  useFocusGene,
  useFocusRegion,
} from '../../state/focus-state';
import {
  sampleGroupSelectionSizesState,
  Stratification,
} from '../../state/stratification-state';
import {
  enhancerRegionsColorEncodingState,
  enhancerRegionsHideUnfocusedState,
  useEnhancerRegionsShowInfos,
  enhancerRegionsTrackState,
} from '../../state/enhancer-region-state';
import { variantTracksState } from '../../state/variant-track-state';

import {
  updateViewConfigFocusGene,
  updateViewConfigFocusRegion,
  updateViewConfigVariantYScale,
  updateViewConfigXDomain,
  updateViewConfigVariantTracks,
} from '../../view-config';
import { stratificationState } from '../../state/stratification-state';

import { IGNORED_FOCUS_ELEMENTS } from '../../constants';
import {
  DEFAULT_VIEW_CONFIG_ENHANCER,
  getTrackByUid,
  updateViewConfigEnhancerRegionTracks,
} from '../../view-config-typed';

import { chrRangePosEncoder } from '../../utils';

import 'higlass/dist/hglib.css';

import './EnhancerRegions.css';
import {
  FocusStyle,
  OneDimensionalArcTrack,
  OpacityEncoding,
  StackedBarTrack,
  StratifiedBedTrack,
  ViewConfig,
} from '../../view-config-types';

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

const updateViewConfigFocusStyle = (hideUnfocused: boolean) => (
  viewConfig: ViewConfig
) => {
  const track = getTrackByUid(
    viewConfig,
    'indicatorByCellTypes'
  ) as StratifiedBedTrack;
  track.options.focusStyle = hideUnfocused
    ? FocusStyle.FILTERING
    : FocusStyle.HIGHLIGHTING;
  track.options.stratification.axisNoGroupColor = !hideUnfocused;
  return viewConfig;
};

const updateViewConfigColorEncoding = (coloring: OpacityEncoding) => (
  viewConfig: ViewConfig
) => {
  const track = getTrackByUid(
    viewConfig,
    'indicatorByCellTypes'
  ) as StratifiedBedTrack;
  track.options.opacityEncoding = coloring;
  return viewConfig;
};

const updateViewConfigFilter = (
  selectedSamples: string[],
  sampleField: number
) => (viewConfig: ViewConfig) => {
  const arcTrack = getTrackByUid(viewConfig, 'arcs') as OneDimensionalArcTrack;
  arcTrack.options.filter = {
    set: selectedSamples,
    field: sampleField,
  };
  const barTrack = getTrackByUid(viewConfig, 'stacked-bars') as StackedBarTrack;
  barTrack.options.filter = {
    set: selectedSamples,
    field: sampleField,
  };
  const stratifiedBedTrack = getTrackByUid(
    viewConfig,
    'indicatorByCellTypes'
  ) as StratifiedBedTrack;
  stratifiedBedTrack.options.filter = {
    set: selectedSamples,
    field: sampleField,
  };
  return viewConfig;
};

const updateViewConfigMatrixHeight = (numSamples: number) => (
  viewConfig: ViewConfig
) => {
  const track = getTrackByUid(
    viewConfig,
    'indicatorByCellTypes'
  ) as StratifiedBedTrack;
  // TODO: come back to this number -- is it sufficient?
  track.height = numSamples * track.options.markHeight + 14;
  return viewConfig;
};

const updateViewConfigStratification = (stratification: Stratification) => (
  viewConfig: ViewConfig
) => {
  const stratifiedTrack = getTrackByUid(
    viewConfig,
    'indicatorByCellTypes'
  ) as StratifiedBedTrack;
  stratifiedTrack.options.stratification = stratification;

  const stackedBarTrack = getTrackByUid(
    viewConfig,
    'stacked-bars'
  ) as StackedBarTrack;
  stackedBarTrack.options.stratification = stratification;
  return viewConfig;
};

const EnhancerRegion = React.memo((_props) => {
  const chromInfo = useChromInfo();

  const [focusGeneOption, setFocusGeneOption] = useRecoilState(
    focusGeneOptionState
  );

  const setFocusGene = useFocusGene()[1];
  const setFocusRegion = useFocusRegion()[1];
  const setXDomainStart = useXDomainStartWithAssembly(chromInfo)[1];
  const setXDomainEnd = useXDomainEndWithAssembly(chromInfo)[1];
  const setFocusRegionOption = useSetRecoilState(focusRegionOptionState);
  const setHiglass = useSetRecoilState(
    higlassEnhancerRegionsState as RecoilState<HiGlassApi | null>
  );

  const variantTracks = useRecoilValue(variantTracksState);
  const enhancerTrackConfig = useRecoilValue(enhancerRegionsTrackState);
  const hideUnfocused = useRecoilValue(enhancerRegionsHideUnfocusedState);
  const variantYScale = useRecoilValue(variantYScaleState);
  const colorEncoding = useRecoilValue(enhancerRegionsColorEncodingState);
  const focusRegionAbs = useRecoilValue(focusRegionAbsWithAssembly(chromInfo));
  const xDomainStartAbs = useRecoilValue(
    xDomainStartAbsWithAssembly(chromInfo)
  );
  const xDomainEndAbs = useRecoilValue(xDomainEndAbsWithAssembly(chromInfo));
  const focusGeneStart = useRecoilValue(focusGeneStartWithAssembly(chromInfo));
  const focusGeneEnd = useRecoilValue(focusGeneEndWithAssembly(chromInfo));
  const sampleGroupSelectionSizes = useRecoilValue(
    sampleGroupSelectionSizesState
  );
  const selectedSamples = useRecoilValue(selectedSamplesState);
  const stratification = useRecoilValue(stratificationState);

  const [higlassMouseOver, setHiglassMouseOver] = useState(false);
  const [higlassFocus, setHiglassFocus] = useState(false);
  const higlassApi = useRef<HiGlassApi | null>(null);
  const higlassRangeSelection = useRef<[number, number] | null>(null);
  const higlassListeners = useRef<SubscribeFnResult[]>([]);
  const higlassContainerRef = useRef<HTMLDivElement>(null);
  const higlassEnhancerClickSelection = useRef<boolean>();
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

  const numSamples = useMemo(
    () => sum(Object.values(sampleGroupSelectionSizes)),
    [sampleGroupSelectionSizes]
  );

  // On change in higlass mouseover, add one if true
  useEffect(() => {
    higlassNumMouseOver.current += higlassMouseOver ? 1 : 0;
  }, [higlassMouseOver]);

  useEffect(() => {
    higlassNumFocus.current += higlassFocus ? 1 : 0;
  }, [higlassFocus]);

  useEffect(() => {
    if (higlassFocus) {
      // higlass mouseover=false counts the "mouseout" event
      higlassNumFocusMouseOut.current += higlassMouseOver ? 0 : 1;
    } else {
      higlassNumFocusMouseOut.current = 0;
    }
  }, [higlassFocus, higlassMouseOver]);

  const viewConfig = useMemo<ViewConfig>(
    () =>
      pipe<ViewConfig>(
        updateViewConfigVariantTracks(variantTracks),
        updateViewConfigFocusGene(
          focusGeneOption ? focusGeneOption.geneName : null,
          focusGeneStart,
          focusGeneEnd
        ),
        updateViewConfigFocusRegion(focusRegionAbs, [2, 4]),
        updateViewConfigFocusStyle(hideUnfocused),
        updateViewConfigColorEncoding(colorEncoding),
        updateViewConfigVariantYScale(variantYScale),
        updateViewConfigXDomain(xDomainStartAbs, xDomainEndAbs, {
          // TODO: Check if calling the shouldSkipUpdatingXDomain function is breaking things later?
          force: shouldSkipUpdatingXDomain(),
        }),
        updateViewConfigFilter(selectedSamples, stratification.categoryField),
        updateViewConfigMatrixHeight(numSamples),
        updateViewConfigEnhancerRegionTracks(enhancerTrackConfig),
        updateViewConfigStratification(stratification)
      )(deepClone(DEFAULT_VIEW_CONFIG_ENHANCER)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // `xDomainStartAbs` and `xDomainEndAbs` are ommitted on purpose to avoid
      // updating the view-config on every pan or zoom event.
      variantTracks,
      focusGeneOption,
      focusGeneStart,
      focusGeneEnd,
      focusRegionAbs,
      hideUnfocused,
      colorEncoding,
      variantYScale,
      selectedSamples,
      numSamples,
      stratification,
    ]
  );

  const viewConfigHeight = useMemo(
    () =>
      viewConfig.views?.[0]?.tracks.top?.reduce(
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
  const higlassClickHandler = (event: HiGlassApiClickEventData) => {
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
      setFocusRegion(event.payload.name);
      higlassEnhancerClickSelection.current = true;
      setFocusRegionOption({
        chr: event.payload.fields[0],
        txStart: event.payload.fields[1],
        txEnd: event.payload.fields[2],
        geneName: event.payload.name,
        score: event.payload.importance,
        type: 'variant',
      });
    } else if (event.type === 'annotation' && event.payload.item) {
      setFocusRegionOption({
        chrStart: event.payload.item.fields[0],
        txStart: +event.payload.item.fields[1],
        chrEnd: event.payload.item.fields[0],
        txEnd: +event.payload.item.fields[2],
        geneName: chrRangePosEncoder([
          `${event.payload.item.fields[0]}:${event.payload.item.fields[1]}`,
          `${event.payload.item.fields[0]}:${event.payload.item.fields[2]}`,
        ]),
        type: 'region',
      });
    }
  };

  const higlassLocationChangeHandler = (event: HiGlassApiLocationEventData) => {
    if (chromInfo === null || typeof chromInfo === 'boolean') {
      throw new Error();
    }
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

  const higlassRangeSelectionHandler = (
    event: HiGlassApiRangeSelectionEventData
  ) => {
    if (event.dataRange[0]) [higlassRangeSelection.current] = event.dataRange;
  };

  const windowMouseDownClearHandler = useCallback((e) => {
    const higlassContainer = higlassContainerRef.current;
    if (!higlassContainer || !isParentOf(e.target, higlassContainer)) {
      setHiglassFocus(false);
    }
  }, []);

  useEffect(
    () => {
      window.addEventListener('mouseup', windowMouseDownClearHandler);
      window.addEventListener('blur', windowMouseDownClearHandler);

      return () => {
        window.removeEventListener('mouseup', windowMouseDownClearHandler);
        window.removeEventListener('blur', windowMouseDownClearHandler);
      };
    },
    // Execute only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const higlassMouseDownHandler = useCallback(() => {
    higlassMouseDown.current = true;
  }, []);

  const higlassInitHandler = useCallback(
    (higlassInstance: HiGlassComponent) => {
      if (higlassInstance !== null) {
        setHiglass(higlassInstance.api);
        higlassApi.current = higlassInstance.api;
        higlassInstance.api.setRangeSelectionToInt();
        higlassListeners.current.push(
          higlassInstance.api.on('click', higlassClickHandler)
        );
        higlassListeners.current.push(
          higlassInstance.api.on(
            'location',
            higlassLocationChangeHandlerDb,
            'context'
          )
        );
        higlassListeners.current.push(
          higlassInstance.api.on(
            'rangeSelection',
            higlassRangeSelectionHandler,
            'context'
          )
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

  // On init only
  useEffect(
    () => {
      function keydownHandler(event: KeyboardEvent) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag && IGNORED_FOCUS_ELEMENTS.has(activeTag)) return;

        event.preventDefault();

        if (higlassApi.current && event.altKey)
          higlassApi.current.activateTool(HiGlassApiMouseTool.SELECT);
      }

      function keyupHandler(event: KeyboardEvent) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag && IGNORED_FOCUS_ELEMENTS.has(activeTag)) return;

        event.preventDefault();

        if (higlassRangeSelection.current) {
          const chrRange = higlassRangeSelection.current.map(
            (chromInfo as ChromosomeInfoResult).absToChr
          );
          const [chrStart, txStart] = chrRange[0];
          const [chrEnd, txEnd] = chrRange[1];
          setFocusRegion([`${chrStart}:${txStart}`, `${chrEnd}:${txEnd}`]);
          setFocusRegionOption({
            chrStart,
            txStart,
            chrEnd,
            txEnd,
            geneName: chrRangePosEncoder([
              `${chrStart}:${txStart}`,
              `${chrEnd}:${txEnd}`,
            ]),
            type: 'region',
          });
        }

        higlassRangeSelection.current = null;
        higlassApi.current?.activateTool(/** default PANZOOM */);
      }

      document.addEventListener('keydown', keydownHandler);
      document.addEventListener('keyup', keyupHandler);

      return () => {
        document.removeEventListener('keydown', keydownHandler);
        document.removeEventListener('keyup', keyupHandler);
      };
    },
    // Execute only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chromInfo]
  );

  // Unmount
  useEffect(
    () => () => {
      if (higlassApi.current) {
        higlassListeners.current.forEach(({ event, handler }) => {
          higlassApi.current?.off(event, handler);
        });
        higlassApi.current
          .getComponent()
          .element.removeEventListener('mousedown', higlassMouseDownHandler);
        higlassApi.current.destroy();
      }
    },
    // Execute only once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Run on every render
  const classes = useStyles();

  return (
    <div>
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
          tabIndex={0}
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
