import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ago, MARKER, type Ask, type Decision, type Ping, type WorldStatus } from '@/dos/core';
import { C, mono, STATE_COLOR, STATE_WORD } from './theme';

export function tap() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function openUrl(url: string) {
  if (/^https:\/\//.test(url)) Linking.openURL(url).catch(() => undefined);
}

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Prompt({ children }: { children: string }) {
  return (
    <Text style={s.prompt}>
      <Text style={{ color: C.green }}>dos:~$ </Text>
      {children}
    </Text>
  );
}

const DECISIONS: { d: Decision; label: string; color: string }[] = [
  { d: 'do_it', label: 'Do it', color: C.green },
  { d: 'hold', label: 'Hold', color: C.amber },
  { d: 'skip', label: 'Skip', color: C.dim },
];

export function AskCard({ ask, world, onAnswer }: { ask: Ask; world?: WorldStatus; onAnswer: (d: Decision) => Promise<void> }) {
  const [busy, setBusy] = useState<Decision | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const go = async (d: Decision) => {
    tap();
    setBusy(d);
    setErr(null);
    try {
      await onAnswer(d);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };
  return (
    <View style={[s.card, { borderLeftColor: world?.color ?? C.blue }]}>
      <View style={s.row}>
        {world && <Dot color={world.color} label={world.short} />}
        <Text style={s.meta}>Dos asks{world ? ` · ${world.name}` : ''} · {ago(ask.at, new Date())}</Text>
      </View>
      <Text style={s.question} onPress={() => openUrl(ask.url)}>{ask.question}</Text>
      {ask.detail ? <Text style={s.body}>{ask.detail}</Text> : null}
      <View style={[s.row, { marginTop: 12, gap: 8 }]}>
        {DECISIONS.map(({ d, label, color }) => (
          <Pressable
            key={d}
            disabled={busy !== null}
            onPress={() => go(d)}
            accessibilityLabel={`${label}: ${MARKER[d]}`}
            style={({ pressed }) => [s.btn, { borderColor: color, opacity: busy && busy !== d ? 0.35 : pressed ? 0.6 : 1 }, d === 'do_it' && { backgroundColor: color }]}>
            {busy === d ? (
              <ActivityIndicator size="small" color={d === 'do_it' ? C.bg : color} />
            ) : (
              <Text style={[s.btnText, { color: d === 'do_it' ? C.bg : color }]}>{label}</Text>
            )}
          </Pressable>
        ))}
      </View>
      {err ? <Text style={s.err}>{err}</Text> : null}
    </View>
  );
}

export function PingRow({ ping }: { ping: Ping }) {
  return (
    <Pressable onPress={() => openUrl(ping.link)} style={({ pressed }) => [s.ping, pressed && { backgroundColor: C.panel2 }]}>
      <View style={s.row}>
        <Text style={[s.kind, ping.live && { color: C.green }]}>{ping.live ? '● ' : ''}{ping.kind}</Text>
        <Text style={s.meta}>{ago(ping.at, new Date())}</Text>
      </View>
      {ping.summary ? <Text style={s.body} numberOfLines={3}>{ping.summary}</Text> : <Text style={s.body} numberOfLines={2}>{ping.title}</Text>}
    </Pressable>
  );
}

export function Dot({ color, label }: { color: string; label: string }) {
  return (
    <View style={[s.dot, { backgroundColor: color }]}>
      <Text style={s.dotText}>{label}</Text>
    </View>
  );
}

export function WorldPill({ world, discreet, onPress }: { world: WorldStatus; discreet: boolean; onPress?: () => void }) {
  const sc = STATE_COLOR[world.state];
  const headline = discreet ? countsLine(world) : world.headline;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pill, { borderColor: world.state === 'empty' ? C.line : sc }, pressed && { opacity: 0.7 }]}>
      <View style={s.row}>
        <Dot color={world.color} label={world.short} />
        <Text style={s.pillName}>{world.name}</Text>
        <Text style={[s.state, { color: sc }]}>{STATE_WORD[world.state]}</Text>
      </View>
      <Text style={s.pillHead} numberOfLines={1}>{headline}</Text>
      <Text style={s.counts}>
        {world.open} open · {world.doing} doing{world.overdue ? ` · ${world.overdue} overdue` : ''}{world.dueSoon ? ` · ${world.dueSoon} due soon` : ''}
      </Text>
    </Pressable>
  );
}

export function countsLine(w: WorldStatus): string {
  if (w.overdue) return `${w.overdue} overdue`;
  if (w.dueSoon) return `${w.dueSoon} due soon`;
  if (w.flagged) return `${w.flagged} flagged`;
  if (w.doing) return `${w.doing} in progress`;
  return w.open ? `${w.open} open` : 'nothing open';
}

export function Empty({ children }: { children: string }) {
  return <Text style={[s.body, { color: C.faint, paddingVertical: 8 }]}>{children}</Text>;
}

export const s = StyleSheet.create({
  section: { marginTop: 22 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: C.dim, fontFamily: mono, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  prompt: { color: C.text, fontFamily: mono, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  card: { backgroundColor: C.panel, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderColor: C.line },
  meta: { color: C.faint, fontSize: 12, fontFamily: mono },
  question: { color: C.text, fontSize: 17, fontWeight: '600', marginTop: 8, lineHeight: 23 },
  body: { color: C.dim, fontSize: 14, lineHeight: 20, marginTop: 4 },
  btn: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontWeight: '700', fontSize: 15 },
  err: { color: C.red, fontSize: 13, marginTop: 8 },
  ping: { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  kind: { color: C.text, fontWeight: '600', fontSize: 14, flexShrink: 1 },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: C.bg, fontWeight: '800', fontSize: 11 },
  pill: { backgroundColor: C.panel, borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  pillName: { color: C.text, fontWeight: '600', fontSize: 15, flex: 1 },
  state: { fontFamily: mono, fontSize: 11 },
  pillHead: { color: C.text, fontSize: 14, marginTop: 8 },
  counts: { color: C.faint, fontSize: 12, marginTop: 4, fontFamily: mono },
});
