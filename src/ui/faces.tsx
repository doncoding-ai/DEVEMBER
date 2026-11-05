// Dos's face in each look: the eyes capsule (liquid), the blinking cursor
// (terminal), the orb ringed by your worlds (presence) and the orb you can
// throw around the screen (bubble).

import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { WorldStatus } from '@/dos/core';
import { stateColor, useTheme } from './theme';

export type Tone = 'green' | 'amber' | 'quiet';

function useLoop(make: (v: Animated.Value) => Animated.CompositeAnimation, initial = 0) {
  const v = useRef(new Animated.Value(initial)).current;
  useEffect(() => {
    const anim = Animated.loop(make(v));
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

/** Liquid: a capsule with two eyes that blink now and then. */
export function Eyes({ size = 34, tone = 'green' }: { size?: number; tone?: Tone }) {
  const t = useTheme();
  const blink = useLoop((v) =>
    Animated.sequence([
      Animated.delay(3600),
      Animated.timing(v, { toValue: 0.12, duration: 70, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]), 1);
  const eye = tone === 'amber' ? (t.scheme === 'dark' ? '#ffb547' : '#d98a12') : tone === 'quiet' ? t.parked : t.eye;
  const tint = tone === 'amber' ? 'rgba(255,181,71,0.12)' : 'transparent';
  const w = size * 1.5;
  return (
    <View style={{ width: w, height: size, borderRadius: size / 2, backgroundColor: t.faceBg, borderWidth: 1, borderColor: t.faceRing, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: size * 0.26 }}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: tint }]} />
      {[0, 1].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: size * 0.16, height: size * 0.36, borderRadius: size, backgroundColor: eye,
            transform: [{ scaleY: blink }],
            boxShadow: t.scheme === 'dark' ? `0 0 ${size * 0.25}px ${eye}` : undefined,
          }}
        />
      ))}
    </View>
  );
}

const ORB = {
  green: 'radial-gradient(circle at 34% 30%, #dcffec 0%, #74f1ac 20%, #24b86c 52%, #0a5a35 80%, #03200f 100%)',
  amber: 'radial-gradient(circle at 34% 30%, #fff3dc 0%, #ffd27a 20%, #e89a1c 52%, #7a4a06 80%, #2a1700 100%)',
  quiet: 'radial-gradient(circle at 34% 30%, #eef3f8 0%, #b7c4d0 20%, #6e8193 52%, #33414e 80%, #11181f 100%)',
};
const GLOW = { green: '61,220,132', amber: '255,181,71', quiet: '110,129,147' };

