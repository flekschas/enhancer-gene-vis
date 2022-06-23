import { ChromosomeInfoResult } from 'higlass';
import React, { createContext } from 'react';

const ChromInfoContext = createContext<ChromosomeInfoResult | boolean | null | undefined>(undefined);

type ChromInfoProviderProps = {
  children: React.ReactNode[] | React.ReactNode;
  chromInfo: ChromosomeInfoResult | boolean | null;
}
export default function ChromInfoProvider({ children, chromInfo }: ChromInfoProviderProps): JSX.Element {
  return (
    <ChromInfoContext.Provider value={chromInfo}>
      {children}
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
