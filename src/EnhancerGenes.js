import React from 'react';
import { useRecoilValue } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';

import EnhancerGenesInfo from './EnhancerGenesInfo';
import EnhancerGenesHelp from './EnhancerGenesHelp';
import EnhancerGenesSettings from './EnhancerGenesSettings';
import EnhancerGenesPlot from './EnhancerGenesPlot';
import TitleBar from './TitleBar';

import { focusRegionState, useEnhancerGenesShowInfos } from './state';

const useStyles = makeStyles((theme) => ({
  plot: {
    minHeight: '6rem',
  },
}));

const EnhancerGenes = React.memo(function EnhancerGenes() {
  const focusRegion = useRecoilValue(focusRegionState);

  const classes = useStyles();

  return (
    <div>
      <TitleBar
        id="enhancer-gene"
        title="Enhancer-Gene Connections"
        popoverDirection="top"
        useShowInfo={useEnhancerGenesShowInfos}
        Info={EnhancerGenesInfo}
        Help={EnhancerGenesHelp}
        Settings={EnhancerGenesSettings}
      />
      <div className={classes.plot}>{focusRegion && <EnhancerGenesPlot />}</div>
    </div>
  );
});

export default EnhancerGenes;
