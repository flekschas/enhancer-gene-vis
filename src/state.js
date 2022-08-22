import { atom, selector } from 'recoil';
import { memoize } from 'lodash-es';
import { identity } from '@flekschas/utils';
import {
  focusGeneState,
  focusRegionState,
  focusGeneStartWithAssembly,
  focusGeneEndWithAssembly,
  focusRegionAbsWithAssembly,
} from './state/focus-state';

import {
  getQueryStringValue,
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from './utils/query-string';

import {
  chrPosUrlDecoder,
  chrPosUrlEncoder,
  chrRangePosUrlEncoder,
} from './utils';
import { toAbsPosition } from './utils/chrom-utils';

import {
  DEFAULT_X_DOMAIN_START,
  DEFAULT_X_DOMAIN_END,
} from './view-config-typed';

import { getDnaAccessXDomain } from './view-config';

const getDefault = (key, initialValue, decoder) => {
  const qVal = getQueryStringValue(key, decoder);
  return qVal === undefined ? initialValue : qVal;
};

// Atoms

export const variantYScaleState = atom({
  key: 'variantYScale',
  default: getDefault('vy', 'pValue', identity),
});

export const higlassEnhancerRegionsState = atom({
  key: 'higlassEnhancerRegions',
  default: null,
});

export const higlassDnaAccessState = atom({
  key: 'higlassDnaAccess',
  default: null,
});

// Dynamic state
export const xDomainStartWithAssembly = memoize(
  (chromInfo) =>
    atom({
      key: `xDomainStart-${chromInfo.totalLength}`,
      default: getDefault(
        'xs',
        chromInfo.absToChr(DEFAULT_X_DOMAIN_START).slice(0, 2).join(':'),
        chrPosUrlDecoder
      ),
    }),
  (chromInfo) => chromInfo.totalLength
);

export const xDomainEndWithAssembly = memoize(
  (chromInfo) =>
    atom({
      key: `xDomainEnd-${chromInfo.totalLength}`,
      default: getDefault(
        'xe',
        chromInfo.absToChr(DEFAULT_X_DOMAIN_END).slice(0, 2).join(':'),
        chrPosUrlDecoder
      ),
    }),
  (chromInfo) => chromInfo.totalLength
);

// Derived state
export const xDomainStartAbsWithAssembly = memoize(
  (chromInfo) =>
    selector({
      key: `xDomainStartAbs-${chromInfo.totalLength}`,
      get: ({ get }) => {
        const xDomainStart = get(xDomainStartWithAssembly(chromInfo));
        return toAbsPosition(xDomainStart, chromInfo);
      },
    }),
  (chromInfo) => chromInfo.totalLength
);

export const xDomainEndAbsWithAssembly = memoize(
  (chromInfo) =>
    selector({
      key: `xDomainEndAbs-${chromInfo.totalLength}`,
      get: ({ get }) => {
        const xDomainEnd = get(xDomainEndWithAssembly(chromInfo));
        return toAbsPosition(xDomainEnd, chromInfo);
      },
    }),
  (chromInfo) => chromInfo.totalLength
);

export const dnaAccessXDomainWithAssembly = memoize(
  (chromInfo) =>
    selector({
      key: 'dnaAccessXDomain',
      get: ({ get }) => {
        const focusRegionAbs = get(focusRegionAbsWithAssembly(chromInfo));
        const focusGeneStart = get(focusGeneStartWithAssembly(chromInfo));
        const focusGeneEnd = get(focusGeneEndWithAssembly(chromInfo));
        const xDomainStartAbs = get(xDomainStartAbsWithAssembly(chromInfo));
        const xDomainEndAbs = get(xDomainEndAbsWithAssembly(chromInfo));

        return getDnaAccessXDomain(
          focusRegionAbs,
          focusGeneStart,
          focusGeneEnd,
          xDomainStartAbs,
          xDomainEndAbs
        );
      },
    }),
  (chromInfo) => chromInfo.totalLength
);

/*
 Predefined Hooks
 */

export const useFocusGene = () => useRecoilQueryString('g', focusGeneState);
export const useFocusGeneSyncher = () =>
  useRecoilQueryStringSyncher('g', focusGeneState);

export const useFocusRegion = (chromInfo) =>
  useRecoilQueryString('f', focusRegionState, (v) =>
    Array.isArray(v) ? chrRangePosUrlEncoder(v) : v
  );
export const useFocusRegionSyncher = (chromInfo) =>
  useRecoilQueryStringSyncher('f', focusRegionState, (v) =>
    Array.isArray(v) ? chrRangePosUrlEncoder(v) : v
  );

export const useXDomainStartWithAssembly = (chromInfo) =>
  useRecoilQueryString(
    's',
    xDomainStartWithAssembly(chromInfo),
    chrPosUrlEncoder
  );
export const useXDomainStartWithAssemblySyncher = (chromInfo) =>
  useRecoilQueryStringSyncher(
    's',
    xDomainStartWithAssembly(chromInfo),
    chrPosUrlEncoder
  );

export const useXDomainEndWithAssembly = (chromInfo) =>
  useRecoilQueryString(
    'e',
    xDomainEndWithAssembly(chromInfo),
    chrPosUrlEncoder
  );
export const useXDomainEndWithAssemblySyncher = (chromInfo) =>
  useRecoilQueryStringSyncher(
    'e',
    xDomainEndWithAssembly(chromInfo),
    chrPosUrlEncoder
  );

export const useVariantYScale = () =>
  useRecoilQueryString('vs', variantYScaleState);
export const useVariantYScaleSyncher = () =>
  useRecoilQueryStringSyncher('vs', variantYScaleState);
