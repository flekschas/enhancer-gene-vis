import React, { createContext } from 'react';

const ChromInfoContext = createContext();

export default function ChromInfoProvider({ children, chromInfo }) {
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
