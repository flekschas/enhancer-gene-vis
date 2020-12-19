import { atom, selector } from 'recoil';
import { memoize } from 'lodash-es';
import { deepClone } from '@flekschas/utils';

import { useRecoilQueryString } from './use-query-string';

import {
  booleanQueryStringDecoder,
  getQueryStringValue,
  toAbsPosition,
} from './utils';

import {
  DEFAULT_X_DOMAIN_START,
  DEFAULT_X_DOMAIN_END,
  DEFAULT_VARIANT_TRACKS,
  GROUPED_SAMPLE_OPTIONS,
  SAMPLES,
} from './constants';

const getDefault = (key, initialValue, decoder) =>
  getQueryStringValue(key, decoder) === undefined
    ? initialValue
    : getQueryStringValue(key, decoder);

const chrPosUrlEncoder = (chrPos) =>
  chrPos ? chrPos.replace(':', '.') : chrPos;

const chrPosUrlDecoder = (chrPos) =>
  chrPos ? chrPos.replace('.', ':') : chrPos;

// Atoms
export const sampleFilterState = atom({
  key: 'sampleFilterState',
  default: '',
});

export const sampleSelectionState = selector({
  key: 'sampleSelection',
  get: ({ get }) => SAMPLES.map((name) => get(sampleWithName(name)).checked),
});

export const sampleWithName = memoize((name) =>
  atom({
    key: `sample-${name}`,
    default: {
      checked: true,
      visible: true,
    },
  })
);

export const sampleGroupWithGroup = memoize(
  (group) =>
    atom({
      key: `sampleGroup-${group.name}`,
      default: {
        checked: true,
        visible: true,
        n: group.options.length,
        N: group.options.length,
      },
    }),
  (group) => group.name
);

export const sampleGroupSelectionSizesState = selector({
  key: 'sampleGroupSelectionSizes',
  get: ({ get }) =>
    GROUPED_SAMPLE_OPTIONS.reduce((sizes, group) => {
      sizes[group.name] = get(sampleGroupWithGroup(group)).n;
      return sizes;
    }, {}),
});

export const variantTracksState = atom({
  key: 'variantTracks',
  default: deepClone(DEFAULT_VARIANT_TRACKS),
});

export const showVariantsSettingsState = atom({
  key: 'showVariantsSettings',
  default: false,
});

export const showWelcomeState = atom({
  key: 'showWelcome',
  default: getDefault('w', true, booleanQueryStringDecoder),
});

export const dnaAccessLabelStyleState = atom({
  key: 'dnaAccessLabelStyle',
  default: getDefault('dal', 'indicator'),
});

export const dnaAccessLabelShowInfoState = atom({
  key: 'dnaAccessLabelShowInfos',
  default: getDefault('dai', true, booleanQueryStringDecoder),
});

export const focusGeneState = atom({
  key: 'focusGene',
  default: getDefault('g', ''),
});

export const focusGeneOptionState = atom({
  key: 'focusGeneOption',
  default: null,
});

export const focusVariantState = atom({
  key: 'focusVariant',
  default: getDefault('v', 'rs1250566'),
});

export const focusVariantOptionState = atom({
  key: 'focusVariantOption',
  default: null,
});

export const focusRegionOptionState = atom({
  key: 'focusRegionOption',
  default: null,
});

export const variantYScaleState = atom({
  key: 'variantYScale',
  default: getDefault('vy', 'pValue'),
});

export const enhancerRegionsHideUnfocusedState = atom({
  key: 'enhancerRegionsHideUnfocused',
  default: getDefault('erhu', false, booleanQueryStringDecoder),
});

export const enhancerRegionsColorEncodingState = atom({
  key: 'enhancerRegionsColorEncoding',
  default: getDefault('erc', 'solid'),
});

export const enhancerRegionsShowInfoState = atom({
  key: 'enhancerRegionsShowInfos',
  default: getDefault('eri', true, booleanQueryStringDecoder),
});

export const enhancerGenesShowInfoState = atom({
  key: 'enhancerGenesShowInfos',
  default: getDefault('egi', true, booleanQueryStringDecoder),
});

export const enhancerGenesPaddingState = atom({
  key: 'enhancerGenesPadding',
  default: getDefault('egp', false, booleanQueryStringDecoder),
});

export const enhancerGenesCellEncodingState = atom({
  key: 'enhancerGenesCellEncoding',
  default: getDefault('egce', 'number'),
});

export const enhancerGenesSvgState = atom({
  key: 'enhancerGenesSvg',
  default: null,
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

export const focusVariantPositionWithAssembly = memoize((chromInfo) =>
  selector({
    key: `focusVariantPosition-${chromInfo.totalLength}`,
    get: ({ get }) => {
      const focusVariantOption = get(focusVariantOptionState);
      return focusVariantOption
        ? toAbsPosition(
            `${focusVariantOption.chr}:${focusVariantOption.txStart}`,
            chromInfo
          )
        : null;
    },
  })
);

export const focusVariantRelPositionState = selector({
  key: 'focusVariantRelPosition',
  get: ({ get }) => {
    const focusVariantOption = get(focusVariantOptionState);
    return focusVariantOption ? +focusVariantOption.txStart : null;
  },
});

export const focusVariantStrPositionState = selector({
  key: 'focusVariantStrPosition',
  get: ({ get }) => {
    const focusVariantOption = get(focusVariantOptionState);
    return focusVariantOption
      ? `${focusVariantOption.chr}:${focusVariantOption.txStart}`
      : null;
  },
});

// Predefined hooks
export const useShowWelcome = () =>
  useRecoilQueryString('w', showWelcomeState, {
    decoder: booleanQueryStringDecoder,
  });

export const useFocusGene = () => useRecoilQueryString('g', focusGeneState);

export const useFocusVariant = () =>
  useRecoilQueryString('v', focusVariantState);

export const useDnaAccessLabelStyle = () =>
  useRecoilQueryString('dal', dnaAccessLabelStyleState);

export const useDnaAccessShowInfos = () =>
  useRecoilQueryString('dai', dnaAccessLabelShowInfoState, {
    decoder: booleanQueryStringDecoder,
  });

export const useXDomainStartWithAssembly = (chromInfo) =>
  useRecoilQueryString('s', xDomainStartWithAssembly(chromInfo), {
    encoder: chrPosUrlEncoder,
  });

export const useXDomainEndWithAssembly = (chromInfo) =>
  useRecoilQueryString('e', xDomainEndWithAssembly(chromInfo), {
    encoder: chrPosUrlEncoder,
  });

export const useEnhancerRegionsShowInfos = () =>
  useRecoilQueryString('eri', enhancerRegionsShowInfoState, {
    decoder: booleanQueryStringDecoder,
  });

export const useEnhancerRegionsHideUnfocused = () =>
  useRecoilQueryString('eri', enhancerRegionsHideUnfocusedState, {
    decoder: booleanQueryStringDecoder,
  });

export const useEnhancerRegionsColorEncoding = () =>
  useRecoilQueryString('eri', enhancerRegionsColorEncodingState);

export const useEnhancerGenesShowInfos = () =>
  useRecoilQueryString('egi', enhancerGenesShowInfoState, {
    decoder: booleanQueryStringDecoder,
  });

export const useEnhancerGenesPadding = () =>
  useRecoilQueryString('egp', enhancerGenesPaddingState, {
    decoder: booleanQueryStringDecoder,
  });

export const useEnhancerGenesCellEncoding = () =>
  useRecoilQueryString('egce', enhancerGenesCellEncodingState);

export const useVariantYScale = () =>
  useRecoilQueryString('vs', variantYScaleState);
