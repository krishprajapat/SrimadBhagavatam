// Spacing system based on 8px base unit
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

// Responsive spacing using the responsive utilities
import {rS, rV} from '../Components/responsive';

export const Space = {
  xs: rS(4),
  sm: rS(8),
  md: rS(16),
  lg: rS(24),
  xl: rS(32),
  xxl: rS(40),
  xxxl: rS(48),
  vertical: {
    xs: rV(4),
    sm: rV(8),
    md: rV(16),
    lg: rV(24),
    xl: rV(32),
    xxl: rV(40),
    xxxl: rV(48),
  },
};
