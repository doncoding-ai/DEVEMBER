import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { dayWord, shortTitle, type ItemBrief } from '@/dos/core';
import { useDos } from '@/dos/store';
import { countsLine, Dot, Empty, openUrl, s, Section } from '@/ui/parts';
import { C, STATE_COLOR, STATE_WORD } from '@/ui/theme';

const FLAG_COLOR: Record<string, string> = { overdue: C.red, 'due-soon': C.amber, flagged: C.amber, stale: C.faint, 'on-hold': C.dim };

export default function World() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { snapshot, config } = useDos();
  const world = snapshot?.worlds.find((w) => w.id === id);
  if (!world) return <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}><Empty>World not found.</Empty></View>;
  const discreet = config.discreetWork && world.id === 'work';

  const groups: [string, ItemBrief[]][] = [
    ['In progress', world.items.filter((i) => i.stage === 'doing')],
    ['To do', world.items.filter((i) => i.stage === 'todo' || i.stage === 'other')],
    ['On hold', world.items.filter((i) => i.stage === 'hold')],
  ];

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: world.name }} />
      <View style={s.row}>
        <Dot color={world.color} label={world.short} />
        <Text style={[s.state, { color: STATE_COLOR[world.state], fontSize: 13 }]}>{STATE_WORD[world.state]}</Text>
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
                <Pressable key={it.cardId} onPress={() => openUrl(it.url)} style={({ pressed }) => [s.ping, pressed && { backgroundColor: C.panel2 }]}>
                  <Text style={s.kind}>{shortTitle(it.name) || it.name}</Text>
                  <View style={[s.row, { marginTop: 4 }]}>
                    {it.due ? <Text style={s.meta}>due {dayWord(it.due, new Date())}</Text> : null}
                    {it.flags.map((f) => (
                      <Text key={f} style={[s.meta, { color: FLAG_COLOR[f] ?? C.dim }]}>#{f}</Text>
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
