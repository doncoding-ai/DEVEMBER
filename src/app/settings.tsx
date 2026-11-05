import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { parseShortLink, type BoardKey } from '@/dos/core';
import { useDos, type Config } from '@/dos/store';
import * as trello from '@/dos/trello';
import { s } from '@/ui/parts';
import { C, mono } from '@/ui/theme';

export default function Settings() {
  const { config, setConfig, persistent } = useDos();
  const [draft, setDraft] = useState<Config>(config);
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(config), [config]);

  const tidy = (c: Config): Config => ({
    ...c,
    key: c.key.trim(),
    token: c.token.trim(),
    boards: Object.fromEntries(Object.entries(c.boards).map(([k, v]) => [k, parseShortLink(v) ?? v.trim()])) as Config['boards'],
  });

  const onTest = async () => {
    setTest(null);
    try {
      const me = await trello.me(tidy(draft));
      setTest({ ok: true, text: `Connected as ${me.fullName || me.username}.` });
    } catch (e) {
      setTest({ ok: false, text: (e as Error).message });
    }
  };

  const onSave = async () => {
    setSaving(true);
    await setConfig(tidy(draft));
    setSaving(false);
    router.back();
  };

  const board = (k: BoardKey, label: string) => (
    <Field label={label}>
      <TextInput
        value={draft.boards[k]}
        onChangeText={(v) => setDraft({ ...draft, boards: { ...draft.boards, [k]: v } })}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="short link or board URL"
        placeholderTextColor={C.faint}
        style={st.input}
      />
    </Field>
  );

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Text style={s.sectionTitle}>Trello</Text>
      <Text style={[s.body, { marginBottom: 12 }]}>
        Use the same Power-Up key and token as Dos Live (read and write). They are kept in this phone&apos;s secure storage and only ever sent to api.trello.com.
      </Text>
      {!persistent && <Text style={[s.err, { marginBottom: 12 }]}>On the web, these stay in memory and are forgotten when you close the tab.</Text>}
      <Field label="API key">
        <TextInput value={draft.key} onChangeText={(v) => setDraft({ ...draft, key: v })} autoCapitalize="none" autoCorrect={false} style={st.input} />
      </Field>
      <Field label="Token">
        <TextInput value={draft.token} onChangeText={(v) => setDraft({ ...draft, token: v })} autoCapitalize="none" autoCorrect={false} secureTextEntry style={st.input} />
      </Field>
      <Text style={st.link} onPress={() => Linking.openURL('https://trello.com/power-ups/admin')}>
        Get a key at trello.com/power-ups/admin →
      </Text>
      <View style={[s.row, { marginTop: 12 }]}>
        <Pressable onPress={onTest} style={({ pressed }) => [s.btn, { borderColor: C.blue, opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[s.btnText, { color: C.blue }]}>Test connection</Text>
        </Pressable>
      </View>
      {test && <Text style={[s.body, { color: test.ok ? C.green : C.red }]}>{test.text}</Text>}

      <Text style={[s.sectionTitle, { marginTop: 28 }]}>Boards</Text>
      {board('dos', 'Dos board')}
      {board('don', 'Don board')}
      {board('boom', 'Boom board')}

      <Text style={[s.sectionTitle, { marginTop: 28 }]}>Privacy</Text>
      <View style={[s.row, { justifyContent: 'space-between', marginTop: 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.kind}>Discreet Work</Text>
          <Text style={s.body}>Work shows counts only, never card titles.</Text>
        </View>
        <Switch value={draft.discreetWork} onValueChange={(v) => setDraft({ ...draft, discreetWork: v })} trackColor={{ true: C.green, false: C.line }} />
      </View>

      <Pressable onPress={onSave} disabled={saving} style={({ pressed }) => [s.btn, { flex: 0, backgroundColor: C.green, borderColor: C.green, marginTop: 32, opacity: pressed || saving ? 0.7 : 1 }]}>
        <Text style={[s.btnText, { color: C.bg }]}>{saving ? 'Saving…' : 'Save'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={[s.meta, { marginBottom: 6 }]}>{label}</Text>
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  input: { backgroundColor: C.panel, color: C.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, fontFamily: mono, borderWidth: 1, borderColor: C.line },
  link: { color: C.blue, fontSize: 13, marginTop: 10 },
});
