/**
 * @fileoverview
 * File for state variables that are relevant to the app's global UI state.
 * Examples include:
 *  - Loading state
 *  - Whether settings modals are open
 *  - Whether to show welcome modal
 */

import { atom, RecoilState } from 'recoil';
import {
  useRecoilQueryString,
  useRecoilQueryStringSyncher,
} from '../utils/query-string';
import { getDefault } from './utils';

export const showVariantsSettingsState: RecoilState<boolean> = atom<boolean>({
  key: 'showVariantsSettings',
  default: false,
});

export const showEnhancerRegionsSettingsState: RecoilState<boolean> = atom<
  boolean
>({
  key: 'showEnhancerRegionsSettings',
  default: false,
});

export const enum WelcomeIntroState {
  NO_SHOW = 0,
  SHOW_OVERVIEW = 1,
  SHOW_DETAILED = 2,
}

export const showWelcomeState: RecoilState<WelcomeIntroState> = atom({
  key: 'showWelcome',
  default: getDefault(
    'w',
    WelcomeIntroState.SHOW_OVERVIEW,
    (x) => parseInt(x, 10) as WelcomeIntroState
  ),
});

export const useShowWelcome = () =>
  useRecoilQueryString('w', showWelcomeState, (x) => x.toString());
export const useShowWelcomeSyncher = () =>
  useRecoilQueryStringSyncher('w', showWelcomeState, (x) => x.toString());
