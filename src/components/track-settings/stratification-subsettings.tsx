import React, { useState } from 'react';
import FileInput from '../FileInput';
import yaml from 'js-yaml';
import { useRecoilState } from 'recoil';
import { Stratification, stratificationState } from '../../state/stratification-state';

const StratificationSubsettings = React.memo(function StratificationSubsettings() {
  const [stratificationConfig, setStratificationConfig] = useState<File>();
  const [stratification, setStratification] = useRecoilState(stratificationState);
  

  function handleNewStratificationConfig(newStratificationConfig: File) {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const result = event.target?.result;
      if (result) {
        const config = yaml.load(result as string) as Stratification;
        setStratification(config);
      }
    });
    reader.readAsText(newStratificationConfig);
    setStratificationConfig(newStratificationConfig);
  }

  return (
    <>
      <p>
        Upload a cell stratification file to categorize cell types. YAML files
        are currently accepted.
      </p>
      <FileInput
        file={stratificationConfig}
        accept=".yaml"
        onChange={handleNewStratificationConfig}
        onClear={() => {}}
      />
    </>
  );
})

export default StratificationSubsettings;