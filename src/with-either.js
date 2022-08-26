import React from 'react';

const withEither = (ifEitherFn, EitherComponent) => (Component) =>
  function (props) {
    return ifEitherFn(props) ? (
      <EitherComponent {...props} />
    ) : (
      <Component {...props} />
    );
  };

export default withEither;
