import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';

import { useDos } from '@/dos/store';
import { Empty, Prompt, WorldPill } from '@/ui/parts';
import { C } from '@/ui/theme';

export default function Worlds() {
  const { snapshot, loading, refresh, config } = useDos();
  return (
    <ScrollView
      style={{ backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 2 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={C.green} />}>
      <Prompt>worlds</Prompt>
      <View style={{ marginTop: 14 }}>
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
