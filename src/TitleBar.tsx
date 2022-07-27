import React, { ExoticComponent, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import HelpIcon from '@material-ui/icons/Help';
import InfoIcon from '@material-ui/icons/Info';
import SettingsIcon from '@material-ui/icons/Settings';
import Popover, { PopoverOrigin } from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  bar: {
    position: 'relative',
    padding: '2px',
    fontSize: '0.8rem',
    background: theme.palette.grey['100'],
  },
  title: {
    fontSize: '0.8rem',
    padding: '0 2px',
    fontWeight: 900,
  },
  icon: {
    color: theme.palette.grey['400'],
    '&:hover': {
      color: 'black',
    },
  },
  iconActive: {
    color: theme.palette.grey['600'],
    '&:hover': {
      color: 'black',
    },
  },
  popeover: {
    '& > *': {
      maxWidth: '20rem',
      padding: '0.5rem',
      fontSize: '0.8rem',
      '&+p': {
        paddingTop: 0,
      },
    },
  },
  info: {
    '&> *': {
      padding: '0 2px',
    },
    '&> *:last-child': {
      borderBottom: `1px solid ${theme.palette.grey['100']}`,
    },
  },
}));

type TitleBarProps = {
  id: string,
  title: string,
  Info: ExoticComponent,
  Help: ExoticComponent,
  Settings: ExoticComponent,
  useShowInfo: () => [boolean, (x: boolean) => void],
  popoverDirection?: PopoverOrigin['vertical'],
}
const TitleBar = React.memo(function TitleBar({
  id,
  title,
  Info,
  Help,
  Settings,
  useShowInfo,
  popoverDirection = 'bottom',
}: TitleBarProps) {
  const [showInfo, setShowInfo] = useShowInfo();
  const [helpAnchorEl, setHelpAnchorEl] = useState<Element|null>();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<Element|null>();

  const infoToggleHandler = useCallback(() => {
    setShowInfo(!showInfo);
  }, [showInfo, setShowInfo]);

  const helpOpenHandler: MouseEventHandler<HTMLAnchorElement> = useCallback((event) => {
    setHelpAnchorEl(event.currentTarget);
  }, []);

  const helpCloseHandler = useCallback(() => {
    setHelpAnchorEl(null);
  }, []);

  const settingsOpenHandler: MouseEventHandler<HTMLAnchorElement> = useCallback((event) => {
    setSettingsAnchorEl(event.currentTarget);
  }, []);

  const settingsCloseHandler = useCallback(() => {
    setSettingsAnchorEl(null);
  }, []);

  const helpId = useMemo(() => `${id}-help`, [id]);
  const settingsId = useMemo(() => `${id}-settings`, [id]);

  const anchorOriginVertical = useMemo(
    () => (popoverDirection === 'bottom' ? 'bottom' : 'top'),
    [popoverDirection]
  );
  const transformOriginVertical = useMemo(
    () => (popoverDirection === 'bottom' ? 'top' : 'bottom'),
    [popoverDirection]
  );

  // On every render
  const classes = useStyles();

  const helpOpen = Boolean(helpAnchorEl);
  const settingsOpen = Boolean(settingsAnchorEl);

  const iconInfoClass = showInfo ? classes.iconActive : classes.icon;
  const iconHelpClass = helpOpen ? classes.iconActive : classes.icon;
  const iconSettingsClass = settingsOpen ? classes.iconActive : classes.icon;

  return (
    <Grid item>
      <Grid
        item
        className={classes.bar}
        container
        alignItems="center"
        wrap="nowrap"
      >
        <Grid
          item
          container
          alignItems="center"
          wrap="nowrap"
          className={classes.grow}
        >
          <Typography component="h3" className={classes.title} noWrap>
            {title}:
          </Typography>
        </Grid>
        <Grid item>
          <Grid container alignItems="center" wrap="nowrap">
            <IconButton
              aria-label="details"
              className={iconInfoClass}
              size="small"
              onClick={infoToggleHandler}
            >
              <InfoIcon fontSize="inherit" />
            </IconButton>
            <IconButton
              aria-label="help"
              aria-describedby={helpId}
              className={iconHelpClass}
              size="small"
              onClick={helpOpenHandler}
              href=""
            >
              <HelpIcon fontSize="inherit" />
            </IconButton>
            <Popover
              id={helpId}
              open={helpOpen}
              anchorEl={helpAnchorEl}
              onClose={helpCloseHandler}
              anchorOrigin={{
                vertical: anchorOriginVertical,
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: transformOriginVertical,
                horizontal: 'right',
              }}
            >
              <div className={classes.popeover}>
                <Help />
              </div>
            </Popover>
            <IconButton
              aria-label="settings"
              aria-describedby={settingsId}
              className={iconSettingsClass}
              size="small"
              onClick={settingsOpenHandler}
              href=""
            >
              <SettingsIcon fontSize="inherit" />
            </IconButton>
            <Popover
              id={helpId}
              open={settingsOpen}
              anchorEl={settingsAnchorEl}
              onClose={settingsCloseHandler}
              anchorOrigin={{
                vertical: anchorOriginVertical,
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: transformOriginVertical,
                horizontal: 'right',
              }}
            >
              <div className={classes.popeover}>
                <Settings />
              </div>
            </Popover>
          </Grid>
        </Grid>
      </Grid>
      <Grid item className={classes.info}>
        {showInfo && <Info />}
      </Grid>
    </Grid>
  );
});

export default TitleBar;