/** Presence and bubble: the glossy orb, breathing. */
export function Orb({ size = 64, tone = 'green' }: { size?: number; tone?: Tone }) {
  const t = useTheme();
  const breathe = useLoop((v) =>
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const glow = t.scheme === 'dark' ? 1 : 0.55;
  return (
    <Animated.View
      style={{
        width: size, height: size, borderRadius: size / 2, transform: [{ scale }],
        backgroundImage: ORB[tone],
        boxShadow: `0 0 ${size * 0.34}px rgba(${GLOW[tone]},${0.48 * glow}), 0 0 ${size * 0.9}px rgba(${GLOW[tone]},${0.2 * glow})`,
      }}>
      {/* the specular highlight */}
      <View style={{ position: 'absolute', left: size * 0.22, top: size * 0.16, width: size * 0.3, height: size * 0.18, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.55)', transform: [{ rotate: '-24deg' }] }} />
    </Animated.View>
  );
}

/** Presence: the orb, ringed by one dot per world, coloured by how the world is doing. */
export function OrbRing({ worlds, tone, size = 210 }: { worlds: WorldStatus[]; tone: Tone; size?: number }) {
  const t = useTheme();
  const orb = size * 0.42;
  const r = size / 2 - 18;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: r * 2, height: r * 2, borderRadius: r, borderWidth: 1, borderColor: t.line, borderStyle: 'dashed' }} />
      <Orb size={orb} tone={tone} />
      {worlds.map((w, i) => {
        const a = (i / worlds.length) * Math.PI * 2 - Math.PI / 2;
        const sc = stateColor(t, w.state);
        const hot = w.state === 'alert' || w.state === 'attention';
        return (
          <View
            key={w.id}
            accessibilityLabel={`${w.name}: ${w.headline}`}
            style={{
              position: 'absolute', left: size / 2 + r * Math.cos(a) - 15, top: size / 2 + r * Math.sin(a) - 15,
              width: 30, height: 30, borderRadius: 15, backgroundColor: w.color, alignItems: 'center', justifyContent: 'center',
              borderWidth: hot ? 2.5 : 0, borderColor: sc, opacity: w.state === 'empty' ? 0.45 : 1,
              boxShadow: hot ? `0 0 10px ${sc}` : undefined,
            }}>
            <Text style={{ color: '#04140b', fontFamily: t.font.uiBold, fontSize: 12 }}>{w.short}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** Terminal: the block cursor. */
export function Cursor() {
  const t = useTheme();
  const v = useLoop((a) =>
    Animated.sequence([
      Animated.timing(a, { toValue: 0, duration: 0, delay: 530, useNativeDriver: true }),
      Animated.timing(a, { toValue: 1, duration: 0, delay: 530, useNativeDriver: true }),
    ]), 1);
  return <Animated.View style={{ width: 9, height: 17, backgroundColor: t.green, opacity: v, marginLeft: 2 }} />;
}

/**
 * Bubble: the orb floats over every tab. Drag it, throw it, it settles on the
 * nearest side. Tap it to jump to what's waiting.
 */
export function FloatingOrb({ asks }: { asks: number }) {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const SIZE = 58;
  const bounds = useRef({ minX: 12, maxX: width - SIZE - 12, minY: insets.top + 60, maxY: height - insets.bottom - SIZE - 90 });
  bounds.current = { minX: 12, maxX: width - SIZE - 12, minY: insets.top + 60, maxY: height - insets.bottom - SIZE - 90 };
  // It starts tucked in the bottom-right corner, above the tab bar, out of the way of buttons.
  const start = { x: bounds.current.maxX, y: bounds.current.maxY };
  const pos = useRef(new Animated.ValueXY(start)).current;
  const last = useRef(start);
  const bob = useLoop((v) =>
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(v, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  useEffect(() => {
    const id = pos.addListener((v) => (last.current = v));
    return () => pos.removeListener(id);
  }, [pos]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pos.stopAnimation();
        pos.setOffset(last.current);
        pos.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        pos.flattenOffset();
        if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) {
          router.navigate('/');
          return;
        }
        const b = bounds.current;
        // Where the throw would carry it, then the nearest side.
        const projX = last.current.x + g.vx * 220;
        const projY = Math.min(b.maxY, Math.max(b.minY, last.current.y + g.vy * 220));
        const x = projX + SIZE / 2 < (b.minX + b.maxX + SIZE) / 2 ? b.minX : b.maxX;
        Animated.spring(pos, { toValue: { x, y: projY }, velocity: { x: g.vx, y: g.vy }, friction: 6, tension: 50, useNativeDriver: false }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...pan.panHandlers}
      accessibilityRole="button"
      accessibilityLabel={asks ? `Dos: ${asks} questions waiting` : 'Dos'}
      style={{ position: 'absolute', zIndex: 50, left: 0, top: 0, transform: [{ translateX: pos.x }, { translateY: Animated.add(pos.y, bobY) }] }}>
      <Orb size={SIZE} tone={asks ? 'amber' : 'green'} />
      {asks > 0 && (
        <View style={{ position: 'absolute', right: -4, top: -4, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: t.red, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.bg }}>
          <Text style={{ color: '#fff', fontFamily: t.font.uiBold, fontSize: 11 }}>{asks}</Text>
        </View>
      )}
    </Animated.View>
  );
}

