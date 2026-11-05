import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';

import { useDos } from '@/dos/store';
import { OrbRing } from '@/ui/faces';
import { Empty, makeStyles, Prompt, WorldPill } from '@/ui/parts';
import { useStyles, useTheme } from '@/ui/theme';

export default function Worlds() {
  const { snapshot, loading, refresh, config } = useDos();
  const t = useTheme();
  const s = useStyles(makeStyles);
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={t.green} />}>
      {t.look === 'terminal' ? <Prompt>worlds</Prompt> : null}
      {t.look === 'presence' && snapshot ? (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <OrbRing worlds={snapshot.worlds} tone={snapshot.asks.length ? 'amber' : 'green'} size={180} />
        </View>
      ) : null}
      <View style={{ marginTop: t.look === 'terminal' ? 12 : 0 }}>
        {snapshot ? (
          snapshot.worlds.map((w) => (
            <WorldPill key={w.id} world={w} discreet={config.discreetWork && w.id === 'work'} onPress={() => router.push(`/world/${w.id}`)} />
          ))
        ) : (
          <Empty>No board data yet.</Empty>
        )}
      </View>
    </ScrollView>
  );
}
