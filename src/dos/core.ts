// The Dos brain, ported from dos-live's `dos-core` crate so the phone reads the
// boards exactly the way the desktop bar does: same worlds, same flags, same
// pings and asks, same answer markers. Pure TypeScript, no React, no network —
// everything here is unit-tested in core.test.ts.

// ---------- Trello shapes (the slice Dos reads) ----------

export const BOARD_QUERY =
  'fields=name,url' +
  '&lists=open&list_fields=name,pos' +
  '&cards=open&card_fields=name,desc,idList,idLabels,dateLastActivity,due,dueComplete,shortUrl' +
  '&labels=all&label_fields=name,color';

export interface Label {
  id: string;
  name: string;
  color?: string | null;
}

export interface List {
  id: string;
  name: string;
  pos?: number;
}

export interface Card {
  id: string;
  name: string;
  desc: string;
  idList: string;
  idLabels: string[];
  dateLastActivity?: string | null;
  due?: string | null;
  dueComplete?: boolean;
  shortUrl: string;
}

export interface Board {
  id: string;
  name: string;
  url?: string;
  lists: List[];
  cards: Card[];
  labels: Label[];
}

/** A Trello id starts with its creation time: 8 hex digits of Unix seconds. */
export function createdAt(card: Card): Date | null {
  const head = card.id.slice(0, 8);
  if (!/^[0-9a-f]{8}$/i.test(head)) return null;
  return new Date(parseInt(head, 16) * 1000);
}

function touchedAt(card: Card): Date | null {
  return card.dateLastActivity ? new Date(card.dateLastActivity) : createdAt(card);
}

function listName(board: Board, listId: string): string {
  return board.lists.find((l) => l.id === listId)?.name ?? '';
}

export function listByName(board: Board, name: string): List | undefined {
  const want = normalize(name);
  return board.lists.find((l) => normalize(l.name) === want);
}

function labelNames(board: Board, card: Card): string[] {
  return card.idLabels
    .map((id) => board.labels.find((l) => l.id === id)?.name)
    .filter((n): n is string => n !== undefined);
}

/** Lower-case, letters/digits/spaces only, single spaces. "🟢Finance" → "finance". */
export function normalize(s: string): string {
  let out = '';
  let space = false;
  for (const ch of s) {
    if (/[\p{L}\p{N}]/u.test(ch)) {
      out += ch.toLowerCase();
      space = false;
    } else if ((/\s/.test(ch) || '-_&/'.includes(ch)) && out.length > 0 && !space) {
      out += ' ';
      space = true;
    }
  }
  return out.trimEnd();
}

export type Stage = 'todo' | 'doing' | 'hold' | 'done' | 'other';

export function stageOf(listName: string): Stage {
  switch (normalize(listName)) {
    case 'to do': case 'todo': case 'backlog': case 'next': case 'ideas':
      return 'todo';
    case 'in progress': case 'doing': case 'active': case 'now':
      return 'doing';
    case 'on hold': case 'hold': case 'blocked': case 'waiting': case 'paused':
      return 'hold';
    case 'done': case 'complete': case 'completed': case 'shipped': case 'archive':
      return 'done';
    default:
      return 'other';
  }
}

// ---------- Worlds ----------

export type BoardKey = 'dos' | 'don' | 'boom';

export interface WorldDef {
  id: string;
  name: string;
  short: string;
  color: string;
  boards: string[];
  labels: string[];
  keywords: string[];
  wholeBoards: string[];
}

function w(id: string, name: string, short: string, color: string, labels: string[], keywords: string[]): WorldDef {
  return { id, name, short, color, boards: ['don'], labels, keywords, wholeBoards: [] };
}

/** Same seven worlds as the desktop bar: Don's six specialists, then Boom. */
export const DEFAULT_WORLDS: WorldDef[] = [
  w('work', 'Work', 'W', '#ffd24a', ['work'], ['sportserve', 'bdi', 'sgtm', 'jira']),
  w('finance', 'Finance', 'F', '#3ddc84', ['finance'], ['loan', 'rent', 'fees', 'budget', 'fos']),
  w('land', 'Land & Housing', 'L', '#2dd4bf', ['land', 'housing'], ['modular', 'housing', 'land', 'plot', 'container']),
  w('farm', 'Farm & Phoenix', 'P', '#ff8a3d', ['agriculture'], ['goat', 'phoenix', 'farm']),
  w('creative', 'Creative', 'C', '#b388ff', ['creative'], ['hollow men', 'poetry', 'poem', 'writing', 'film']),
  w('donstech', 'Dons Tech', 'T', '#ff6ec7', [], ['dons tech', 'don s tech']),
  { ...w('boom', 'Boom', 'B', '#4aa8ff', [], []), boards: ['boom'], wholeBoards: ['boom'] },
];

