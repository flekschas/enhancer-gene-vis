import { atom, selector } from 'recoil';
import { memoize } from 'lodash-es';
import { deepClone, identity } from '@flekschas/utils';

import {
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from './use-query-string';

import {
  booleanQueryStringDecoder,
  customBooleanQueryStringDecoder,
  getQueryStringValue,
  toAbsPosition,
  isChrRange,
  chrPosUrlDecoder,
  chrPosUrlEncoder,
  chrRangePosUrlDecoder,
  chrRangePosUrlEncoder,
  chrRangePosEncoder,
} from './utils';

import {
  DEFAULT_X_DOMAIN_START,
  DEFAULT_X_DOMAIN_END,
  DEFAULT_VARIANT_TRACKS,
  DEFAULT_VARIANT_TRACK_SERVER_ABBR,
  DEFAULT_VARIANT_TRACK_PVAL_COL,
  DEFAULT_VARIANT_TRACK_PPROB_COL,
  VARIANT_TRACK_ABBR_TO_SERVER,
  VARIANT_TRACK_SERVER_TO_ABBR,
  GROUPED_SAMPLE_OPTIONS,
  SAMPLES,
} from './constants';

import { getDnaAccessXDomain } from './view-config';

const getDefault = (key, initialValue, decoder) => {
  const qVal = getQueryStringValue(key, decoder);
  return qVal === undefined ? initialValue : qVal;
};

const showWelcomeDecoder = customBooleanQueryStringDecoder(['intro']);

const variantTracksDecoder = (v) => {
  if (!v) return undefined;

  // tilesetId:rg:7:8
  const [
    tilesetUid,
    serverAbbr = DEFAULT_VARIANT_TRACK_SERVER_ABBR,
    columnPvalue = DEFAULT_VARIANT_TRACK_PVAL_COL,
    columnPosteriorProbability = DEFAULT_VARIANT_TRACK_PPROB_COL,
  ] = v.split(':');

  const server = VARIANT_TRACK_ABBR_TO_SERVER[serverAbbr];

  if (tilesetUid === undefined) return tilesetUid;

  return [
    {
      server,
      tilesetUid,
      columnPvalue,
      columnPosteriorProbability,
      markColor: 'black',
    },
  ];
};

const variantTracksEncoder = (v) => {
  if (!v || !Array.isArray(v) || v.length > 1) return '';

  const { tilesetUid } = v[0];
  const serverAbbr =
    VARIANT_TRACK_SERVER_TO_ABBR[v[0].server] ===
    DEFAULT_VARIANT_TRACK_SERVER_ABBR
      ? null
      : VARIANT_TRACK_SERVER_TO_ABBR[v[0].server];
  const pValCol =
    v[0].columnPvalue === DEFAULT_VARIANT_TRACK_PVAL_COL
      ? null
      : v[0].columnPvalue;
  const pProbCol =
    v[0].columnPosteriorProbability === DEFAULT_VARIANT_TRACK_PPROB_COL
      ? null
      : v[0].columnPosteriorProbability;

  if (!tilesetUid || serverAbbr === undefined) return '';

  return [tilesetUid, serverAbbr, pValCol, pProbCol].filter(identity).join(':');
};

// Atoms
export const sampleFilterState = atom({
  key: 'sampleFilterState',
  default: '',
});

export const sampleSelectionState = selector({
  key: 'sampleSelection',
  get: ({ get }) => SAMPLES.map((name) => get(sampleWithName(name)).checked),
});

export const selectedSamplesState = selector({
  key: 'selectedSamples',
  get: ({ get }) => SAMPLES.filter((name) => get(sampleWithName(name)).checked),
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
  default: getDefault(
    'vt',
    deepClone(DEFAULT_VARIANT_TRACKS),
    variantTracksDecoder
  ),
});

export const showVariantsSettingsState = atom({
  key: 'showVariantsSettings',
  default: false,
});

export const showWelcomeState = atom({
  key: 'showWelcome',
  default: getDefault('w', true, showWelcomeDecoder),
});

export const dnaAccessLabelStyleState = atom({
  key: 'dnaAccessLabelStyle',
  default: getDefault('dal', 'indicator'),
});

export const dnaAccessRowNormState = atom({
  key: 'dnaAccessRowNorm',
  default: getDefault('darn', true, booleanQueryStringDecoder),
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

export const focusRegionState = atom({
  key: `focusRegion`,
  default: getDefault('f', 'rs1250566', (v) =>
    v && isChrRange(v) ? chrRangePosUrlDecoder(v) : v
  ),
});

export const focusRegionOptionState = atom({
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

export const focusRegionAbsWithAssembly = memoize(
  (chromInfo) =>
    selector({
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
export const useVariantTracks = () =>
  useRecoilQueryString('vt', variantTracksState, variantTracksEncoder);
export const useVariantTracksSyncher = () =>
  useRecoilQueryStringSyncher('vt', variantTracksState, variantTracksEncoder);

export const useShowWelcome = () => useRecoilQueryString('w', showWelcomeState);
export const useShowWelcomeSyncher = () =>
  useRecoilQueryStringSyncher('w', showWelcomeState);

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

export const useDnaAccessLabelStyle = () =>
  useRecoilQueryString('dal', dnaAccessLabelStyleState);
export const useDnaAccessLabelStyleSyncher = () =>
  useRecoilQueryStringSyncher('dal', dnaAccessLabelStyleState);

export const useDnaAccessRowNorm = () =>
  useRecoilQueryString('darn', dnaAccessRowNormState);
export const useDnaAccessRowNormSyncher = () =>
  useRecoilQueryStringSyncher('darn', dnaAccessRowNormState);

export const useDnaAccessShowInfos = () =>
  useRecoilQueryString('dai', dnaAccessLabelShowInfoState);
export const useDnaAccessShowInfosSyncher = () =>
  useRecoilQueryStringSyncher('dai', dnaAccessLabelShowInfoState);

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

export const useEnhancerRegionsShowInfos = () =>
  useRecoilQueryString('eri', enhancerRegionsShowInfoState);
export const useEnhancerRegionsShowInfosSyncher = () =>
  useRecoilQueryStringSyncher('eri', enhancerRegionsShowInfoState);

export const useEnhancerRegionsHideUnfocused = () =>
  useRecoilQueryString('eri', enhancerRegionsHideUnfocusedState);
export const useEnhancerRegionsHideUnfocusedSyncher = () =>
  useRecoilQueryStringSyncher('eri', enhancerRegionsHideUnfocusedState);

export const useEnhancerRegionsColorEncoding = () =>
  useRecoilQueryString('eri', enhancerRegionsColorEncodingState);
export const useEnhancerRegionsColorEncodingSyncher = () =>
  useRecoilQueryStringSyncher('eri', enhancerRegionsColorEncodingState);

export const useEnhancerGenesShowInfos = () =>
  useRecoilQueryString('egi', enhancerGenesShowInfoState);
export const useEnhancerGenesShowInfosSyncher = () =>
  useRecoilQueryStringSyncher('egi', enhancerGenesShowInfoState);

export const useEnhancerGenesPadding = () =>
  useRecoilQueryString('egp', enhancerGenesPaddingState);
export const useEnhancerGenesPaddingSyncher = () =>
  useRecoilQueryStringSyncher('egp', enhancerGenesPaddingState);

export const useEnhancerGenesCellEncoding = () =>
  useRecoilQueryString('egce', enhancerGenesCellEncodingState);
export const useEnhancerGenesCellEncodingSyncher = () =>
  useRecoilQueryStringSyncher('egce', enhancerGenesCellEncodingState);

export const useVariantYScale = () =>
  useRecoilQueryString('vs', variantYScaleState);
export const useVariantYScaleSyncher = () =>
  useRecoilQueryStringSyncher('vs', variantYScaleState);
