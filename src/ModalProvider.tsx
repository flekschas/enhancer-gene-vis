import React, { createContext, useCallback, useState } from 'react';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import Modal from '@material-ui/core/Modal';
import { makeStyles } from '@material-ui/core/styles';

type ModalFunction = (
  newComponent?: any,
  newCustomCloseHandler?: any,
  newCustomProps?: any
) => void;

const ModalContext = createContext<ModalFunction | undefined>(undefined);

const useStyles = makeStyles((theme) => ({
  root: {
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
  },
}));

type ModalProviderProps = {
  children: React.ReactNode[] | React.ReactNode;
};
export default function ModalProvider({ children }: ModalProviderProps) {
  const [Component, setComponent] = useState<React.ElementType | null>(null);
  const [customCloseHandler, setCustomCloseHandler] = useState<
    (() => void) | null
  >(null);
  const [customProps, setCustomProps] = useState<{ [key: string]: any } | null>(
    null
  );

  const showModal = useCallback(
    (
      newComponent = null,
      newCustomCloseHandler = null,
      newCustomProps = {}
    ) => {
      setComponent(newComponent);
      setCustomCloseHandler(() => newCustomCloseHandler);
      setCustomProps(newCustomProps);
    },
    []
  );

  const closeHandler = useCallback(() => {
    setComponent(null);
    setCustomCloseHandler(null);
  }, []);

  const classes = useStyles();

  const open = Boolean(Component);

  return (
    <ModalContext.Provider value={showModal}>
      {children}
      <Modal
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className={classes.root}
        open={open}
        onClose={customCloseHandler || closeHandler}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 250,
        }}
      >
        <Fade in={open}>
          <div className={classes.paper}>
            {Component && (
              <Component
                {...customProps}
                closeHandler={customCloseHandler || closeHandler}
              />
            )}
          </div>
        </Fade>
      </Modal>
    </ModalContext.Provider>
  );
}

function useShowModal(): ModalFunction {
  const context = React.useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useShowModal must be used within a ModalContext');
  }
  return context;
}

export { useShowModal };