/** Whole-word containment on normalized text ("rent" must not match "current"). */
export function containsWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (` ${haystack} `.includes(` ${needle} `)) return true;
  // Ticket-style keywords ("bdi") also catch glued forms like "bdi4027".
  return (
    /^[a-z]+$/.test(needle) &&
    haystack.split(' ').some((word) => word.length > needle.length && word.startsWith(needle) && /^\d+$/.test(word.slice(needle.length)))
  );
}

export function claims(def: WorldDef, boardKey: string, board: Board, card: Card): boolean {
  if (def.wholeBoards.includes(boardKey)) return true;
  if (!def.boards.includes(boardKey)) return false;
  const labels = labelNames(board, card).map(normalize);
  if (def.labels.map(normalize).filter(Boolean).some((t) => labels.some((l) => containsWord(l, t)))) return true;
  const title = normalize(card.name);
  return def.keywords.map(normalize).filter(Boolean).some((k) => containsWord(title, k));
}

export type WorldState = 'alert' | 'attention' | 'active' | 'quiet' | 'empty';
export const STATE_ORDER: WorldState[] = ['alert', 'attention', 'active', 'quiet', 'empty'];

export type Flag = 'overdue' | 'due-soon' | 'flagged' | 'stale' | 'on-hold';

export interface ItemBrief {
  cardId: string;
  name: string;
  stage: Stage;
  flags: Flag[];
  url: string;
  due: Date | null;
  board: string;
}

export interface WorldStatus {
  id: string;
  name: string;
  short: string;
  color: string;
  state: WorldState;
  open: number;
  doing: number;
  hold: number;
  todo: number;
  overdue: number;
  dueSoon: number;
  stale: number;
  flagged: number;
  headline: string;
  items: ItemBrief[];
}

export const RULES = { staleDays: 21, dueSoonDays: 3 };
const DAY = 86_400_000;

export function cardFlags(card: Card, stage: Stage, now: Date, rules = RULES): Flag[] {
  const flags: Flag[] = [];
  if (stage === 'done') return flags;
  if (card.due && !card.dueComplete) {
    const due = new Date(card.due).getTime();
    if (due < now.getTime()) flags.push('overdue');
    else if (due - now.getTime() <= rules.dueSoonDays * DAY) flags.push('due-soon');
  }
  if (`${card.name}\n${card.desc}`.includes('⚠') || card.desc.trimStart().startsWith('BLOCKED')) flags.push('flagged');
  const t = touchedAt(card);
  if (t && now.getTime() - t.getTime() > rules.staleDays * DAY) flags.push('stale');
  if (stage === 'hold') flags.push('on-hold');
  return flags;
}

function urgency(item: ItemBrief): [number, number] {
  const f = item.flags;
  const rank = f.includes('overdue') ? 0
    : f.includes('due-soon') ? 1
    : f.includes('flagged') ? 2
    : item.stage === 'doing' ? 3
    : f.includes('stale') ? 4
    : item.stage === 'hold' ? 5
    : 6;
  return [rank, item.due ? item.due.getTime() : Number.MAX_SAFE_INTEGER];
}

export function worldStatus(def: WorldDef, boards: [string, Board][], now: Date, rules = RULES): WorldStatus {
  const items: ItemBrief[] = [];
  for (const [key, board] of boards) {
    for (const card of board.cards) {
      if (!claims(def, key, board, card)) continue;
      const stage = stageOf(listName(board, card.idList));
      if (stage === 'done') continue;
      items.push({
        cardId: card.id,
        name: card.name,
        stage,
        flags: cardFlags(card, stage, now, rules),
        url: card.shortUrl,
        due: card.due ? new Date(card.due) : null,
        board: key,
      });
    }
  }
  items.sort((a, b) => {
    const [ra, da] = urgency(a);
    const [rb, db] = urgency(b);
    return ra - rb || da - db;
  });

  const count = (pred: (i: ItemBrief) => boolean) => items.filter(pred).length;
  const overdue = count((i) => i.flags.includes('overdue'));
  const dueSoon = count((i) => i.flags.includes('due-soon'));
  const stale = count((i) => i.flags.includes('stale'));
  const flagged = count((i) => i.flags.includes('flagged'));
  const doing = count((i) => i.stage === 'doing');
  const hold = count((i) => i.stage === 'hold');
  const todo = count((i) => i.stage === 'todo' || i.stage === 'other');

  // Stale alone does not raise a pill: some cards are open-ended by design.
  const state: WorldState = overdue > 0 ? 'alert'
    : dueSoon > 0 || flagged > 0 ? 'attention'
    : doing > 0 ? 'active'
    : items.length > 0 ? 'quiet'
    : 'empty';

  const top = items[0];
  let headline: string;
  if (!top) headline = 'nothing open';
  else if (top.flags.includes('overdue')) headline = `${shortTitle(top.name)} — overdue`;
  else if (top.flags.includes('due-soon')) headline = `${shortTitle(top.name)} — due ${top.due ? dayWord(top.due, now) : ''}`;
  else if (top.flags.includes('flagged')) headline = `${shortTitle(top.name)} — needs a look`;
  else if (doing > 0) headline = `${doing} in progress`;
  else if (top.flags.includes('stale')) headline = `${shortTitle(top.name)} — gone quiet`;
  else if (hold > 0 && todo === 0) headline = `${hold} on hold`;
  else headline = `${items.length} planned`;

  return { id: def.id, name: def.name, short: def.short, color: def.color, state, open: items.length, doing, hold, todo, overdue, dueSoon, stale, flagged, headline, items };
}

