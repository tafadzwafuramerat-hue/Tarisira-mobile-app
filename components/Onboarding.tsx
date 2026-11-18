import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LocalizedText as Text } from './LocalizedText';
import { AppIcon } from './AppIcon';
import { OnboardingArt, OnboardingArtType } from './OnboardingArt';
import { SERIF } from '../constants/theme';
import { errorMessage } from '../utils/errors';

const GREEN = '#064E3B';
const AMBER = '#F5A000';
const CREAM = '#FFF9F0';
const WHITE = '#FFFFFF';
const INK = '#24352E';
const MUTED = '#748178';

type Slide = {
  key: string;
  heading: string;
  description: string;
  art: OnboardingArtType;
};

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    heading: 'Less paperwork. More time for your customers.',
    description: 'Running a shop is already a lot of work. Tarisira helps you keep your business organised without the piles of paperwork.',
    art: 'shop',
  },
  {
    key: 'records',
    heading: "Know what sold, what's left, and who still owes.",
    description: 'Record your daily sales, keep an eye on your stock and track customer debts without losing track of your money.',
    art: 'records',
  },
  {
    key: 'growth',
    heading: 'See how your business is doing.',
    description: 'Understand your sales, follow your progress and use simple reports to make better business decisions.',
    art: 'growth',
  },
];

export function Onboarding({
  onSkip,
  onGetStarted,
}: {
  onSkip: () => Promise<void>;
  onGetStarted: () => Promise<void>;
}) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const artSize = useMemo(() => Math.min(width - 36, Math.max(220, height * 0.39)), [height, width]);
  const lastIndex = SLIDES.length - 1;

  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= SLIDES.length) return;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  }, []);

  const onContinue = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      Alert.alert('Could not save your progress', errorMessage(error, 'Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const renderItem = useCallback(({ item, index: pageIndex }: ListRenderItemInfo<Slide>) => {
    const inputRange = [(pageIndex - 1) * width, pageIndex * width, (pageIndex + 1) * width];
    const artOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.55, 1, 0.55],
      extrapolate: 'clamp',
    });
    const artTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [12, 0, -12],
      extrapolate: 'clamp',
    });
    const artScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.96, 1, 0.96],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.page, { width }]}>
        <View style={styles.artSlot}>
          <Animated.View style={{ opacity: artOpacity, transform: [{ translateY: artTranslateY }, { scale: artScale }] }}>
            <OnboardingArt type={item.art} width={artSize} />
          </Animated.View>
        </View>
        <Text style={styles.heading}>{item.heading}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  }, [artSize, scrollX, width]);

  const handleNext = () => {
    if (index < lastIndex) goTo(index + 1);
    else void onContinue(onGetStarted);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Image
            source={require('../assets/tarisira-logo-primary.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Tarisira"
          />
          {index < lastIndex && (
            <Pressable
              onPress={() => void onContinue(onSkip)}
              disabled={busy}
              hitSlop={12}
              style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
            >
              <Text style={styles.skipText}>{busy ? 'Please wait…' : 'Skip'}</Text>
            </Pressable>
          )}
        </View>

        <Animated.FlatList
          ref={listRef}
          data={SLIDES}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) => {
            const next = Math.round(event.nativeEvent.contentOffset.x / width);
            if (next >= 0 && next < SLIDES.length) setIndex(next);
          }}
          getItemLayout={(_, pageIndex) => ({ length: width, offset: width * pageIndex, index: pageIndex })}
          style={styles.list}
        />

        <View style={styles.footer}>
          <View style={styles.pagination} accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
            {SLIDES.map((slide, dotIndex) => {
              const inputRange = [(dotIndex - 1) * width, dotIndex * width, (dotIndex + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });
              return (
                <Pressable
                  key={slide.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to page ${dotIndex + 1}`}
                  onPress={() => goTo(dotIndex)}
                  hitSlop={8}
                >
                  <Animated.View style={[styles.dot, { width: dotWidth }, dotIndex === index && styles.activeDot]} />
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={handleNext}
            style={({ pressed }) => [styles.next, pressed && styles.pressed, busy && styles.disabled]}
          >
            <Text style={styles.nextText}>{busy ? 'Please wait…' : index === lastIndex ? 'Get Started' : 'Next'}</Text>
            {!busy && <AppIcon name="arrow-right" size={20} color={WHITE} />}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  safe: { flex: 1 },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  logo: { width: 148, height: 34 },
  skip: { paddingVertical: 9, paddingHorizontal: 12, marginRight: -8 },
  skipText: { color: MUTED, fontSize: 14, fontWeight: '700' },
  list: { flex: 1 },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingTop: 4, paddingBottom: 12 },
  artSlot: { flex: 1, width: '100%', maxHeight: 360, minHeight: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heading: { width: '100%', maxWidth: 360, color: GREEN, fontFamily: SERIF, fontSize: 28, lineHeight: 34, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  description: { width: '100%', maxWidth: 360, color: INK, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 8, gap: 18 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, minHeight: 12 },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#D5D6CA' },
  activeDot: { backgroundColor: AMBER },
  next: { minHeight: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: GREEN, borderRadius: 18, paddingHorizontal: 24 },
  nextText: { color: WHITE, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.72 },
});
