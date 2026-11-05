// Trello over HTTPS, the same calls the desktop makes. Credentials ride as the
// key/token query pair. A URL with credentials in it is never logged or shown:
// every failure maps to a fixed message below.

import { BOARD_QUERY, isTrelloId, parseShortLink, type Board } from './core';

const API = 'https://api.trello.com/1';

export interface Creds {
  key: string;
  token: string;
}

async function send(creds: Creds, method: 'GET' | 'PUT' | 'POST', path: string, form?: Record<string, string>): Promise<unknown> {
  const auth = new URLSearchParams({ key: creds.key.trim(), token: creds.token.trim() }).toString();
  const sep = path.includes('?') ? '&' : '?';
  let resp: Response;
  try {
    resp = await fetch(`${API}${path}${sep}${auth}`, {
      method,
      headers: form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
      body: form ? new URLSearchParams(form).toString() : undefined,
    });
  } catch {
    throw new Error("Can't reach Trello (offline?)");
  }
  switch (true) {
    case resp.ok:
      return resp.json().catch(() => ({}));
    case resp.status === 401:
      throw new Error('Trello rejected the key/token (401). Check Settings.');
    case resp.status === 403:
      throw new Error("Trello says this token can't do that (403). It needs read,write scope.");
    case resp.status === 404:
      throw new Error("Trello couldn't find that board or card (404).");
    case resp.status === 429:
      throw new Error('Trello rate limit. Try again in a minute.');
    default:
      throw new Error(`Trello error ${resp.status}`);
  }
}

function id(v: string): string {
  if (!isTrelloId(v)) throw new Error('invalid Trello id');
  return v;
}

export async function me(creds: Creds): Promise<{ username: string; fullName: string }> {
  return (await send(creds, 'GET', '/members/me?fields=username,fullName')) as { username: string; fullName: string };
}

export async function board(creds: Creds, shortLink: string): Promise<Board> {
  const short = parseShortLink(shortLink);
  if (!short) throw new Error(`"${shortLink}" is not a board link`);
  const b = (await send(creds, 'GET', `/boards/${short}?${BOARD_QUERY}`)) as Partial<Board>;
  return {
    id: b.id ?? '',
    name: b.name ?? short,
    url: b.url,
    lists: b.lists ?? [],
    labels: (b.labels ?? []).map((l) => ({ ...l, name: l.name ?? '' })),
    cards: (b.cards ?? []).map((c) => ({ ...c, desc: c.desc ?? '', idLabels: c.idLabels ?? [] })),
  };
}

/** Answers an ask: new title and move to "Dos answered", then a comment for the record. */
export async function answerCard(creds: Creds, cardId: string, newTitle: string, comment: string, toList: string | null): Promise<void> {
  const form: Record<string, string> = { name: newTitle };
  if (toList) {
    form.idList = id(toList);
    form.pos = 'top';
  }
  await send(creds, 'PUT', `/cards/${id(cardId)}`, form);
  // The comment is a nice-to-have; the title already carries the answer.
  await send(creds, 'POST', `/cards/${id(cardId)}/actions/comments`, { text: comment }).catch(() => undefined);
}

export async function createCard(creds: Creds, listId: string, name: string, desc: string): Promise<void> {
  await send(creds, 'POST', '/cards', { idList: id(listId), name, desc, pos: 'top' });
}
