// The top of the Now screen, in each look: the notch with Dos's eyes, the
// shell prompt, or the orb ringed by your worlds.

import { Text, View } from 'react-native';

import type { Snapshot } from '@/dos/core';
import { Cursor, Eyes, OrbRing, type Tone } from './faces';
import { useTheme } from './theme';

function greeting(now = new Date()): string {
  // East Africa Time, like the rest of Dos.
  const h = (now.getUTCHours() + 3) % 24;
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function Hero({ snapshot, line, tone }: { snapshot: Snapshot | null; line: string; tone: Tone }) {
  const t = useTheme();

  if (t.look === 'terminal') {
    return (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: t.green, fontFamily: t.font.monoBold, fontSize: 15 }}>dos:~$ </Text>
          <Text style={{ color: t.text, fontFamily: t.font.mono, fontSize: 15 }}>status</Text>
        </View>
        <Text style={{ color: tone === 'amber' ? t.amber : t.dim, fontFamily: t.font.mono, fontSize: 13, lineHeight: 20, marginTop: 6 }}>{line}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Text style={{ color: t.green, fontFamily: t.font.monoBold, fontSize: 15 }}>dos:~$</Text>
          <Cursor />
        </View>
      </View>
    );
  }

  if (t.look === 'presence') {
    return (
      <View style={{ alignItems: 'center', paddingTop: 4 }}>
        <OrbRing worlds={snapshot?.worlds ?? []} tone={tone} />
        <Text style={{ color: t.text, fontFamily: t.font.uiBold, fontSize: 24, letterSpacing: -0.4, marginTop: 6 }}>{greeting()}.</Text>
        <Text style={{ color: t.dim, fontFamily: t.font.ui, fontSize: 14, marginTop: 4, textAlign: 'center' }}>{line}</Text>
      </View>
    );
  }

  // liquid and bubble: the notch. Bubble's orb is out roaming, so the notch waits empty-eyed.
  const bubble = t.look === 'bubble';
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: bubble ? 18 : 8, paddingRight: 18, paddingVertical: 8,
          borderRadius: 999, backgroundColor: t.scheme === 'dark' ? '#000' : '#fff', maxWidth: '100%',
          borderWidth: 1, borderColor: t.line,
          boxShadow: `0 10px 30px ${t.shadow}`,
        }}>
        {bubble ? null : <Eyes size={30} tone={tone} />}
        <Text style={{ color: t.text, fontFamily: t.font.uiMedium, fontSize: 14, flexShrink: 1 }} numberOfLines={2}>{line}</Text>
      </View>
    </View>
  );
}
