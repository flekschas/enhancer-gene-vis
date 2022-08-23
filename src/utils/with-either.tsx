import React from 'react';

const withEither =
  (ifEitherFn: () => boolean, EitherComponent: React.FC) =>
  (Component: React.FC) =>
    // eslint-disable-next-line func-names
    function (props: any) {
      return ifEitherFn() ? (
        <EitherComponent {...props} />
      ) : (
        <Component {...props} />
      );
    };

export default withEither;
