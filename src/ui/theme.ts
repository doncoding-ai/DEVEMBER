import { Platform } from 'react-native';

import type { WorldState } from '@/dos/core';

// Dos Live's terminal look, carried over to the phone.
export const C = {
  bg: '#0b0d10',
  panel: '#14171c',
  panel2: '#1b1f26',
  line: '#262b33',
  text: '#e8ecf1',
  dim: '#8a93a0',
  faint: '#5a626e',
  green: '#3ddc84',
  amber: '#ffb020',
  red: '#ff5c5c',
  blue: '#4aa8ff',
};

export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' });

export const STATE_COLOR: Record<WorldState, string> = {
  alert: C.red,
  attention: C.amber,
  active: C.green,
  quiet: C.dim,
  empty: C.faint,
};

export const STATE_WORD: Record<WorldState, string> = {
  alert: 'overdue',
  attention: 'needs a look',
  active: 'moving',
  quiet: 'parked',
  empty: 'clear',
};
