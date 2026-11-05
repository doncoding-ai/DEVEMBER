import { router } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { ago, needsYou, type Snapshot } from '@/dos/core';
import { useDos } from '@/dos/store';
import { Eyes, Orb } from '@/ui/faces';
import { Hero } from '@/ui/hero';
import { AskCard, Btn, countsLine, Empty, makeStyles, PingRow, Section, WorldPill } from '@/ui/parts';
import { useStyles, useTheme } from '@/ui/theme';

export default function Now() {
  const { ready, configured, snapshot, loading, error, refresh, answer, config } = useDos();
  const t = useTheme();
  const s = useStyles(makeStyles);

  if (ready && !configured) return <Setup />;

  const urgent = snapshot ? needsYou(snapshot) : [];
  const worldById = (id: string | null) => snapshot?.worlds.find((w) => w.id === id);
  const discreet = (id: string) => config.discreetWork && id === 'work';
  const tone = snapshot?.asks.length ? 'amber' : urgent.length ? 'green' : 'quiet';

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={t.green} />}>
      <Hero snapshot={snapshot} line={statusLine(snapshot, urgent.length, loading)} tone={tone} />
      {error ? <Text style={s.err}>{error}</Text> : null}

      <Section title={`Dos asks${snapshot?.asks.length ? ` · ${snapshot.asks.length}` : ''}`}>
        {snapshot?.asks.length ? (
          snapshot.asks.map((a) => <AskCard key={a.id} ask={a} world={worldById(a.world)} onAnswer={(d) => answer(a, d)} />)
        ) : (
          <Empty>Nothing waiting on you.</Empty>
        )}
      </Section>

      {urgent.length > 0 && (
        <Section title="Needs you">
          {urgent.map((w) => (
            <WorldPill key={w.id} world={w} discreet={discreet(w.id)} onPress={() => router.push(`/world/${w.id}`)} />
          ))}
        </Section>
      )}

      <Section title="Pings">
        {snapshot?.pings.length ? snapshot.pings.slice(0, 12).map((p) => <PingRow key={p.cardId} ping={p} />) : <Empty>No pings on the Dos board yet.</Empty>}
      </Section>

      {snapshot && (
        <Text style={[s.meta, { marginTop: 20, textAlign: 'center' }]}>
          updated {ago(snapshot.takenAt, new Date())} · {snapshot.worlds.map((w) => `${w.short}:${discreet(w.id) ? countsLine(w).split(' ')[0] : w.open}`).join(' ')}
        </Text>
      )}
    </ScrollView>
  );
}

function statusLine(snap: Snapshot | null, urgent: number, loading: boolean): string {
  if (!snap) return loading ? 'Reading the boards…' : 'No board data yet. Pull down to refresh.';
  const asks = snap.asks.length;
  if (!asks && !urgent) return 'All quiet. Nothing needs you right now.';
  const parts = [];
  if (asks) parts.push(`${asks} question${asks > 1 ? 's' : ''} waiting`);
  if (urgent) parts.push(`${urgent} world${urgent > 1 ? 's' : ''} need${urgent > 1 ? '' : 's'} a look`);
  return parts.join(', ') + '.';
}

function Setup() {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const face = t.look === 'liquid' ? <Eyes size={44} /> : t.look === 'terminal' ? null : <Orb size={72} />;
  return (
    <View style={[s.screen, { padding: 24, justifyContent: 'center' }]}>
      {face ? <View style={{ alignItems: t.look === 'presence' ? 'center' : 'flex-start', marginBottom: 24 }}>{face}</View> : null}
      {t.look === 'terminal' ? <Text style={s.prompt}><Text style={{ color: t.green }}>dos:~$ </Text>hello</Text> : null}
      <Text style={[s.question, { fontSize: 24, marginTop: 12 }]}>Dos, in your pocket.</Text>
      <Text style={[s.body, { fontSize: 15, marginTop: 10 }]}>
        Answer Dos&apos;s questions, see how each world is doing, and drop notes from your phone. It reads the same Trello boards as Dos Live on your PC, so the PC
        doesn&apos;t need to be on.
      </Text>
      <Btn label="Connect Trello" onPress={() => router.push('/settings')} style={{ marginTop: 24 }} />
    </View>
  );
}