/** Emoji and symbols that decorate card titles. */
export function isDecoration(ch: string): boolean {
  const u = ch.codePointAt(0) ?? 0;
  return (
    (u >= 0x1f000 && u <= 0x1faff) ||
    (u >= 0x2600 && u <= 0x27bf) ||
    (u >= 0x2b00 && u <= 0x2bff) ||
    (u >= 0xfe00 && u <= 0xfe0f) ||
    u === 0x200d
  );
}

export function stripDecoration(s: string): string {
  return [...s].filter((c) => !isDecoration(c)).join('').trim();
}

/** "sGTM Marketing Campaign - Next Sprint (BDI-4025)" → "sGTM Marketing Campaign". */
export function shortTitle(name: string): string {
  const cleaned = stripDecoration(name);
  const cuts = [' — ', ' - ', ' (', ': ', ' – '].map((s) => cleaned.indexOf(s)).filter((i) => i >= 0);
  const head = cleaned.slice(0, cuts.length ? Math.min(...cuts) : cleaned.length).trim();
  const chars = [...head];
  return chars.length > 42 ? chars.slice(0, 40).join('') + '…' : head;
}

// East Africa Time (UTC+3, no DST): the only zone Dos lives in.
const EAT = 3 * 3600_000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function eatDay(d: Date): number {
  return Math.floor((d.getTime() + EAT) / DAY);
}

/** "today", "tomorrow", "yesterday", a weekday within the week, else "30 Sep". */
export function dayWord(when: Date, now: Date): string {
  const days = eatDay(when) - eatDay(now);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  const local = new Date(when.getTime() + EAT);
  if (days >= 2 && days <= 6) return WEEKDAYS[local.getUTCDay()];
  return `${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
}

/** "5m ago", "3h ago", "yesterday", "2 Nov" — for the feed. */
export function ago(when: Date | null, now: Date): string {
  if (!when) return '';
  const mins = Math.round((now.getTime() - when.getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)}h ago`;
  return dayWord(when, now);
}

// ---------- The Dos board: pings, asks, answers ----------

export const LAYOUT = {
  pingPrefixes: ['🔔', 'Weekly Priority Report', 'Trello Check-In', 'Morning Briefing', 'Working Dashboard Refresh', 'Watchdog'],
  asksList: 'Dos asks',
  answeredList: 'Dos answered',
  notesList: 'To do',
};

export interface Ping {
  cardId: string;
  kind: string;
  title: string;
  summary: string;
  link: string;
  cardUrl: string;
  at: Date | null;
  live: boolean;
}

export interface Ask {
  id: string;
  question: string;
  detail: string;
  world: string | null;
  url: string;
  at: Date | null;
}

export type Decision = 'do_it' | 'hold' | 'skip';

export const MARKER: Record<Decision, string> = {
  do_it: '✅ DO IT',
  hold: '⏸ HOLD',
  skip: '✖ SKIP',
};

/** "✅ DO IT — Archive old pings?" from "Archive old pings?" — idempotent. */
export function answeredTitle(original: string, decision: Decision): string {
  let base = original.trim();
  for (const m of Object.values(MARKER)) {
    if (base.startsWith(m)) base = base.slice(m.length).replace(/^[ —\-:]+/, '').trim();
  }
  return `${MARKER[decision]} — ${base}`;
}

export function isPing(title: string): boolean {
  const t = title.trim();
  return LAYOUT.pingPrefixes.some((p) => {
    const np = normalize(p);
    return t.startsWith(p) || (np !== '' && normalize(t).startsWith(np));
  });
}

