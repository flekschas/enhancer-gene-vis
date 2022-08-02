
import { makeStyles } from '@material-ui/core/styles';

export const useCheckboxStyles = makeStyles((_theme) => ({
  root: {
    position: 'relative',
  },
  filterBar: {
    position: 'sticky',
    zIndex: 1,
    top: '8px',
    '&:before': {
      content: '""',
      position: 'absolute',
      zIndex: 0,
      top: '-9px',
      right: '-8px',
      left: '-8px',
      bottom: 0,
      background: 'white',
    },
  },
  checkbox: {
    marginTop: -6,
    marginBottom: -6,
  },
  checkboxLabel: {
    fontSize: '0.8rem',
    marginLeft: -6,
  },
  nestedCheckbox: {
    marginLeft: 4,
  },
  visible: {
    transition: '.3s ease transform, .3s ease height',
    transform: 'scale(1, 1)',
    height: '1.625rem',
  },
  invisible: {
    transition: '.3s ease transform, .3s ease height',
    transform: 'scale(1, 0)',
    height: '0rem',
  },
}));
