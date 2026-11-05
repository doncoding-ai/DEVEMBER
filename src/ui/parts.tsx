import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { ago, type Ask, type Decision, type Ping, type WorldStatus } from '@/dos/core';
import { Orb } from './faces';
import { STATE_WORD, stateColor, useStyles, useTheme, type Tokens } from './theme';

export function tap() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function openUrl(url: string) {
  if (/^https:\/\//.test(url)) Linking.openURL(url).catch(() => undefined);
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{t.sectionStyle === 'comment' ? `# ${title.toLowerCase()}` : title}</Text>
      {children}
    </View>
  );
}

export function Prompt({ children }: { children: string }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  return (
    <Text style={s.prompt}>
      <Text style={{ color: t.green }}>dos:~$ </Text>
      {children}
    </Text>
  );
}

type BtnKind = 'go' | 'askGo' | 'hold' | 'skip' | 'link';

/** A button in the current look: filled, keyboard key (terminal) or round pill (presence, bubble). */
export function Btn({ label, kind = 'go', onPress, busy, disabled, hint, style }: {
  label: string; kind?: BtnKind; onPress: () => void; busy?: boolean; disabled?: boolean; hint?: string; style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const term = t.look === 'terminal';
  const look = {
    go: { bg: t.goBg, ink: t.goInk, line: t.goLine },
    askGo: { bg: t.askGoBg, ink: t.askGoInk, line: term ? t.goLine : t.askGoBg },
    hold: { bg: term ? t.panel : 'transparent', ink: t.amber, line: term ? t.line : t.amber },
    skip: { bg: term ? t.panel : 'transparent', ink: t.dim, line: t.line },
    link: { bg: term ? t.panel : 'transparent', ink: t.blue, line: term ? t.line : t.blue },
  }[kind];
  return (
    <Pressable
      disabled={disabled || busy}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: look.bg, borderColor: look.line, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        term && { borderBottomWidth: pressed ? 1 : 3, transform: [{ translateY: pressed ? 2 : 0 }] },
        style,
      ]}>
      {busy ? (
        <ActivityIndicator size="small" color={look.ink} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {term && hint ? <Text style={[s.kbd, { color: look.ink }]}>{hint}</Text> : null}
          <Text style={[s.btnText, { color: look.ink }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const DECISIONS: { d: Decision; label: string; kind: BtnKind; hint: string }[] = [
  { d: 'do_it', label: 'Do it', kind: 'askGo', hint: 'Y' },
  { d: 'hold', label: 'Hold', kind: 'hold', hint: 'H' },
  { d: 'skip', label: 'Skip', kind: 'skip', hint: 'N' },
];

export function AskCard({ ask, world, onAnswer }: { ask: Ask; world?: WorldStatus; onAnswer: (d: Decision) => Promise<void> }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
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
  const meta = t.look === 'terminal'
    ? `? dos asks${world ? ` --world ${world.id}` : ''}  ${ago(ask.at, new Date())}`
    : `Dos asks${world ? ` · ${world.name}` : ''} · ${ago(ask.at, new Date())}`;

  const body = (
    <>
      <View style={s.row}>
        {world && t.look !== 'terminal' && <Dot color={world.color} label={world.short} />}
        <Text style={s.meta}>{meta}</Text>
      </View>
      <Text style={s.question} onPress={() => openUrl(ask.url)}>{ask.question}</Text>
      {ask.detail ? <Text style={s.body}>{ask.detail}</Text> : null}
      <View style={[s.row, { marginTop: 14, gap: 8, flexWrap: 'nowrap' }]}>
        {DECISIONS.map(({ d, label, kind, hint }) => (
          <Btn key={d} label={label} kind={kind} hint={hint} busy={busy === d} disabled={busy !== null && busy !== d} onPress={() => go(d)} style={{ flex: 1 }} />
        ))}
      </View>
      {err ? <Text style={s.err}>{err}</Text> : null}
    </>
  );

  if (t.look === 'bubble') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 14 }}>
        <Orb size={30} tone="amber" />
        <View style={{ flex: 1 }}>
          <View style={[s.card, s.bubbleCard, { borderColor: t.amber }]}>{body}</View>
        </View>
      </View>
    );
  }
  return <View style={[s.card, s.askCard, { borderLeftColor: world?.color ?? t.blue }]}>{body}</View>;
}

export function PingRow({ ping }: { ping: Ping }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const when = ago(ping.at, new Date());
  const text = ping.summary || ping.title;

  if (t.look === 'terminal') {
    return (
      <Pressable onPress={() => openUrl(ping.link)} style={({ pressed }) => [s.termLine, pressed && { backgroundColor: t.panel2 }]}>
        <Text style={s.termWho} numberOfLines={1}>{ping.live ? '▸ ' : ''}{ping.kind}<Text style={s.meta}>  {when}</Text></Text>
        <Text style={s.termText} numberOfLines={3}>{text}</Text>
      </Pressable>
    );
  }
  if (t.look === 'bubble') {
    return (
      <Pressable onPress={() => openUrl(ping.link)} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
        <Orb size={22} tone={ping.live ? 'green' : 'quiet'} />
        <View style={[s.bubbleMsg, { flex: 1 }]}>
          <Text style={s.kind}>{ping.kind} <Text style={s.meta}> {when}</Text></Text>
          <Text style={s.body} numberOfLines={4}>{text}</Text>
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={() => openUrl(ping.link)} style={({ pressed }) => [s.ping, pressed && { backgroundColor: t.panel2 }]}>
      <View style={s.row}>
        <Text style={[s.kind, ping.live && { color: t.green }, { flex: 1 }]}>{ping.live ? '● ' : ''}{ping.kind}</Text>
        <Text style={s.meta}>{when}</Text>
      </View>
      <Text style={s.body} numberOfLines={3}>{text}</Text>
    </Pressable>
  );
}

export function Dot({ color, label, size = 22 }: { color: string; label: string; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#04140b', fontFamily: t.font.uiBold, fontSize: size * 0.5 }}>{label}</Text>
    </View>
  );
}

export function WorldPill({ world, discreet, onPress }: { world: WorldStatus; discreet: boolean; onPress?: () => void }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const sc = stateColor(t, world.state);
  const headline = discreet ? countsLine(world) : world.headline;
  const counts = `${world.open} open · ${world.doing} doing${world.overdue ? ` · ${world.overdue} overdue` : ''}${world.dueSoon ? ` · ${world.dueSoon} due soon` : ''}`;

  if (t.look === 'terminal') {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.termLine, pressed && { backgroundColor: t.panel2 }]}>
        <Text style={s.termWho}>
          <Text style={{ color: world.color }}>■ </Text>{world.id.padEnd(9, ' ')}<Text style={{ color: sc }}>[{STATE_WORD[world.state]}]</Text>
        </Text>
        <Text style={s.termText} numberOfLines={1}>{headline}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pill, { borderColor: world.state === 'empty' ? t.line : sc }, pressed && { opacity: 0.7 }]}>
      <View style={s.row}>
        <Dot color={world.color} label={world.short} />
        <Text style={s.pillName}>{world.name}</Text>
        <Text style={[s.state, { color: sc }]}>{STATE_WORD[world.state]}</Text>
      </View>
      <Text style={s.pillHead} numberOfLines={1}>{headline}</Text>
      <Text style={s.counts}>{counts}</Text>
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
  const s = useStyles(makeStyles);
  return <Text style={[s.body, { opacity: 0.7, paddingVertical: 8 }]}>{children}</Text>;
}

