import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import { useDos } from '@/dos/store';
import { C } from '@/ui/theme';

export default function TabLayout() {
  const { snapshot } = useDos();
  const asks = snapshot?.asks.length ?? 0;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: C.bg },
        headerTintColor: C.text,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: C.bg },
        tabBarStyle: { backgroundColor: C.panel, borderTopColor: C.line },
        tabBarActiveTintColor: C.green,
        tabBarInactiveTintColor: C.faint,
        headerRight: () => (
          <Link href="/settings" asChild>
            <Pressable hitSlop={12} style={{ marginRight: 16 }} accessibilityLabel="Settings">
              <Ionicons name="settings-outline" size={22} color={C.dim} />
            </Pressable>
          </Link>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Now',
          headerTitle: 'Dos',
          tabBarBadge: asks || undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="pulse" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="worlds"
        options={{ title: 'Worlds', tabBarIcon: ({ color, size }) => <Ionicons name="planet-outline" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="note"
        options={{ title: 'Note', tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
