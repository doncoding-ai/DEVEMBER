import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { dayWord, shortTitle, type ItemBrief } from '@/dos/core';
import { useDos } from '@/dos/store';
import { countsLine, Dot, Empty, makeStyles, openUrl, Section } from '@/ui/parts';
import { STATE_WORD, stateColor, useStyles, useTheme } from '@/ui/theme';

export default function World() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { snapshot, config } = useDos();
  const t = useTheme();
  const s = useStyles(makeStyles);
  const world = snapshot?.worlds.find((w) => w.id === id);
  if (!world) {
    return (
      <View style={[s.screen, { padding: 16 }]}>
        <Empty>World not found.</Empty>
      </View>
    );
  }
  const discreet = config.discreetWork && world.id === 'work';
  const flagColor: Record<string, string> = { overdue: t.red, 'due-soon': t.amber, flagged: t.amber, stale: t.faint, 'on-hold': t.dim };

  const groups: [string, ItemBrief[]][] = [
    ['In progress', world.items.filter((i) => i.stage === 'doing')],
    ['To do', world.items.filter((i) => i.stage === 'todo' || i.stage === 'other')],
    ['On hold', world.items.filter((i) => i.stage === 'hold')],
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: t.look === 'terminal' ? `world ${world.id}` : world.name }} />
      <View style={s.row}>
        <Dot color={world.color} label={world.short} />
        <Text style={[s.state, { color: stateColor(t, world.state), fontSize: 13 }]}>{STATE_WORD[world.state]}</Text>
      </View>
      <Text style={[s.question, { fontSize: 20 }]}>{discreet ? countsLine(world) : world.headline}</Text>
      <Text style={s.counts}>
        {world.open} open · {world.doing} doing · {world.todo} to do · {world.hold} on hold{world.stale ? ` · ${world.stale} gone quiet` : ''}
      </Text>

      {discreet ? (
        <Section title="Discreet">
          <Empty>Work shows counts only. Turn off &quot;Discreet Work&quot; in Settings to see titles on this phone.</Empty>
        </Section>
      ) : (
        groups.map(([title, items]) =>
          items.length ? (
            <Section key={title} title={`${title} · ${items.length}`}>
              {items.map((it) => (
                <Pressable key={it.cardId} onPress={() => openUrl(it.url)} style={({ pressed }) => [s.ping, pressed && { backgroundColor: t.panel2 }]}>
                  <Text style={s.kind}>{shortTitle(it.name) || it.name}</Text>
                  <View style={[s.row, { marginTop: 4 }]}>
                    {it.due ? <Text style={s.meta}>due {dayWord(it.due, new Date())}</Text> : null}
                    {it.flags.map((f) => (
                      <Text key={f} style={[s.meta, { color: flagColor[f] ?? t.dim }]}>#{f}</Text>
                    ))}
                    <Text style={s.meta}>{it.board}</Text>
                  </View>
                </Pressable>
              ))}
            </Section>
          ) : null,
        )
      )}
    </ScrollView>
  );
}
