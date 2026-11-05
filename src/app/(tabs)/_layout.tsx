import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useDos } from '@/dos/store';
import { FloatingOrb } from '@/ui/faces';
import { useTheme } from '@/ui/theme';

export default function TabLayout() {
  const { snapshot, configured } = useDos();
  const t = useTheme();
  const asks = snapshot?.asks.length ?? 0;
  const term = t.look === 'terminal';
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          headerTitleStyle: { fontFamily: term ? t.font.monoBold : t.font.uiBold, fontSize: term ? 16 : 20 },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: t.bg },
          tabBarStyle: { backgroundColor: term ? t.bg : t.panel, borderTopColor: t.line },
          tabBarLabelStyle: { fontFamily: term ? t.font.mono : t.font.uiMedium },
          tabBarActiveTintColor: t.green,
          tabBarInactiveTintColor: t.faint,
          tabBarBadgeStyle: { backgroundColor: t.look === 'presence' ? t.amber : t.red, color: t.look === 'presence' ? '#1d1000' : '#fff' },
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable hitSlop={12} style={{ marginRight: 16 }} accessibilityLabel="Settings">
                <Ionicons name="settings-outline" size={22} color={t.dim} />
              </Pressable>
            </Link>
          ),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: term ? 'now' : 'Now',
            headerTitle: term ? 'dos' : 'Dos',
            tabBarBadge: asks || undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name={term ? 'terminal-outline' : 'pulse'} color={color as string} size={size} />,
          }}
        />
        <Tabs.Screen
          name="worlds"
          options={{ title: term ? 'worlds' : 'Worlds', tabBarIcon: ({ color, size }) => <Ionicons name="planet-outline" color={color as string} size={size} /> }}
        />
        <Tabs.Screen
          name="note"
          options={{ title: term ? 'note' : 'Note', tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" color={color as string} size={size} /> }}
        />
      </Tabs>
      {t.look === 'bubble' && configured ? <FloatingOrb asks={asks} /> : null}
    </View>
  );
}
