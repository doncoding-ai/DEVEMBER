// App state: the Trello credentials, the latest snapshot, and the two things you
// can do from the phone (answer an ask, drop a note). Polls every minute while
// the app is open, like the desktop bar.

import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { answeredTitle, buildSnapshot, MARKER, nowEat, type Ask, type Board, type BoardHealth, type BoardKey, type Decision, type Snapshot } from './core';
import * as trello from './trello';

export interface Config {
  key: string;
  token: string;
  boards: Record<BoardKey, string>;
  /** Work world shows counts only, never titles (on by default, as on the desktop). */
  discreetWork: boolean;
}

const DEFAULT_CONFIG: Config = {
  key: '',
  token: '',
  boards: { dos: 'vKKgCDGD', don: '5jR6zssk', boom: 'vbw8udrd' },
  discreetWork: true,
};

const STORE_KEY = 'dos-pocket-config';
// SecureStore is native only. On web the config lives in memory for the session.
const secure = Platform.OS !== 'web';

async function loadConfig(): Promise<Config> {
  if (!secure) return DEFAULT_CONFIG;
  try {
    const raw = await SecureStore.getItemAsync(STORE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const saved = JSON.parse(raw) as Partial<Config>;
    return { ...DEFAULT_CONFIG, ...saved, boards: { ...DEFAULT_CONFIG.boards, ...saved.boards } };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function saveConfig(c: Config): Promise<void> {
  if (secure) await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(c));
}

interface DosState {
  ready: boolean;
  config: Config;
  configured: boolean;
  persistent: boolean;
  snapshot: Snapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setConfig: (c: Config) => Promise<void>;
  answer: (ask: Ask, d: Decision) => Promise<void>;
  addNote: (text: string) => Promise<void>;
}

const Ctx = createContext<DosState | null>(null);

export function DosProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [config, setConfigState] = useState<Config>(DEFAULT_CONFIG);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cfgRef = useRef(config);
  cfgRef.current = config;

  const configured = config.key.trim() !== '' && config.token.trim() !== '';

  const refresh = useCallback(async () => {
    const c = cfgRef.current;
    if (!c.key.trim() || !c.token.trim()) return;
    setLoading(true);
    const entries = Object.entries(c.boards).filter(([, v]) => v.trim()) as [BoardKey, string][];
    const results = await Promise.allSettled(entries.map(([, link]) => trello.board(c, link)));
    const ok: [string, Board][] = [];
    const health: BoardHealth[] = [];
    results.forEach((r, i) => {
      const key = entries[i][0];
      if (r.status === 'fulfilled') {
        ok.push([key, r.value]);
        health.push({ key, ok: true });
      } else {
        health.push({ key, ok: false, error: (r.reason as Error).message });
      }
    });
    if (ok.length) setSnapshot(buildSnapshot(ok, health, new Date()));
    const failed = health.filter((h) => !h.ok);
    setError(failed.length ? `${failed.map((h) => h.key).join(', ')}: ${failed[0].error}` : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConfig().then((c) => {
      setConfigState(c);
      cfgRef.current = c;
      setReady(true);
      refresh();
    });
  }, [refresh]);

  // Every minute while the app is in front; right away when it comes back.
  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, 60_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  const setConfig = useCallback(async (c: Config) => {
    setConfigState(c);
    cfgRef.current = c;
    await saveConfig(c);
    setSnapshot(null);
    await refresh();
  }, [refresh]);

  const answer = useCallback(async (ask: Ask, d: Decision) => {
    const answered = snapshot?.answeredListId ?? null;
    const comment = `Answered from Dos Pocket: ${MARKER[d]} · ${nowEat()}`;
    await trello.answerCard(cfgRef.current, ask.id, answeredTitle(ask.question, d), comment, answered);
    setSnapshot((s) => (s ? { ...s, asks: s.asks.filter((a) => a.id !== ask.id) } : s));
  }, [snapshot]);

  const addNote = useCallback(async (text: string) => {
    const list = snapshot?.notesListId;
    if (!list) throw new Error('No "To do" list on the Dos board yet.');
    const name = [...`📝 ${text.trim()}`].slice(0, 200).join('');
    await trello.createCard(cfgRef.current, list, name, `Note from Dos Pocket · ${nowEat()}`);
  }, [snapshot]);

  const value = useMemo<DosState>(
    () => ({ ready, config, configured, persistent: secure, snapshot, loading, error, refresh, setConfig, answer, addNote }),
    [ready, config, configured, snapshot, loading, error, refresh, setConfig, answer, addNote],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDos(): DosState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDos outside DosProvider');
  return v;
}
