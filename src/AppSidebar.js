import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { isString, nthIndexOf } from '@flekschas/utils';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import ButtonBase from '@material-ui/core/ButtonBase';
import { makeStyles } from '@material-ui/core/styles';
import SettingsIcon from '@material-ui/icons/Settings';

import CheckboxList from './CheckboxList';
import Logo from './Logo';
import VariantsSettings from './VariantsSettings';
import Welcome from './Welcome';
import { useChromInfo } from './ChromInfoProvider';
import { useShowModal } from './ModalProvider';

import {
  higlassEnhancerRegionsState,
  higlassDnaAccessState,
  sampleFilterState,
  sampleWithName,
  sampleGroupWithGroup,
  showVariantsSettingsState,
  useXDomainStartWithAssembly,
  useXDomainEndWithAssembly,
  useShowWelcome,
} from './state';
import { enhancerGenesSvgState } from './state/enhancer-gene-track-state';

import { download, stringifySvg } from './utils';

import {
  DEFAULT_COLOR_MAP_DARK,
  DEFAULT_COLOR_MAP,
  DEFAULT_VIEW_CONFIG_ENHANCER,
  DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY,
  SVG_SKELETON,
  DRAWER_WIDTH,
  GROUPED_SAMPLE_OPTIONS,
  SAMPLE_TO_GROUP,
} from './constants';

const useStyles = makeStyles((theme) => ({
  h1: {
    height: '100%',
    margin: '0',
    padding: '0',
    fontSize: '1rem',
    lineHeight: '1rem',
    fontWeight: 'bold',
  },
  drawer: {
    width: DRAWER_WIDTH,
    flexShrink: 0,
  },
  drawerGrid: {
    height: '100%',
  },
  drawerPaper: {
    width: DRAWER_WIDTH,
  },
  settings: {
    position: 'relative',
    flexGrow: 1,
  },
  globalSettingsTitle: {
    padding: '3px 8px 4px 8px',
    margin: 0,
    '& h6': {
      fontSize: '0.8rem',
      fontWeight: 'bold',
    },
  },
  settingsContent: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden auto',
  },
  toolbar: theme.mixins.toolbar,
  grow: {
    flexGrow: 1,
  },
  titleBar: {
    position: 'relative',
    padding: '2px',
    fontSize: '0.8rem',
    background: theme.palette.grey['100'],
  },
  titleBarText: {
    fontSize: '0.8rem',
  },
  titleBarContainer: {
    width: 'auto',
  },
  titleBarTitle: {
    padding: '0 2px',
    fontWeight: 900,
  },
  titleBarIcon: {
    color: theme.palette.grey['400'],
    '&:hover': {
      color: 'black',
    },
  },
  titleBarIconActive: {
    color: 'black',
    '&:hover': {
      color: 'black',
    },
  },
  globalSettingsFirstBox: {
    margin: theme.spacing(0, 1, 1, 1),
  },
}));

const extractCoreFromHiGlassSvg = (svg) => {
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
  return {
    core: svg.substring(fifthLn + 1, lastLn),
    width,
    height,
  };
};

const extractCoreFromStringifiedSvg = (svg) => {
  const firstSvgClosingBracket = svg.indexOf('>');
  const lastSvgOpeningBracket = svg.lastIndexOf('</svg>');
  const [width, height] = svg
    .substring(
      svg.indexOf('viewbox="') + 9,
      svg.indexOf('"', svg.indexOf('viewbox="') + 9)
    )
    .split(' ')
    .slice(2);
  return {
    core: svg.substring(firstSvgClosingBracket + 1, lastSvgOpeningBracket),
    width: +width,
    height: +height,
  };
};

