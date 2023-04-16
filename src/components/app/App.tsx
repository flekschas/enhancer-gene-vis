import React from 'react';
import { RecoilRoot } from 'recoil';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import ChromInfoProvider from '../../contexts/ChromInfoProvider';
import AppMain from './AppMain';

import './App.css';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#000',
    },
    secondary: {
      main: '#000',
    },
  },
});

function App() {

  return (
    <div className="App">
      <RecoilRoot>
        <ThemeProvider theme={theme}>
          <ChromInfoProvider>
            <AppMain />
          </ChromInfoProvider>
        </ThemeProvider>
      </RecoilRoot>
    </div>
  );
}

export default App;
