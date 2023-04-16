import { ChromosomeInfo, ChromosomeInfoResult } from 'higlass';
import React, { createContext, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import AppInitializing from '../components/app/AppInitializing';
import {
  useRefGenomeState,
  chromosomeInfoResultState,
  RefGenomeSrc,
} from '../state/chromosome-state';

const ChromInfoContext = createContext<
  ChromosomeInfoResult | boolean | null | undefined
>(undefined);

type ChromInfoProviderProps = {
  children: React.ReactNode[] | React.ReactNode;
};
export default function ChromInfoProvider({
  children,
}: ChromInfoProviderProps): JSX.Element {
  const [refGenome, _setRefGenome] = useRefGenomeState();
  const [chromInfo, setChromInfo] = useRecoilState(chromosomeInfoResultState);

  useEffect(() => {
    ChromosomeInfo(RefGenomeSrc[refGenome])
      .then((_chromInfo) => {
        console.log(_chromInfo);
        if (_chromInfo.totalLength === undefined) {
          // Monkey patch: chrom sizes were actually unavailable...
          // Also see https://github.com/higlass/higlass/issues/957
          setChromInfo(undefined);
        } else {
          setChromInfo(_chromInfo);
        }
      })
      .catch(() => {
        setChromInfo(undefined);
      });
  }, [refGenome]);

  return (
    <ChromInfoContext.Provider value={chromInfo}>
      {chromInfo ? children : <AppInitializing />}
    </ChromInfoContext.Provider>
  );
}

function useChromInfo() {
  const context = React.useContext(ChromInfoContext);
  if (context === undefined) {
    throw new Error('useChromInfo must be used within a ChromInfoContext');
  }
  return context;
}

export { useChromInfo };
