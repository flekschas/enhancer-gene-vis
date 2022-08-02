import React, { createContext, useState, useContext } from 'react';

import './radio.css';

const useRadioButtons = (name, onChange) => {
  const [value, setState] = useState(null);

  const handleChange = (event) => {
    setState(event.target.value);
    if (onChange) onChange(event);
  };

  const inputProps = {
    onChange: handleChange,
    name,
    type: 'radio',
  };

  return [value, inputProps];
};

const RadioGroupContext = createContext();

function RadioGroup({ children, name, onChange }) {
  const [, inputProps] = useRadioButtons(name, onChange);
  return (
    <RadioGroupContext.Provider value={inputProps}>
      {children}
    </RadioGroupContext.Provider>
  );
}

function RadioButton(props) {
  const context = useContext(RadioGroupContext);
  return (
    <label className="fb fb-align-center radio-button">
      <input {...props} {...context} />
      {props.label}
    </label>
  );
}

export { RadioButton, RadioGroup };
