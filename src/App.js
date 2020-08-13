import React, { useState, useEffect } from 'react';
import { ChromosomeInfo } from 'higlass';
import { pipe } from '@flekschas/utils';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import AppInitializing from './AppInitializing';
import AppError from './AppError';
import Viewer from './Viewer';
import withEither from './with-either';

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

const App = () => {
  const [chromInfo, setChromInfo] = useState(null);

  useEffect(() => {
    ChromosomeInfo('https://s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv')
      .then((_chromInfo) => {
        if (_chromInfo.totalLength === undefined) {
          // Monkey patch: chrom sizes were actually unavailable...
          // Also see https://github.com/higlass/higlass/issues/957
          setChromInfo(false);
        } else {
          setChromInfo(_chromInfo);
        }
      })
      .catch(() => {
        setChromInfo(false);
      });
  }, []);

  const AppViewer = pipe(
    withEither(() => chromInfo === null, AppInitializing),
    withEither(() => chromInfo === false, AppError)
  )(Viewer);

  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <AppViewer chromInfo={chromInfo} />
      </ThemeProvider>
    </div>
  );
};

export default App;
