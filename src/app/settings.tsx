import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { parseShortLink, type BoardKey } from '@/dos/core';
import { useDos, type Config } from '@/dos/store';
import * as trello from '@/dos/trello';
import { Cursor, Eyes, Orb } from '@/ui/faces';
import { Btn, makeStyles } from '@/ui/parts';
import { LOOKS, PreviewTheme, useStyles, useTheme, type Look, type ThemePref } from '@/ui/theme';

const THEMES: { id: ThemePref; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'system', label: 'Match phone' },
];

export default function Settings() {
  const { config, setConfig, setAppearance, persistent } = useDos();
  const t = useTheme();
  const s = useStyles(makeStyles);
  const [draft, setDraft] = useState<Config>(config);
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

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
    // Look and theme were already applied live; keep them.
    await setConfig({ ...tidy(draft), look: config.look, theme: config.theme });
    setSaving(false);
    router.back();
  };

  const field = (label: string, value: string, onChange: (v: string) => void, secret = false, placeholder?: string) => (
    <View style={{ marginTop: 10 }}>
      <Text style={[s.meta, { marginBottom: 6 }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} autoCapitalize="none" autoCorrect={false} secureTextEntry={secret} placeholder={placeholder} placeholderTextColor={t.faint} style={s.input} />
    </View>
  );
  const board = (k: BoardKey, label: string) =>
    field(label, draft.boards[k], (v) => setDraft({ ...draft, boards: { ...draft.boards, [k]: v } }), false, 'short link or board URL');
  const heading = (title: string, first = false) => (
    <Text style={[s.sectionTitle, { marginTop: first ? 0 : 30 }]}>{t.sectionStyle === 'comment' ? `# ${title.toLowerCase()}` : title}</Text>
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 16, paddingBottom: 56 }} keyboardShouldPersistTaps="handled">
      {heading('Look', true)}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {LOOKS.map((l) => (
          <LookCard key={l.id} look={l.id} name={l.name} blurb={l.blurb} on={config.look === l.id} onPress={() => setAppearance({ look: l.id })} />
        ))}
      </View>

      {heading('Theme')}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {THEMES.map((th) => {
          const on = config.theme === th.id;
          return (
            <Pressable
              key={th.id}
              onPress={() => setAppearance({ theme: th.id })}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={{ flex: 1, minHeight: 42, borderRadius: t.btnRadius, borderWidth: 1.5, borderColor: on ? t.green : t.line, backgroundColor: on ? t.panel2 : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: on ? t.text : t.dim, fontFamily: t.font.uiMedium, fontSize: 14 }}>{th.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {heading('Trello')}
      <Text style={[s.body, { marginBottom: 4 }]}>
        Use the same Power-Up key and token as Dos Live (read and write). They are kept in this phone&apos;s secure storage and only ever sent to api.trello.com.
      </Text>
      {!persistent && <Text style={s.err}>On the web, these stay in memory and are forgotten when you close the tab.</Text>}
      {field('API key', draft.key, (v) => setDraft({ ...draft, key: v }))}
      {field('Token', draft.token, (v) => setDraft({ ...draft, token: v }), true)}
      <Text style={{ color: t.blue, fontSize: 13, marginTop: 10, fontFamily: t.font.ui }} onPress={() => Linking.openURL('https://trello.com/power-ups/admin')}>
        Get a key at trello.com/power-ups/admin →
      </Text>
      <Btn label="Test connection" kind="link" onPress={onTest} style={{ marginTop: 12 }} />
      {test && <Text style={[s.body, { color: test.ok ? t.green : t.red }]}>{test.text}</Text>}

      {heading('Boards')}
      {board('dos', 'Dos board')}
      {board('don', 'Don board')}
      {board('boom', 'Boom board')}

      {heading('Privacy')}
      <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'nowrap' }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.kind}>Discreet Work</Text>
          <Text style={s.body}>Work shows counts only, never card titles.</Text>
        </View>
        <Switch value={draft.discreetWork} onValueChange={(v) => setDraft({ ...draft, discreetWork: v })} trackColor={{ true: t.green, false: t.line }} />
      </View>

      <Btn label={saving ? 'Saving…' : 'Save'} busy={saving} onPress={onSave} style={{ marginTop: 32 }} />
    </ScrollView>
  );
}

/** A small live sample of a look, drawn in that look's own colours and fonts. */
function LookCard({ look, name, blurb, on, onPress }: { look: Look; name: string; blurb: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${name}. ${blurb}`}
      style={({ pressed }) => ({ width: '48%', flexGrow: 1, borderRadius: 16, borderWidth: 2, borderColor: on ? t.green : t.line, padding: 4, opacity: pressed ? 0.8 : 1 })}>
      <PreviewTheme look={look} scheme={t.scheme}>
        <Sample />
      </PreviewTheme>
      <Text style={{ color: t.text, fontFamily: t.font.uiMedium, fontSize: 14, marginTop: 8, marginHorizontal: 6 }}>{name}</Text>
      <Text style={{ color: t.faint, fontFamily: t.font.ui, fontSize: 12, marginHorizontal: 6, marginBottom: 6, lineHeight: 16 }}>{blurb}</Text>
    </Pressable>
  );
}

function Sample() {
  const t = useTheme();
  const term = t.look === 'terminal';
  const face =
    t.look === 'liquid' ? <Eyes size={20} tone="amber" /> : term ? null : <Orb size={t.look === 'presence' ? 30 : 22} tone="amber" />;
  return (
    <View style={{ backgroundColor: t.bg, borderRadius: 12, padding: 10, height: 112, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: t.look === 'presence' ? 'center' : 'flex-start' }}>
        {term ? (
          <>
            <Text style={{ color: t.green, fontFamily: t.font.monoBold, fontSize: 11 }}>dos:~$</Text>
            <Cursor />
          </>
        ) : (
          face
        )}
      </View>
      <View
        style={{
          marginTop: 8, padding: 8, borderRadius: Math.min(t.radius, 12), backgroundColor: term ? 'transparent' : t.panel,
          borderWidth: term || t.look === 'bubble' ? 1 : 0, borderColor: t.amber, borderLeftWidth: term || t.look === 'bubble' ? 1 : 3,
          borderLeftColor: t.look === 'liquid' || t.look === 'presence' ? '#3ddc84' : t.amber,
          borderBottomLeftRadius: t.look === 'bubble' ? 3 : Math.min(t.radius, 12),
        }}>
        <Text style={{ color: t.text, fontFamily: term ? t.font.mono : t.font.uiBold, fontSize: 11 }} numberOfLines={1}>Pay the landlord now?</Text>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
          <View style={{ flex: 1, height: 16, borderRadius: t.btnRadius, backgroundColor: t.askGoBg, borderWidth: 1, borderColor: term ? t.goLine : t.askGoBg }} />
          <View style={{ flex: 1, height: 16, borderRadius: t.btnRadius, borderWidth: 1, borderColor: term ? t.line : t.amber }} />
          <View style={{ flex: 1, height: 16, borderRadius: t.btnRadius, borderWidth: 1, borderColor: t.line }} />
        </View>
      </View>
    </View>
  );
}