/** The first paragraph, without URLs or "Full briefing (rendered page):" lines. */
export function summarize(desc: string): string {
  const para = desc.split('\n\n').map((p) => p.trim()).find((p) => p) ?? '';
  const joined = para
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.toLowerCase().startsWith('full briefing'))
    .join(' ');
  const text = joined.split(/\s+/).filter((w) => w && !w.startsWith('http')).join(' ');
  const chars = [...text];
  return chars.length > 320 ? chars.slice(0, 317).join('').trimEnd() + '…' : text;
}

function firstLink(text: string, prefer: string): string | null {
  for (const raw of text.split(/\s+/)) {
    const word = raw.replace(/^[()<>,.]+|[()<>,.]+$/g, '');
    if (word.startsWith(prefer)) return word;
  }
  return null;
}

function pingFrom(card: Card, board: Board): Ping {
  const title = stripDecoration(card.name);
  const cuts = [' — ', ' – ', ' - ', ': '].map((s) => title.indexOf(s)).filter((i) => i >= 0);
  return {
    cardId: card.id,
    kind: cuts.length ? title.slice(0, Math.min(...cuts)).trim() : title,
    title,
    summary: summarize(card.desc),
    link: firstLink(card.desc, 'https://claude.ai/') ?? card.shortUrl,
    cardUrl: card.shortUrl,
    at: createdAt(card) ?? (card.dateLastActivity ? new Date(card.dateLastActivity) : null),
    live: stageOf(listName(board, card.idList)) === 'doing',
  };
}

function worldOf(card: Card, boardKey: string, board: Board, worlds: WorldDef[]): string | null {
  // Asks sit on the Dos board, so match on labels/keywords regardless of board.
  const hit = worlds.find((def) => claims({ ...def, boards: [...def.boards, boardKey], wholeBoards: [] }, boardKey, board, card));
  return hit?.id ?? null;
}

export interface BoardHealth {
  key: string;
  ok: boolean;
  error?: string;
}

export interface Snapshot {
  takenAt: Date;
  worlds: WorldStatus[];
  pings: Ping[];
  asks: Ask[];
  boards: BoardHealth[];
  answeredListId: string | null;
  notesListId: string | null;
}

export function buildSnapshot(boards: [string, Board][], health: BoardHealth[], now: Date, worlds = DEFAULT_WORLDS): Snapshot {
  const statuses = worlds.map((def) => worldStatus(def, boards, now));
  const pings: Ping[] = [];
  const asks: Ask[] = [];
  let answeredListId: string | null = null;
  let notesListId: string | null = null;

  const dos = boards.find(([k]) => k === 'dos');
  if (dos) {
    const [key, board] = dos;
    const asksListId = listByName(board, LAYOUT.asksList)?.id ?? null;
    answeredListId = listByName(board, LAYOUT.answeredList)?.id ?? null;
    notesListId = listByName(board, LAYOUT.notesList)?.id ?? null;
    for (const card of board.cards) {
      if (asksListId && card.idList === asksListId) {
        asks.push({
          id: card.id,
          question: stripDecoration(card.name),
          detail: summarize(card.desc),
          world: worldOf(card, key, board, worlds),
          url: card.shortUrl,
          at: createdAt(card),
        });
      } else if (isPing(card.name)) {
        pings.push(pingFrom(card, board));
      }
    }
  }
  pings.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
  asks.sort((a, b) => (a.at?.getTime() ?? 0) - (b.at?.getTime() ?? 0));

  return { takenAt: now, worlds: statuses, pings: pings.slice(0, 30), asks, boards: health, answeredListId, notesListId };
}

/** Worlds that need you, most urgent first. */
export function needsYou(snap: Snapshot): WorldStatus[] {
  return snap.worlds
    .filter((w) => w.state === 'alert' || w.state === 'attention')
    .sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state));
}

/** Trello ids are 24 hex characters; anything else never becomes part of a URL path. */
export function isTrelloId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}

/** A board short link: the part after /b/ in the board URL. Accepts a pasted URL too. */
export function parseShortLink(input: string): string | null {
  const t = input.trim();
  const m = t.match(/trello\.com\/b\/([A-Za-z0-9]+)/);
  const short = m ? m[1] : t;
  return /^[A-Za-z0-9]{1,32}$/.test(short) ? short : null;
}

/** Time stamp for comments, in EAT like the desktop: "5 Nov 2026 14:03 EAT". */
export function nowEat(now = new Date()): string {
  const d = new Date(now.getTime() + EAT);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${hh}:${mm} EAT`;
}
