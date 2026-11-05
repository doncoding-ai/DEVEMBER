import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native';

import { useDos } from '@/dos/store';
import { Btn, makeStyles, Prompt, tap } from '@/ui/parts';
import { useStyles, useTheme } from '@/ui/theme';

const QUICK = ['buy cement for Matuu', 'call the vet about the goats', 'check rent receipt', 'idea for Boom: '];

export default function Note() {
  const { addNote, snapshot } = useDos();
  const t = useTheme();
  const s = useStyles(makeStyles);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async () => {
    if (!text.trim()) return;
    tap();
    setBusy(true);
    setMsg(null);
    try {
      await addNote(text);
      setMsg({ ok: true, text: `Added "📝 ${text.trim()}" to the top of To do.` });
      setText('');
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {t.look === 'terminal' ? <Prompt>note …</Prompt> : <Text style={[s.question, { marginTop: 0, fontSize: 20 }]}>Dos, note …</Text>}
        <Text style={[s.body, { marginTop: 6 }]}>The note lands on the Dos board for your next scheduled task to pick up.</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="buy cement for Matuu"
          placeholderTextColor={t.faint}
          multiline
          maxLength={190}
          style={[s.input, { marginTop: 16, minHeight: 96, textAlignVertical: 'top', fontSize: 16, fontFamily: t.look === 'terminal' ? t.font.mono : t.font.ui }]}
          onSubmitEditing={send}
          submitBehavior="submit"
          returnKeyType="send"
        />
        <Btn label={busy ? 'Adding…' : 'Drop note'} hint="⏎" disabled={!text.trim() || !snapshot} busy={busy} onPress={send} style={{ marginTop: 12 }} />
        {msg ? <Text style={[s.body, { color: msg.ok ? t.green : t.red, marginTop: 12 }]}>{msg.text}</Text> : null}

        <Text style={[s.sectionTitle, { marginTop: 28 }]}>{t.sectionStyle === 'comment' ? '# quick start' : 'Quick start'}</Text>
        {QUICK.map((q) => (
          <Pressable
            key={q}
            onPress={() => setText(q)}
            style={({ pressed }) => [{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: Math.min(t.radius, 12), borderWidth: 1, borderColor: t.line, marginBottom: 8 }, pressed && { backgroundColor: t.panel2 }]}>
            <Text style={{ color: t.dim, fontFamily: t.font.mono, fontSize: 13 }}>📝 {q}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
