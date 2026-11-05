import { Geist_400Regular, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono';
import { IBMPlexSans_400Regular, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans';
import { JetBrainsMono_400Regular, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { DosProvider, useDos } from '@/dos/store';
import { ThemeProvider, useTheme } from '@/ui/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular, Geist_600SemiBold, Geist_700Bold,
    GeistMono_400Regular, GeistMono_600SemiBold,
    IBMPlexSans_400Regular, IBMPlexSans_600SemiBold, IBMPlexSans_700Bold,
    JetBrainsMono_400Regular, JetBrainsMono_600SemiBold,
    Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold,
  });
  return (
    <DosProvider>
      <Themed>{fontsLoaded || fontError ? <Nav /> : null}</Themed>
    </DosProvider>
  );
}

function Themed({ children }: { children: React.ReactNode }) {
  const { config } = useDos();
  return (
    <ThemeProvider look={config.look} pref={config.theme}>
      <Backdrop>{children}</Backdrop>
    </ThemeProvider>
  );
}

function Backdrop({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.bg }}>{children}</View>;
}

function Nav() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          headerTitleStyle: { fontFamily: t.font.uiMedium },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
        <Stack.Screen name="world/[id]" options={{ title: '' }} />
      </Stack>
    </>
  );
}
