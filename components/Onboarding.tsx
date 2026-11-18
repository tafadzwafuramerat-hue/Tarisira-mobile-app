import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LocalizedText as Text } from './LocalizedText';
import { AppIcon } from './AppIcon';
import { SERIF } from '../constants/theme';
import { ShopIllustration, ChartsIllustration, GrowthIllustration } from './OnboardingArt';

const GREEN = '#064E3B';
const AMBER = '#F5A000';
const WHITE = '#FFFFFF';
const INK = '#14231C';
const MUTED = '#6B7F76';

type Slide = {
  key: string;
  heading: string;
  description: string;
  art: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    heading: 'Manage Your Business with Ease',
    description: 'Track sales, manage stock and keep your business records all in one place.',
    art: <ShopIllustration size={260} />,
  },
  {
    key: 'numbers',
    heading: 'Know Your Numbers',
    description: 'Monitor your daily sales, track stock levels and keep customer debts organised without the paperwork.',
    art: <ChartsIllustration size={260} />,
  },
  {
    key: 'grow',
    heading: 'Your Business, Your Control',
    description: 'Get useful business reports, payment reminders and insights to help your business grow.',
    art: <GrowthIllustration size={260} />,
  },
];

export function Onboarding({ onSkip, onGetStarted }: { onSkip: () => void; onGetStarted: () => void }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const lastIndex = SLIDES.length - 1;

  const goTo = useCallback((next: number) => {
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  }, []);

  const onMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next >= 0 && next < SLIDES.length) setIndex(next);
  }, [width]);

  const onNext = () => {
    if (index < lastIndex) goTo(index + 1);
    else onGetStarted();
  };

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Slide>) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.artWrap}>{item.art}</View>
      <Text style={styles.heading}>{item.heading}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  ), [width]);

  return (
    <View style={[styles.root, { backgroundColor: WHITE }]}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.skip} onPress={onSkip} hitSlop={10}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <FlatList
          ref={listRef}
          data={SLIDES}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          style={{ flexGrow: 0 }}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <View
                key={s.key}
                style={[styles.dot, i === index && styles.dotActive]}
              />
            ))}
          </View>
          <Pressable style={styles.next} onPress={onNext}>
            <Text style={styles.nextText}>{index === lastIndex ? 'Get Started' : 'Next'}</Text>
            <AppIcon name="arrow-right" size={20} color={WHITE} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  skip: { position: 'absolute', top: 12, right: 20, zIndex: 2, paddingHorizontal: 12, paddingVertical: 6 },
  skipText: { color: MUTED, fontSize: 15, fontWeight: '600' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingTop: 24, paddingBottom: 16 },
  artWrap: { marginBottom: 28, alignItems: 'center', justifyContent: 'center' },
  heading: { fontFamily: SERIF, fontSize: 28, fontWeight: '800', color: GREEN, textAlign: 'center', marginBottom: 14 },
  description: { fontSize: 16, lineHeight: 24, color: INK, textAlign: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 12, paddingTop: 8 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D8E4DE' },
  dotActive: { backgroundColor: AMBER, width: 22 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: GREEN, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 16 },
  nextText: { color: WHITE, fontWeight: '800', fontSize: 16 },
});