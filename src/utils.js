import { identity } from '@flekschas/utils';

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

export const download = (filename, stringOrBlob) => {
  const blob =
    typeof stringOrBlob === 'string'
      ? new Blob([stringOrBlob], { type: 'application/octet-stream' })
      : stringOrBlob;
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
    URL.revokeObjectURL(elem.href);
  }
};

export const toFixed = (number, decimals, forced) => {
  let string = number.toFixed(decimals);
  if (!forced) {
    while (string[string.length - 1] === '0') {
      string = string.substring(0, string.length - 1);
    }
    if (string[string.length - 1] === '.') {
      string = string.substring(0, string.length - 1);
    }
  }
  return string;
};

export const stringifySvg = (svg) =>
  new window.XMLSerializer().serializeToString(svg);

export const booleanQueryStringDecoder = (v) =>
  v === undefined ? undefined : v === 'true';

export const isChrRange = (chrRange) =>
  chrRange.match(/^chr(\d+)[:.](\d+)(([-~+])(\d+))?(-chr(\d+)[:.](\d+))?$/);

export const getIntervalCenter = (interval) =>
  interval[0] + (interval[1] - interval[0]) / 2;

export const chrPosUrlDecoder = (chrPos) =>
  chrPos ? chrPos.replace('.', ':') : chrPos;

export const chrPosUrlEncoder = (chrPos) =>
  chrPos ? chrPos.replace(':', '.') : chrPos;

export const chrPosAdd = (chrPos, value) => {
  if (!chrPos) return chrPos;

  const [chrom, pos] = chrPos.split(':');

  return `${chrom}:${+pos + +value}`;
};

export const chrRangePosUrlDecoder = (chrRangePos) => {
  if (!chrRangePos) return chrRangePos;

  let [start, end] = chrRangePos.split('-');
  let range = null;

  [start, range] = chrPosUrlDecoder(start).split('~');

  if (end) {
    end = chrPosUrlDecoder(end);
  } else if (range) {
    end = chrPosAdd(start, range);
  } else {
    end = chrPosAdd(start, 1);
  }

  return [start, end];
};

export const chrRangePosEncoder = (
  chrRangePos,
  chrPosEncoder = identity,
  lengthOperator = '+'
) => {
  if (!chrRangePos) return chrRangePos;

  const [startChrom, startPos] = chrRangePos[0].split(':');
  const [endChrom, endPos] = chrRangePos[1].split(':');

  if (startChrom === endChrom) {
    const length = Math.abs(+endPos - +startPos);

    if (length < 2) return chrPosEncoder(chrRangePos[0]);

    if (length < 100000)
      return `${chrPosEncoder(chrRangePos[0])}${lengthOperator}${length}`;

    return `${chrPosEncoder(chrRangePos[0])}-${endPos}`;
  }

  return chrRangePos.map(chrPosEncoder).join('-');
};

export const chrRangePosUrlEncoder = (chrRangePos) =>
  chrRangePosEncoder(chrRangePos, chrPosUrlEncoder, '~');
