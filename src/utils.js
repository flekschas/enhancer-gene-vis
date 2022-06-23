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

export const scaleBand = () => {
  let domain = [];
  let fixedBandwidth = null;
  let bandwidth = 1;
  let range = [0, 1];
  let rangeSize = range[1] - range[0];
  let paddingInner = [];
  // If `true` the padding will begin before the first bar!
  let paddingInnerZeroBased = false;
  let totalWidth = 0;

  const sum = (a, b) => a + b;
  const getBandwidth = () => fixedBandwidth || bandwidth;

  const update = () => {
    rangeSize = range[1] - range[0];

    const totalPaddingInner = paddingInner.reduce(sum, 0);
    bandwidth = (rangeSize - totalPaddingInner) / domain.length;
    totalWidth = totalPaddingInner + domain.length * getBandwidth();
  };

  const scale = (v) => {
    const idx = domain.indexOf(v);

    if (idx === -1) return undefined;

    return (
      idx * getBandwidth() +
      paddingInner.slice(0, idx + paddingInnerZeroBased).reduce(sum, 0)
    );
  };

  scale.domain = (newDomain) => {
    if (newDomain) {
      domain = [...newDomain];
      update();
      return scale;
    }

    return domain;
  };

  scale.range = (newRange) => {
    if (newRange) {
      range = [...newRange];
      update();
      return scale;
    }

    return range;
  };

  scale.bandwidth = () => getBandwidth();

  scale.fixedBandwidth = (newFixedBandwidth) => {
    if (newFixedBandwidth) {
      fixedBandwidth = newFixedBandwidth;
      update();
      return scale;
    }

    return newFixedBandwidth;
  };

  scale.totalWidth = () => totalWidth;

  scale.rangeSize = () => rangeSize;

  scale.paddingInner = (newPaddingInner) => {
    if (newPaddingInner) {
      paddingInner = newPaddingInner;
      update();
      return scale;
    }

    return paddingInner;
  };

  scale.paddingInnerZeroBased = (newPaddingInnerZeroBased) => {
    if (newPaddingInnerZeroBased) {
      paddingInnerZeroBased = newPaddingInnerZeroBased;
      update();
      return scale;
    }

    return paddingInnerZeroBased;
  };

  return scale;
};

export const stringifySvg = (svg) =>
  new window.XMLSerializer().serializeToString(svg);

export const booleanQueryStringDecoder = (v) =>
  v === undefined ? undefined : v === 'true';

export const customBooleanQueryStringDecoder = (excluded = []) => {
  const s = new Set(excluded)
  return (v) => {
    console.log(v);
    if (v === undefined || s.has(v)) return v;
    return v === 'true';
  };
};

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
