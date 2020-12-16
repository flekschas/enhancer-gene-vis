import React from 'react';
import { useRecoilValue } from 'recoil';
import { makeStyles } from '@material-ui/core/styles';

import EnhancerGenesInfo from './EnhancerGenesInfo';
import EnhancerGenesHelp from './EnhancerGenesHelp';
import EnhancerGenesSettings from './EnhancerGenesSettings';
import EnhancerGenesPlot from './EnhancerGenesPlot';
import TitleBar from './TitleBar';

import { focusVariantState, useEnhancerGenesShowInfos } from './state';

const useStyles = makeStyles((theme) => ({
  root: {
    // marginLeft: '-8px',
  },
  plot: {
    minHeight: '6rem',
  },
}));

const EnhancerGenes = React.memo(function EnhancerGenes() {
  const focusVariant = useRecoilValue(focusVariantState);

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <TitleBar
        id="enhancer-gene"
        title="Enhancer-Gene Connections"
        popoverDirection="top"
        useShowInfo={useEnhancerGenesShowInfos}
        Info={EnhancerGenesInfo}
        Help={EnhancerGenesHelp}
        Settings={EnhancerGenesSettings}
      />
      <div className={classes.plot}>
        {focusVariant && <EnhancerGenesPlot />}
      </div>
    </div>
  );
});

export default EnhancerGenes;
