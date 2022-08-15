import { ChromosomeInfoResult } from 'higlass';
import { identity, memoize } from 'lodash-es';
import { atom, RecoilState, selector } from 'recoil';
import {
  isChrRange,
  chrRangePosUrlDecoder,
  chrRangePosEncoder,
  chrRangePosUrlEncoder,
} from '../utils';
import { toAbsPosition } from '../utils/chrom-utils';
import {
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';
import { getDefault } from './utils';

type FocusGene = {
  chr: string;
  txStart: number;
  txEnd: number;
  geneName: string;
  type: 'gene';
};

type FocusRegion = {
  chr?: string;
  chrStart?: number;
  chrEnd?: number;
  txStart: number;
  txEnd: number;
  geneName: string;
  score?: number;
  type: 'region' | 'variant';
};

export const focusGeneState: RecoilState<string> = atom({
  key: 'focusGene',
  default: getDefault('g', '', identity),
});

export const focusGeneOptionState = atom<FocusGene | null>({
  key: 'focusGeneOption',
  default: null,
});

export const focusRegionState = atom<string | string[]>({
  key: `focusRegion`,
  default: getDefault('f', 'rs1250566', (v) =>
    v && isChrRange(v) ? chrRangePosUrlDecoder(v) : v
  ),
});

export const focusRegionOptionState = atom<FocusRegion | null>({
  key: `focusRegionOption`,
  default: getDefault('f', null, (v) => {
    if (!v || !isChrRange(v)) return null;

    const [start, end] = chrRangePosUrlDecoder(v);

    if (!start || !end) return null;

    const [chrStart, txStart] = start.split(':');
    const [chrEnd, txEnd] = end.split(':');

    return {
      chrStart,
      chrEnd,
      txStart: +txStart,
      txEnd: +txEnd,
      geneName: chrRangePosEncoder([start, end]),
      type: 'region',
    };
  }),
});

export const focusGeneStartWithAssembly = memoize(
  (chromInfo) =>
    selector({
      key: `focusGeneStart-${chromInfo.totalLength}`,
      get: ({ get }) => {
        const focusGeneOption = get(focusGeneOptionState);
        return focusGeneOption
          ? toAbsPosition(
              `${focusGeneOption.chr}:${focusGeneOption.txStart}`,
              chromInfo
            )
          : null;
      },
    }),
  (chromInfo) => chromInfo.totalLength
);

export const focusGeneEndWithAssembly = memoize(
  (chromInfo) =>
    selector({
      key: `focusGeneEnd-${chromInfo.totalLength}`,
      get: ({ get }) => {
        const focusGeneOption = get(focusGeneOptionState);
        return focusGeneOption
          ? toAbsPosition(
              `${focusGeneOption.chr}:${focusGeneOption.txEnd}`,
              chromInfo
            )
          : null;
      },
    }),
  (chromInfo) => chromInfo.totalLength
);

export const focusRegionAbsWithAssembly = memoize(
  (chromInfo) =>
    selector<[number, number]|null>({
      key: `focusRegionAbs-${chromInfo.totalLength}`,
      get: ({ get }) => {
        const focusRegionOption = get(focusRegionOptionState);

        if (!focusRegionOption) return null;

        if (focusRegionOption.chrStart)
          return [
            toAbsPosition(
              `${focusRegionOption.chrStart}:${focusRegionOption.txStart}`,
              chromInfo
            ),
            toAbsPosition(
              `${focusRegionOption.chrEnd}:${focusRegionOption.txEnd}`,
              chromInfo
            ),
          ];

        const startAbs = toAbsPosition(
          `${focusRegionOption.chr}:${focusRegionOption.txStart}`,
          chromInfo
        );

        return [startAbs, startAbs + 1];
      },
    }),
  (chromInfo) => chromInfo.totalLength
);

export const focusRegionRelState = selector({
  key: 'focusVariantRel',
  get: ({ get }) => {
    const focusRegionOption = get(focusRegionOptionState);

    if (!focusRegionOption) return null;

    if (
      focusRegionOption.chrStart &&
      focusRegionOption.chrEnd &&
      focusRegionOption.chrStart !== focusRegionOption.chrEnd
    )
      // The relative position doesn't exist because the selected region
      // stretches across chromsomes
      return Number.NaN;

    if (focusRegionOption.chrStart) {
      return (
        +focusRegionOption.txStart +
        (+focusRegionOption.txEnd - +focusRegionOption.txStart) / 2
      );
    }

    return +focusRegionOption.txStart;
  },
});

export const focusRegionStrState = selector({
  key: 'focusRegionStr',
  get: ({ get }) => {
    const focusRegionOption = get(focusRegionOptionState);

    if (!focusRegionOption) return null;

    const chrRange = focusRegionOption.chrStart
      ? [
          `${focusRegionOption.chrStart}:${focusRegionOption.txStart}`,
          `${focusRegionOption.chrEnd}:${focusRegionOption.txEnd}`,
        ]
      : [
          `${focusRegionOption.chr}:${focusRegionOption.txStart}`,
          `${focusRegionOption.chr}:${focusRegionOption.txEnd}`,
        ];

    return chrRangePosEncoder(chrRange);
  },
});

export const useFocusGene = () =>
  useRecoilQueryString('g', focusGeneState, identity);
export const useFocusGeneSyncher = () =>
  useRecoilQueryStringSyncher('g', focusGeneState, identity);

export const useFocusRegion = (_chromInfo?: ChromosomeInfoResult) =>
  useRecoilQueryString('f', focusRegionState, (v) =>
    Array.isArray(v) ? chrRangePosUrlEncoder(v) : v
  );
export const useFocusRegionSyncher = (_chromInfo?: ChromosomeInfoResult) =>
  useRecoilQueryStringSyncher('f', focusRegionState, (v) =>
    Array.isArray(v) ? chrRangePosUrlEncoder(v) : v
  );
