import React, { useCallback, useState } from 'react';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ClearIcon from '@material-ui/icons/Clear';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';

const FileInput = React.memo(
  React.forwardRef(function FileInput(props, ref) {
    const {
      onChange: changeHandler,
      onClear: clearHandler,
      className = '',
      label = 'Select',
      accept = '*',
      color = 'default',
      Icon = InsertDriveFileIcon,
    } = props;

    // We will spread any other props onto the root component. However, some
    // props can mess things up so we will remove them in the following lines
    const otherProps = { ...props };
    delete otherProps.onChange;
    delete otherProps.onClear;
    delete otherProps.className;
    delete otherProps.file;
    delete otherProps.label;
    delete otherProps.accept;
    delete otherProps.color;
    delete otherProps.Icon;

    const [file, setFile] = useState(props.file || null);

    const localChangeHandler = useCallback(
      (event) => {
        const fileList = event.target.files;
        setFile(fileList[0]);
        if (changeHandler) changeHandler(fileList[0], event);
      },
      [changeHandler]
    );

    const clearFile = useCallback(() => {
      setFile(null);
      if (clearHandler) clearHandler();
    }, [clearHandler]);

    return (
      <ButtonGroup {...otherProps} className="r" ref={ref}>
        <Button
          variant={file ? 'outlined' : 'contained'}
          component="label"
          className={className}
          color={color}
          disableElevation
          startIcon={<Icon />}
        >
          <input
            accept={accept}
            type="file"
            onChange={localChangeHandler}
            hidden
          />
          {file ? file.name : label}
        </Button>
        <Button
          variant="contained"
          disabled={!file}
          onClick={clearFile}
          disableElevation
        >
          <ClearIcon fontSize="inherit" />
        </Button>
      </ButtonGroup>
    );
  })
);

export default FileInput;
