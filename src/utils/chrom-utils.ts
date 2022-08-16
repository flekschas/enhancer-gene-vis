import { ChromInfo } from '@higlass/types';

export const toAbsPosition = (position: string, chromInfo: ChromInfo) => {
  let absPosition;
  if (position.indexOf && position.indexOf(':') >= 0) {
    const [chrom, pos] = position.split(':');
    absPosition = chromInfo.chrPositions[chrom].pos + +pos;
  } else {
    absPosition = +position;
  }
  return absPosition;
};
