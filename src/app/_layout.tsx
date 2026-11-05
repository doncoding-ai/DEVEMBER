import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DosProvider } from '@/dos/store';
import { C } from '@/ui/theme';

export default function RootLayout() {
  return (
    <DosProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: C.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
        <Stack.Screen name="world/[id]" options={{ title: '' }} />
      </Stack>
    </DosProvider>
  );
}