const AppSidebar = React.memo(function AppSidebar() {
  const chromInfo = useChromInfo();
  const showModal = useShowModal();

  const [xDomainStart, setXDomainStart] = useXDomainStartWithAssembly(
    chromInfo
  );
  const [xDomainEnd, setXDomainEnd] = useXDomainEndWithAssembly(chromInfo);
  const [showWelcome, setShowWelcome] = useShowWelcome();
  const [showVariantsSettings, setShowVariantsSettings] = useRecoilState(
    showVariantsSettingsState
  );

  const higlassEnhancerRegions = useRecoilValue(higlassEnhancerRegionsState);
  const higlassDnaAccess = useRecoilValue(higlassDnaAccessState);
  const enhancerGenesSvg = useRecoilValue(enhancerGenesSvgState);

  const [userChangedDomain, setUserChangedDomain] = useState(0);

  const numericalXDomainStart = useMemo(
    () =>
      isString(xDomainStart) && xDomainStart.indexOf(':') >= 0
        ? chromInfo.chrToAbs([
            xDomainStart.split(':')[0],
            +xDomainStart.split(':')[1],
          ])
        : +xDomainStart,
    [xDomainStart, chromInfo]
  );

  const numericalXDomainEnd = useMemo(
    () =>
      isString(xDomainEnd) && xDomainEnd.indexOf(':') >= 0
        ? chromInfo.chrToAbs([
            xDomainEnd.split(':')[0],
            +xDomainEnd.split(':')[1],
          ])
        : +xDomainEnd,
    [xDomainEnd, chromInfo]
  );

  const xDomainStartChangeHandler = useCallback(
    (event) => {
      setXDomainStart(event.target.value);
      setUserChangedDomain(2);
    },
    [setXDomainStart]
  );

  const xDomainEndChangeHandler = useCallback(
    (event) => {
      setXDomainEnd(event.target.value);
      setUserChangedDomain(2);
    },
    [setXDomainEnd]
  );

  useEffect(() => {
    setUserChangedDomain((curr) => Math.max(0, curr - 1));
  }, [xDomainStart, xDomainEnd]);

  const higlassEnhancerZoomToXDomain = (event) => {
    if (!higlassEnhancerRegions) return;

    const xDomain = [
      ...higlassEnhancerRegions.getViewConfig().views[0].initialXDomain,
    ];

    if (!Number.isNaN(+numericalXDomainStart)) {
      xDomain[0] = numericalXDomainStart;
    }
    if (!Number.isNaN(+numericalXDomainEnd)) {
      xDomain[1] = numericalXDomainEnd;
    }

    higlassEnhancerRegions.zoomTo(
      'context',
      xDomain[0],
      xDomain[1],
      xDomain[0],
      xDomain[1],
      2000
    );
  };

  const closeWelcome = useCallback(() => {
    setShowWelcome(false);
  }, [setShowWelcome]);

  const openWelcome = useCallback(() => {
    setShowWelcome(true);
  }, [setShowWelcome]);

  const openWelcomeIntro = useCallback(() => {
    setShowWelcome('intro');
  }, [setShowWelcome]);

  useEffect(() => {
    if (showWelcome)
      showModal(Welcome, closeWelcome, {
        openIntroHandler: openWelcomeIntro,
        closeIntroHandler: openWelcome,
      });
    else showModal();
  }, [showWelcome, showModal, closeWelcome, openWelcomeIntro]);

  const closeVariantsSettings = useCallback(() => {
    setShowVariantsSettings(false);
  }, [setShowVariantsSettings]);

  const openVariantsSettings = useCallback(() => {
    setShowVariantsSettings(true);
  }, [setShowVariantsSettings]);

  useEffect(() => {
    if (showVariantsSettings) {
      showModal(VariantsSettings, closeVariantsSettings);
    } else if (!showWelcome) {
      showModal();
    }
  }, [showWelcome, showVariantsSettings, showModal, closeVariantsSettings]);

  const mergeSvgs = (enhancerSvg, dnaAccessSvg, enhancerGeneSvg) => {
    const {
      core: enhancerSvgCore,
      width: enhancerWidth,
      height: enhancerHeight,
    } = extractCoreFromHiGlassSvg(enhancerSvg);
    const {
      core: dnaAccessSvgCore,
      width: dnaAccessWidth,
      height: dnaAccessHeight,
    } = extractCoreFromHiGlassSvg(dnaAccessSvg);
    const {
      core: enhancerGeneSvgCore = null,
      height: enhancerGeneHeight = 0,
    } = enhancerGeneSvg ? extractCoreFromStringifiedSvg(enhancerGeneSvg) : {};

    const actualEnhancerHeight = DEFAULT_VIEW_CONFIG_ENHANCER.views[0].tracks.top.reduce(
      (height, track) => height + track.height,
      0
    );
    const actualDnaAccessHeight = DEFAULT_VIEW_CONFIG_DNA_ACCESSIBILITY.views[0].tracks.top.reduce(
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
        enhancerHeight + enhancerGeneHeight + padding,
        dnaAccessHeight,
        actualEnhancerHeight + enhancerGeneHeight + padding,
        actualDnaAccessHeight
      )
    );
    mergedSvg = mergedSvg.replace('_ENHANCER_', enhancerSvgCore);
    mergedSvg = mergedSvg.replace(
      '_ENHANCER_GENE_Y_',
      enhancerHeight + padding
    );
    mergedSvg = mergedSvg.replace('_ENHANCER_GENE_', enhancerGeneSvgCore);
    mergedSvg = mergedSvg.replace('_DNA_ACCESS_X_', enhancerWidth + padding);
    mergedSvg = mergedSvg.replace('_DNA_ACCESS_', dnaAccessSvgCore);

    if (enhancerGeneSvgCore === null) {
      mergedSvg = mergedSvg.replace('_ENHANCER_GENE_', '');
    } else {
      mergedSvg = mergedSvg.replace('_ENHANCER_GENE_', enhancerGeneSvgCore);
    }

    return mergedSvg;
  };

  const higlassExportAsSvg = () => {
    if (!higlassEnhancerRegions || !higlassDnaAccess) {
      console.warn('One of the HiGlass instances is not available');
      return;
    }

    const mergedSvg = mergeSvgs(
      higlassEnhancerRegions.exportAsSvg(),
      higlassDnaAccess.exportAsSvg(),
      enhancerGenesSvg ? stringifySvg(enhancerGenesSvg) : null
    );

    download(
      'abc-enhancers.svg',
      new Blob([mergedSvg], { type: 'image/svg+xml' })
    );
  };

  // Run on every render
  const classes = useStyles();

  return (
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
          <ButtonBase
            className={classes.toolbar}
            style={{ width: '100%' }}
            onClick={openWelcome}
          >
            <h1 className={classes.h1}>
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
              {userChangedDomain > 0 && (
                <Box m={0}>
                  <Button
                    variant="contained"
                    margin="dense"
                    onClick={higlassEnhancerZoomToXDomain}
                    fullWidth
                    disableElevation
                    size="small"
                  >
                    Go
                  </Button>
                </Box>
              )}
            </Box>
            <Divider />
            <Box m={1}>
              <Button
                variant="contained"
                margin="dense"
                fullWidth
                disableElevation
                size="small"
                startIcon={<SettingsIcon />}
                onClick={openVariantsSettings}
              >
                Edit Variants
              </Button>
            </Box>
            <Divider />
          </Grid>
          <Grid item className={classes.settings}>
            <Box m={0} className={classes.settingsContent}>
              <Box className={classes.globalSettingsFirstBox}>
                <CheckboxList
                  filterState={sampleFilterState}
                  filterLabel="Filter Samples"
                  optionWithName={sampleWithName}
                  optionGroupWithGroup={sampleGroupWithGroup}
                  groupedOptions={GROUPED_SAMPLE_OPTIONS}
                  optionToGroup={SAMPLE_TO_GROUP}
                  groupColors={DEFAULT_COLOR_MAP}
                  groupColorsDark={DEFAULT_COLOR_MAP_DARK}
                />
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
                size="small"
              >
                Export as SVG
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Drawer>
  );
});

export default AppSidebar;
