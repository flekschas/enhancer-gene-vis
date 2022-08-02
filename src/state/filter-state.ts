import { memoize } from "lodash-es";
import { atom, RecoilState, selector } from "recoil";
import { samples, stratificationState } from "./stratification-state";

type SampleState = {
  checked: boolean,
  visible: boolean,
}

export const sampleFilterState: RecoilState<string> = atom({
  key: 'sampleFilterState',
  default: '',
});

export const sampleWithName = memoize((name: string) =>
  atom({
    key: `sample-${name}`,
    default: {
      checked: true,
      visible: true,
    } as SampleState,
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