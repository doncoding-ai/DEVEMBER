import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { useDos } from '@/dos/store';
import { Prompt, s, tap } from '@/ui/parts';
import { C, mono } from '@/ui/theme';

const QUICK = ['buy cement for Matuu', 'call the vet about the goats', 'check rent receipt', 'idea for Boom: '];

export default function Note() {
  const { addNote, snapshot } = useDos();
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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Prompt>note …</Prompt>
        <Text style={[s.body, { marginTop: 6 }]}>Same as saying &quot;Dos, note …&quot;. The note lands on the Dos board for your next scheduled task to pick up.</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="buy cement for Matuu"
          placeholderTextColor={C.faint}
          multiline
          maxLength={190}
          style={st.input}
          onSubmitEditing={send}
          submitBehavior="submit"
          returnKeyType="send"
        />
        <Pressable
          disabled={busy || !text.trim() || !snapshot}
          onPress={send}
          style={({ pressed }) => [s.btn, { flex: 0, backgroundColor: C.green, borderColor: C.green, marginTop: 12, opacity: busy || !text.trim() ? 0.4 : pressed ? 0.7 : 1 }]}>
          <Text style={[s.btnText, { color: C.bg }]}>{busy ? 'Adding…' : 'Drop note'}</Text>
        </Pressable>
        {msg ? <Text style={[s.body, { color: msg.ok ? C.green : C.red, marginTop: 12 }]}>{msg.text}</Text> : null}

        <Text style={[s.sectionTitle, { marginTop: 28, marginBottom: 10 }]}>Quick start</Text>
        {QUICK.map((q) => (
          <Pressable key={q} onPress={() => setText(q)} style={({ pressed }) => [st.chip, pressed && { backgroundColor: C.panel2 }]}>
            <Text style={st.chipText}>📝 {q}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  input: {
    marginTop: 16, minHeight: 96, backgroundColor: C.panel, color: C.text, borderRadius: 12, padding: 14,
    fontSize: 16, textAlignVertical: 'top', borderWidth: 1, borderColor: C.line,
  },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: C.line, marginBottom: 8 },
  chipText: { color: C.dim, fontFamily: mono, fontSize: 13 },
});
