import React, { createContext, useCallback, useState } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import { makeStyles } from '@material-ui/core/styles';

const TooltipContext = createContext();

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    zIndex: 10,
    width: 1,
    height: 1,
    background: 'black',
    fontWeight: 'normal',
    pointerEvents: 'none',
    '& strong': {
      fontWeight: 'bold',
    },
  },
});

export default function TooltipProvider({ children }) {
  const [localState, setLocalState] = useState({
    show: false,
    title: '',
    x: 0,
    y: 0,
    arrow: true,
    placement: 'bottom',
    classes: {},
  });

  const showTooltip = useCallback(
    (
      x,
      y,
      title,
      { arrow = false, placement = 'bottom', classes = {} } = {}
    ) => {
      if (Number.isNaN(+x) || Number.isNaN(+y) || !title) {
        // Close tooltip
        setLocalState({
          show: false,
          title: '',
          x: 0,
          y: 0,
          arrow: true,
          placement: 'bottom',
          classes: {},
        });
      } else {
        // Open tooltip
        setLocalState({
          show: true,
          x,
          y,
          title,
          arrow,
          placement,
          classes,
        });
      }
    },
    []
  );

  const classes = useStyles();

  return (
    <TooltipContext.Provider value={showTooltip}>
      {children}
      <Tooltip
        open={localState.show}
        title={localState.title}
        arrow={localState.arrow}
        placement={localState.placement}
        classes={localState.classes}
      >
        <div
          className={classes.root}
          style={{
            top: localState.y,
            left: localState.x,
          }}
        />
      </Tooltip>
    </TooltipContext.Provider>
  );
}

function useShowTooltip() {
  const context = React.useContext(TooltipContext);
  if (context === undefined) {
    throw new Error('useShowTooltip must be used within a TooltipContext');
  }
  return context;
}

export { useShowTooltip };
