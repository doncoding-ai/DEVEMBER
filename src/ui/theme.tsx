// The four looks of Dos Live (liquid, terminal, presence, bubble), each in dark
// and light, carried over to the phone. Colours and fonts are taken from
// dos-live's island.css so both apps feel like the same Dos.

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { WorldState } from '@/dos/core';

export type Look = 'liquid' | 'terminal' | 'presence' | 'bubble';
export type ThemePref = 'dark' | 'light' | 'system';
export type Scheme = 'dark' | 'light';

export const LOOKS: { id: Look; name: string; blurb: string }[] = [
  { id: 'liquid', name: 'Liquid notch', blurb: "One shape with Dos's eyes inside it." },
  { id: 'terminal', name: 'Terminal', blurb: 'The dos:~$ bar. Everything prints like a shell.' },
  { id: 'presence', name: 'Presence orb', blurb: 'Dos is a glowing orb ringed by your worlds.' },
  { id: 'bubble', name: 'Bubble', blurb: 'The orb floats over everything. Throw it around.' },
];

export interface Tokens {
  look: Look;
  scheme: Scheme;
  bg: string;
  /** Cards and rows. */
  panel: string;
  /** Pressed rows, chips. */
  panel2: string;
  line: string;
  text: string;
  dim: string;
  faint: string;
  green: string;
  amber: string;
  blue: string;
  red: string;
  parked: string;
  /** The main button: Do it, Save, Drop note. */
  goBg: string;
  goInk: string;
  goLine: string;
  /** Do it on a question (presence turns it amber, like the desktop). */
  askGoBg: string;
  askGoInk: string;
  faceBg: string;
  faceRing: string;
  eye: string;
  radius: number;
  btnRadius: number;
  font: { ui: string; uiMedium: string; uiBold: string; mono: string; monoBold: string };
  /** Section titles: spaced capitals, or a shell comment. */
  sectionStyle: 'caps' | 'comment';
  shadow: string;
}

const GEIST = { ui: 'Geist_400Regular', uiMedium: 'Geist_600SemiBold', uiBold: 'Geist_700Bold', mono: 'GeistMono_400Regular', monoBold: 'GeistMono_600SemiBold' };
const PLEX = { ui: 'IBMPlexSans_400Regular', uiMedium: 'IBMPlexSans_600SemiBold', uiBold: 'IBMPlexSans_700Bold', mono: 'JetBrainsMono_400Regular', monoBold: 'JetBrainsMono_600SemiBold' };
const MANROPE = { ui: 'Manrope_500Medium', uiMedium: 'Manrope_700Bold', uiBold: 'Manrope_800ExtraBold', mono: 'GeistMono_400Regular', monoBold: 'GeistMono_600SemiBold' };

// island.css :root and :root.theme-light
const BASE_DARK = {
  bg: '#000000', panel: '#0a0f14', panel2: '#1c2631', line: '#1d2833',
  text: '#eef3f8', dim: '#a7b5c2', faint: '#6b7a87',
  green: '#3ddc84', amber: '#ffb547', blue: '#4aa8ff', red: '#ff6b5d', parked: '#6e8193',
  goBg: '#3ddc84', goInk: '#04140b', goLine: '#3ddc84', askGoBg: '#3ddc84', askGoInk: '#04140b',
  faceBg: '#0c1712', faceRing: 'rgba(61,220,132,0.18)', eye: '#3ddc84', shadow: 'rgba(0,0,0,0.5)',
};
const BASE_LIGHT = {
  bg: '#ffffff', panel: '#f2f5f8', panel2: '#eaeff4', line: '#d9e0e7',
  text: '#0e1620', dim: '#4a5866', faint: '#6f7d8a',
  green: '#0f7a45', amber: '#9a5800', blue: '#1d64c4', red: '#c4372a', parked: '#8a97a4',
  goBg: '#24c06e', goInk: '#03200f', goLine: '#24c06e', askGoBg: '#24c06e', askGoInk: '#03200f',
  faceBg: '#e6f7ee', faceRing: 'rgba(22,163,90,0.25)', eye: '#16a35a', shadow: 'rgba(20,35,55,0.16)',
};

function tokens(look: Look, scheme: Scheme): Tokens {
  const dark = scheme === 'dark';
  const base = dark ? BASE_DARK : BASE_LIGHT;
  switch (look) {
    case 'terminal':
      // island.css .skin-terminal: black or warm paper, keyboard-key buttons.
      return {
        ...base,
        ...(dark
          ? { panel: '#0c131a', panel2: '#111b24', line: '#172230', goBg: '#0d2617', goInk: '#c6f6da', goLine: '#2c8a55' }
          : { bg: '#fbfaf6', panel: '#ffffff', panel2: '#f7f4ee', line: '#ddd6c8', text: '#14181d', dim: '#39424c', faint: '#66707b', green: '#0b7a43', goBg: '#e6f5ec', goInk: '#0b4f2c', goLine: '#3aa36a' }),
        askGoBg: dark ? '#0d2617' : '#e6f5ec',
        askGoInk: dark ? '#c6f6da' : '#0b4f2c',
        look, scheme, radius: 8, btnRadius: 6, font: PLEX, sectionStyle: 'comment',
      };
    case 'presence':
      // island.css .skin-presence: soft surfaces, round pills, amber "do it" on questions.
      return {
        ...base,
        ...(dark ? { bg: '#090d12', panel: '#0f161d', panel2: '#18222d', line: '#1e2935' } : { bg: '#ffffff', panel: '#f2f5f8', panel2: '#eaeff4', line: '#dde4eb' }),
        askGoBg: '#ffb547', askGoInk: dark ? '#1d1000' : '#2a1700',
        look, scheme, radius: 22, btnRadius: 999, font: MANROPE, sectionStyle: 'caps',
      };
    case 'bubble':
      return { ...base, look, scheme, radius: 20, btnRadius: 999, font: GEIST, sectionStyle: 'caps' };
    case 'liquid':
    default:
      return { ...base, look: 'liquid', scheme, radius: 18, btnRadius: 14, font: GEIST, sectionStyle: 'caps' };
  }
}

export function stateColor(t: Tokens, s: WorldState): string {
  return { alert: t.red, attention: t.amber, active: t.green, quiet: t.parked, empty: t.faint }[s];
}

export const STATE_WORD: Record<WorldState, string> = {
  alert: 'overdue',
  attention: 'needs a look',
  active: 'moving',
  quiet: 'parked',
  empty: 'clear',
};

const Ctx = createContext<Tokens>(tokens('liquid', 'dark'));

export function ThemeProvider({ look, pref, children }: { look: Look; pref: ThemePref; children: ReactNode }) {
  const system = useColorScheme();
  const scheme: Scheme = pref === 'system' ? (system === 'light' ? 'light' : 'dark') : pref;
  const t = useMemo(() => tokens(look, scheme), [look, scheme]);
  return <Ctx.Provider value={t}>{children}</Ctx.Provider>;
}

/** Renders its children in another look (the previews in Settings). */
export function PreviewTheme({ look, scheme, children }: { look: Look; scheme: Scheme; children: ReactNode }) {
  const t = useMemo(() => tokens(look, scheme), [look, scheme]);
  return <Ctx.Provider value={t}>{children}</Ctx.Provider>;
}

export function useTheme(): Tokens {
  return useContext(Ctx);
}

/** Tokens for a look other than the current one (the Settings previews). */
export { tokens as tokensFor };

/** Build a style sheet from the current tokens, once per theme change. */
export function useStyles<T>(make: (t: Tokens) => T): T {
  const t = useTheme();
  return useMemo(() => make(t), [t, make]);
}
