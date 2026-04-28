/**
 * RTL layout helpers — consistent across native and web.
 *
 * Problem: React Native + I18nManager.forceRTL(true) reverses the meaning of
 * flex directions at the engine level.  With forceRTL active:
 *   - `row`         → flows RIGHT-to-LEFT  ✓ (correct for Hebrew)
 *   - `row-reverse` → flows LEFT-to-RIGHT  ✗ (double-inverted)
 *
 * On web (I18nManager.isRTL === false, dir="rtl" via +html.tsx):
 *   - `row`         → flows LEFT-to-RIGHT  ✗
 *   - `row-reverse` → flows RIGHT-to-LEFT  ✓
 *
 * Usage in StyleSheet.create():
 *   flexDirection: RTL_ROW          // always flows visually right-to-left
 *   alignSelf:     RTL_FLEX_START   // visually right (start of RTL line)
 *   alignSelf:     RTL_FLEX_END     // visually left  (end of RTL line)
 */

import { I18nManager } from 'react-native';

/** Row that always flows visually right-to-left (RTL semantic row). */
export const RTL_ROW: 'row' | 'row-reverse' = I18nManager.isRTL ? 'row' : 'row-reverse';

/**
 * Cross-axis alignment that corresponds to the visual RIGHT / RTL start.
 * Use this where you previously wrote `alignSelf: 'flex-end'` for right-aligning
 * an item inside a column flex container.
 */
export const RTL_ALIGN_START: 'flex-start' | 'flex-end' = I18nManager.isRTL ? 'flex-start' : 'flex-end';

/**
 * Cross-axis alignment that corresponds to the visual LEFT / RTL end.
 * Use this where you previously wrote `alignSelf: 'flex-start'` for left-aligning.
 */
export const RTL_ALIGN_END: 'flex-start' | 'flex-end' = I18nManager.isRTL ? 'flex-end' : 'flex-start';
