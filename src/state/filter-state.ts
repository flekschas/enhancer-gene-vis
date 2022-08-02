import { memoize } from 'lodash-es';
import { atom, RecoilState, selector } from 'recoil';
import { samples, stratificationState } from './stratification-state';

/**
 * Properties to help
 */
export type SampleFilterState = {
  checked: boolean;
  visible: boolean;
};

export const sampleFilterState: RecoilState<string> = atom({
  key: 'sampleFilterState',
  default: '',
});

/**
 * Dynamic state accessor.
 */
export const sampleWithName = memoize((name: string) =>
  atom({
    key: `sample-${name}`,
    default: {
      checked: true,
      visible: true,
    } as SampleFilterState,
  })
);

export const sampleSelectionState = selector({
  key: 'sampleSelection',
  get: ({ get }) =>
    samples(get(stratificationState)).map(
      (name) => get(sampleWithName(name)).checked
    ),
});

export const selectedSamplesState = selector({
  key: 'selectedSamples',
  get: ({ get }) =>
    samples(get(stratificationState)).filter(
      (name) => get(sampleWithName(name)).checked
    ),
});
