/// <reference types="node" />
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  answeredTitle, buildSnapshot, containsWord, dayWord, isPing, needsYou, normalize,
  parseShortLink, shortTitle, stageOf, summarize, type Board, type Card,
} from './core';

const NOW = new Date('2026-11-05T09:00:00Z'); // 12:00 EAT, a Thursday
const hex = (d: Date) => Math.floor(d.getTime() / 1000).toString(16).padStart(8, '0');
let n = 0;
function card(name: string, idList: string, extra: Partial<Card> = {}, created = NOW): Card {
  n += 1;
  return {
    id: hex(created) + String(n).padStart(16, '0'),
    name, desc: '', idList, idLabels: [], shortUrl: `https://trello.com/c/x${n}`,
    dateLastActivity: created.toISOString(), ...extra,
  };
}
const days = (k: number) => new Date(NOW.getTime() + k * 86_400_000).toISOString();

test('normalize strips emoji and punctuation', () => {
  assert.equal(normalize('🟢Finance'), 'finance');
  assert.equal(normalize('🔴 Family Legacy'), 'family legacy');
  assert.equal(normalize('Land & Housing'), 'land housing');
});

test('stages come from list names', () => {
  assert.equal(stageOf('In progress'), 'doing');
  assert.equal(stageOf('On Hold'), 'hold');
  assert.equal(stageOf('✅ Done'), 'done');
  assert.equal(stageOf('Dos asks'), 'other');
});

test('whole-word matching', () => {
  assert.ok(!containsWord('current account', 'rent'));
  assert.ok(containsWord('pay rent', 'rent'));
  assert.ok(containsWord('fix bdi4027 today', 'bdi'));
});

test('shortTitle trims at separators', () => {
  assert.equal(shortTitle('🚀 sGTM Marketing Campaign - Next Sprint (BDI-4025)'), 'sGTM Marketing Campaign');
});

test('dayWord in EAT', () => {
  assert.equal(dayWord(new Date('2026-11-05T20:30:00Z'), NOW), 'today'); // 23:30 EAT on the 5th
  assert.equal(dayWord(new Date('2026-11-05T21:30:00Z'), NOW), 'tomorrow'); // 00:30 EAT on the 6th
  assert.equal(dayWord(new Date('2026-11-08T09:00:00Z'), NOW), 'Sunday');
  assert.equal(dayWord(new Date('2026-11-30T09:00:00Z'), NOW), '30 Nov');
});

test('answeredTitle is idempotent', () => {
  const once = answeredTitle('Send the reply?', 'do_it');
  assert.equal(once, '✅ DO IT — Send the reply?');
  assert.equal(answeredTitle(once, 'skip'), '✖ SKIP — Send the reply?');
});

test('pings and summaries', () => {
  assert.ok(isPing('🔔 Watchdog: all quiet'));
  assert.ok(isPing('Morning Briefing — 5 Nov'));
  assert.ok(!isPing('📝 buy cement'));
  assert.equal(summarize('Three things need you.\nFull briefing (rendered page): https://claude.ai/x\n\nMore'), 'Three things need you.');
});

test('parseShortLink accepts urls and bare links', () => {
  assert.equal(parseShortLink('https://trello.com/b/vKKgCDGD/dos'), 'vKKgCDGD');
  assert.equal(parseShortLink(' 5jR6zssk '), '5jR6zssk');
  assert.equal(parseShortLink('../etc'), null);
});

test('snapshot: worlds, pings, asks', () => {
  const dos: Board = {
    id: 'a'.repeat(24), name: 'Dos',
    lists: [
      { id: 'todo', name: 'To do' }, { id: 'prog', name: 'In progress' },
      { id: 'asks', name: 'Dos asks' }, { id: 'ans', name: 'Dos answered' },
    ],
    labels: [{ id: 'lf', name: '🟢Finance' }],
    cards: [
      card('Morning Briefing — 5 Nov', 'prog', { desc: 'Rent is due Friday.\nhttps://claude.ai/page' }),
      card('Pay the landlord now?', 'asks', { idLabels: ['lf'] }),
    ],
  };
  const don: Board = {
    id: 'b'.repeat(24), name: 'Don',
    lists: [{ id: 'd1', name: 'To do' }, { id: 'd2', name: 'In progress' }, { id: 'd3', name: 'Done' }],
    labels: [],
    cards: [
      card('Pay rent', 'd1', { due: days(-1) }),
      card('Goat vaccines', 'd2'),
      card('Plot survey', 'd3'),
    ],
  };
  const snap = buildSnapshot([['dos', dos], ['don', don]], [], NOW);
  const fin = snap.worlds.find((w) => w.id === 'finance')!;
  assert.equal(fin.state, 'alert');
  assert.equal(fin.headline, 'Pay rent — overdue');
  assert.equal(snap.worlds.find((w) => w.id === 'farm')!.state, 'active');
  assert.equal(snap.worlds.find((w) => w.id === 'land')!.state, 'empty');
  assert.equal(snap.pings.length, 1);
  assert.equal(snap.pings[0].link, 'https://claude.ai/page');
  assert.ok(snap.pings[0].live);
  assert.equal(snap.asks.length, 1);
  assert.equal(snap.asks[0].world, 'finance');
  assert.equal(snap.answeredListId, 'ans');
  assert.equal(snap.notesListId, 'todo');
  assert.deepEqual(needsYou(snap).map((w) => w.id), ['finance']);
});
