import { identity } from '@flekschas/utils';
import queryString from 'query-string';

export const contains = (a, b) => a[0] <= b[0] && a[1] >= b[1];

export const createColorTexture = (PIXI, colors) => {
  const colorTexRes = Math.max(2, Math.ceil(Math.sqrt(colors.length)));
  const rgba = new Float32Array(colorTexRes ** 2 * 4);
  colors.forEach((color, i) => {
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4] = color[0]; // r
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4 + 1] = color[1]; // g
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4 + 2] = color[2]; // b
    // eslint-disable-next-line prefer-destructuring
    rgba[i * 4 + 3] = color[3]; // a
  });

  return [PIXI.Texture.fromBuffer(rgba, colorTexRes, colorTexRes), colorTexRes];
};

export const dashedXLineTo = (graphics, xStart, xEnd, y, dashSize) => {
  const diff = xEnd - xStart;
  const direction = Math.sign(diff);
  const width = Math.abs(diff);
  const stepSize = dashSize * 2;
  const numSteps = Math.ceil(width / stepSize);
  for (let i = 0; i < numSteps; i++) {
    graphics.moveTo(xStart + i * stepSize * direction, y);
    graphics.lineTo(xStart + (i * stepSize + dashSize) * direction, y);
  }
};

export const getQueryStringValue = (key, decoder = identity) =>
  decoder(queryString.parse(window.location.search)[key]);

export const setQueryStringValue = (key, value, encoder = identity) => {
  const values = queryString.parse(window.location.search);
  const newQsValue = queryString.stringify(
    {
      ...values,
      [key]: encoder(value),
    },
    { strict: false }
  );
  const url = `${window.location.origin}${window.location.pathname}?${newQsValue}`;
  window.history.pushState({ path: url }, '', url);
};

export const toAbsPosition = (position, chromInfo) => {
  let absPosition;
  if (position.indexOf && position.indexOf(':') >= 0) {
    const [chrom, pos] = position.split(':');
    absPosition = chromInfo.chrPositions[chrom].pos + +pos;
  } else {
    absPosition = +position;
  }
  return absPosition;
};
