import React, { ChangeEventHandler, useCallback, useState } from 'react';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ClearIcon from '@material-ui/icons/Clear';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import { OverridableComponent } from '@material-ui/core/OverridableComponent';
import { PropTypes, SvgIconTypeMap } from '@material-ui/core';

type FileInputProps = {
  onChange?: (file: File, event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  className?: string;
  label?: string;
  accept?: string;
  color?: PropTypes.Color;
  Icon?: OverridableComponent<SvgIconTypeMap<{}, 'svg'>>;
  file?: File;
};

const FileInput = React.memo(
  React.forwardRef(function FileInput(
    props: FileInputProps,
    ref: React.ForwardedRef<HTMLInputElement>
  ) {
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
    const otherProps: { [key: string]: any } = { ...props };
    delete otherProps.onChange;
    delete otherProps.onClear;
    delete otherProps.className;
    delete otherProps.file;
    delete otherProps.label;
    delete otherProps.accept;
    delete otherProps.color;
    delete otherProps.Icon;

    const [file, setFile] = useState(props.file || null);

    const localChangeHandler: ChangeEventHandler<HTMLInputElement> =
      useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
          const fileList = event.target.files;
          if (fileList && fileList.length > 0) {
            const file = fileList[0];
            setFile(file);
            if (changeHandler) {
              changeHandler(file, event);
            }
          }
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
