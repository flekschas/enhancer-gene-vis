import React from 'react';

const withEither = (ifEitherFn, EitherComponent) => (Component) => (props) =>
  ifEitherFn(props) ? <EitherComponent {...props} /> : <Component {...props} />;

export default withEither;
