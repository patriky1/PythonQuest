import { Platform } from 'react-native';

export const TAB_BAR_BASE_HEIGHT = 62;

export function getBottomSafeArea(bottomInset: number) {
  return Platform.OS === 'android'
    ? Math.max(bottomInset, 32)
    : Math.max(bottomInset, 6);
}

export function getTabBarHeight(bottomInset: number) {
  return TAB_BAR_BASE_HEIGHT + getBottomSafeArea(bottomInset);
}

export function getScreenBottomPadding(bottomInset: number) {
  return getTabBarHeight(bottomInset) + 20;
}