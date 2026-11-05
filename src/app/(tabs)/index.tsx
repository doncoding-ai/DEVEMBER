import { Link, router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { ago, needsYou } from '@/dos/core';
import { useDos } from '@/dos/store';
import { AskCard, countsLine, Empty, PingRow, Prompt, s, Section, WorldPill } from '@/ui/parts';
import { C } from '@/ui/theme';

export default function Now() {
  const { ready, configured, snapshot, loading, error, refresh, answer, config } = useDos();

  if (ready && !configured) return <Setup />;

  const urgent = snapshot ? needsYou(snapshot) : [];
  const worldById = (id: string | null) => snapshot?.worlds.find((w) => w.id === id);
  const discreet = (id: string) => config.discreetWork && id === 'work';

  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.green} />}>
      <Prompt>status</Prompt>
      <Text style={[s.body, { marginTop: 6 }]}>{statusLine(snapshot, urgent.length, loading)}</Text>
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

function statusLine(snap: ReturnType<typeof useDos>['snapshot'], urgent: number, loading: boolean): string {
  if (!snap) return loading ? 'Reading the boards…' : 'No board data yet. Pull down to refresh.';
  const asks = snap.asks.length;
  if (!asks && !urgent) return 'All quiet. Nothing needs you right now.';
  const parts = [];
  if (asks) parts.push(`${asks} question${asks > 1 ? 's' : ''} waiting`);
  if (urgent) parts.push(`${urgent} world${urgent > 1 ? 's' : ''} need${urgent > 1 ? '' : 's'} a look`);
  return parts.join(', ') + '.';
}

function Setup() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: 24, justifyContent: 'center' }}>
      <Prompt>hello</Prompt>
      <Text style={[s.question, { fontSize: 22, marginTop: 16 }]}>Dos, in your pocket.</Text>
      <Text style={[s.body, { fontSize: 15, marginTop: 10 }]}>
        Answer Dos's questions, see how each world is doing, and drop notes from your phone. It reads the same Trello boards as Dos Live on your PC, so the PC
        doesn&apos;t need to be on.
      </Text>
      <Link href="/settings" asChild>
        <Pressable style={({ pressed }) => [s.btn, { backgroundColor: C.green, borderColor: C.green, marginTop: 24, flex: 0, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[s.btnText, { color: C.bg }]}>Connect Trello</Text>
        </Pressable>
      </Link>
    </View>
  );
}