export function makeStyles(t: Tokens) {
  const term = t.look === 'terminal';
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    section: { marginTop: 24 },
    sectionTitle: term
      ? { color: t.faint, fontFamily: t.font.mono, fontSize: 13, marginBottom: 10 }
      : { color: t.dim, fontFamily: t.font.uiMedium, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 },
    prompt: { color: t.text, fontFamily: t.font.mono, fontSize: 15 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    card: { backgroundColor: term ? 'transparent' : t.panel, borderRadius: t.radius, padding: 16, marginBottom: 10, borderWidth: term ? 1 : 0, borderColor: t.line },
    askCard: term ? { borderColor: t.amber } : { borderLeftWidth: 3 },
    bubbleCard: { borderWidth: 1.5, borderBottomLeftRadius: 4, marginBottom: 0 },
    bubbleMsg: { backgroundColor: t.panel, borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10 },
    meta: { color: t.faint, fontSize: 12, fontFamily: t.font.mono },
    question: { color: t.text, fontSize: t.look === 'presence' ? 19 : 17, fontFamily: term ? t.font.uiMedium : t.font.uiBold, marginTop: 8, lineHeight: 24 },
    body: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 4, fontFamily: t.font.ui },
    btn: { minHeight: 44, borderRadius: t.btnRadius, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
    btnText: { fontFamily: term ? t.font.uiMedium : t.font.uiBold, fontSize: 15 },
    kbd: { fontFamily: t.font.monoBold, fontSize: 11, opacity: 0.8 },
    err: { color: t.red, fontSize: 13, marginTop: 8, fontFamily: t.font.ui },
    ping: { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
    termLine: { paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
    termWho: { color: t.green, fontFamily: t.font.monoBold, fontSize: 13 },
    termText: { color: t.text, fontFamily: t.font.mono, fontSize: 13, lineHeight: 19, marginTop: 3 },
    kind: { color: t.text, fontFamily: t.font.uiMedium, fontSize: 14, flexShrink: 1 },
    pill: { backgroundColor: t.panel, borderRadius: t.radius, padding: 14, borderWidth: 1, marginBottom: 10 },
    pillName: { color: t.text, fontFamily: t.font.uiMedium, fontSize: 15, flex: 1 },
    state: { fontFamily: t.font.mono, fontSize: 11 },
    pillHead: { color: t.text, fontSize: 14, marginTop: 8, fontFamily: t.font.ui },
    counts: { color: t.faint, fontSize: 12, marginTop: 4, fontFamily: t.font.mono },
    input: {
      backgroundColor: term ? 'transparent' : t.panel, color: t.text, borderRadius: Math.min(t.radius, 12), paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, fontFamily: t.font.mono, borderWidth: 1, borderColor: t.line,
    },
  });
}
