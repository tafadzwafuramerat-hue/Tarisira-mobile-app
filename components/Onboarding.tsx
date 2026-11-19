import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
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
  eyebrow: string;
  heading: string;
  description: string;
  art: 'stock' | 'debt' | 'sales';
};

const SLIDES: Slide[] = [
  {
    key: 'stock',
    eyebrow: 'STOCK MANAGEMENT',
    heading: 'Keep stock under control',
    description: 'See what you have, what is selling and what needs restocking - all in one place.',
    art: 'stock',
  },
  {
    key: 'debt',
    eyebrow: 'DEBT TRACKING',
    heading: 'Know who owes you',
    description: 'Keep a clear record of customer balances and send a reminder when payment is due.',
    art: 'debt',
  },
  {
    key: 'sales',
    eyebrow: 'SALES & REPORTS',
    heading: 'Understand your sales',
    description: 'Check daily sales and simple reports to make better decisions for your business.',
    art: 'sales',
  },
];

export function Onboarding({
  onBack,
  onSkip,
  onGetStarted,
}: {
  onBack: () => void;
  onSkip: () => Promise<void>;
  onGetStarted: () => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const artSize = useMemo(() => Math.min(width - 48, 332), [width]);
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
            {item.art === 'stock' ? (
              <StockPreview width={artSize} />
            ) : item.art === 'debt' ? (
              <DebtPreview width={artSize} />
            ) : (
              <SalesPreview width={artSize} />
            )}
          </Animated.View>
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{item.eyebrow}</Text>
          <Text style={styles.heading}>{item.heading}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  }, [artSize, scrollX, width]);

  const handleNext = () => {
    if (index < lastIndex) goTo(index + 1);
    else void onContinue(onGetStarted);
  };

  const handleBack = () => {
    if (index > 0) {
      goTo(index - 1);
      return;
    }
    onBack();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            hitSlop={10}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <AppIcon name="chevron-left" size={24} color={GREEN} />
          </Pressable>
          <Text style={styles.logo}>TARISIRA</Text>
          {index < lastIndex ? (
            <Pressable
              onPress={() => void onContinue(onSkip)}
              disabled={busy}
              hitSlop={12}
              style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
            >
              <Text style={styles.skipText}>{busy ? 'Please wait…' : 'Skip'}</Text>
            </Pressable>
          ) : (
            <View style={styles.skipSpacer} />
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
          <View style={styles.footerStatus}>
            <Text style={styles.pageCount}>{index + 1} of {SLIDES.length}</Text>
            <View style={styles.pagination} accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
              {SLIDES.map((slide, dotIndex) => (
                <Pressable
                  key={slide.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to page ${dotIndex + 1}`}
                  onPress={() => goTo(dotIndex)}
                  hitSlop={8}
                >
                  <View style={[
                    styles.dot,
                    dotIndex === index && styles.activeDot,
                  ]} />
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={handleNext}
            style={({ pressed }) => [styles.next, pressed && styles.pressed, busy && styles.disabled]}
          >
            <Text style={styles.nextText}>{busy ? 'Please wait…' : index === lastIndex ? 'Set up my business' : 'Next'}</Text>
            {!busy && <AppIcon name="arrow-right" size={20} color={WHITE} />}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function StockPreview({ width }: { width: number }) {
  return (
    <View style={[preview.outerCard, { width }]}>
      <View style={preview.stockHeader}>
        <Text style={preview.stockTitle}>Stock</Text>
        <View style={preview.addButton}><Text style={preview.addText}>+ Add</Text></View>
      </View>
      <View style={preview.innerCard}>
        <View style={preview.alertBanner}><Text style={preview.alertText}>2 products are running low</Text></View>
        <View style={preview.productRow}>
          <View style={preview.iconBox}><AppIcon name="cube-outline" size={20} color={GREEN} /></View>
          <View style={preview.productInfo}><Text style={preview.productName}>Coca-Cola 500ml</Text><Text style={preview.productStock}>85 in stock</Text></View>
          <Text style={preview.price}>$1.00</Text>
        </View>
        <View style={preview.divider} />
        <View style={preview.productRow}>
          <View style={preview.iconBox}><AppIcon name="cube-outline" size={20} color={GREEN} /></View>
          <View style={preview.productInfo}><Text style={preview.productName}>Bread</Text><Text style={preview.productStock}>8 left</Text></View>
          <Text style={preview.price}>$1.20</Text>
        </View>
        <View style={preview.divider} />
        <View style={preview.productRow}>
          <View style={preview.iconBox}><AppIcon name="cube-outline" size={20} color={GREEN} /></View>
          <View style={preview.productInfo}><Text style={preview.productName}>Milk 1L</Text><Text style={[preview.productStock, { color: '#E5252A' }]}>5 left</Text></View>
          <Text style={preview.price}>$1.50</Text>
        </View>
      </View>
    </View>
  );
}

function DebtPreview({ width }: { width: number }) {
  return (
    <View style={[preview.outerCard, preview.debtCard, { width }]}>
      <View style={preview.innerCard}>
        <Text style={preview.debtLabel}>Total outstanding</Text>
        <Text style={preview.debtTotal}>$70.00</Text>
        <View style={preview.divider} />
        {[
          ['Peter Dube', 'Due tomorrow', '$35'],
          ['John Mayo', 'Due in 2 days', '$20'],
          ['Mary Chikwanda', 'Due in 5 days', '$15'],
        ].map(([name, due, amount]) => (
          <View key={name}>
            <View style={preview.debtRow}>
              <View style={preview.avatar}><AppIcon name="account-outline" size={18} color="#795343" /></View>
              <View style={preview.productInfo}><Text style={preview.productName}>{name}</Text><Text style={preview.dueText}>{due}</Text></View>
              <Text style={preview.amountText}>{amount}</Text>
            </View>
            <View style={preview.divider} />
          </View>
        ))}
        <View style={preview.reminderButton}><Text style={preview.reminderText}>Send payment reminder</Text></View>
      </View>
    </View>
  );
}

function SalesPreview({ width }: { width: number }) {
  const bars = [0.48, 0.65, 0.78, 0.46, 0.72, 0.82, 0.54];
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View style={[preview.outerCard, preview.salesCard, { width }]}>
      <View style={preview.innerCard}>
        <View style={preview.salesTop}>
          <View>
            <Text style={preview.salesLabel}>Today's sales</Text>
            <Text style={preview.salesTotal}>$125.00</Text>
          </View>
          <View style={preview.salesBadge}><Text style={preview.salesBadgeText}>15 sales</Text></View>
        </View>
        <View style={preview.divider} />
        <Text style={preview.weekLabel}>Sales this week</Text>
        <View style={preview.chart}>
          {bars.map((height, index) => (
            <View key={`${labels[index]}-${index}`} style={preview.barColumn}>
              <View style={[preview.bar, {
                height: 58 * height,
                backgroundColor: index === 3 ? '#F7B267' : index === 1 || index === 5 ? '#63D6B0' : '#59C5A1',
              }]} />
              <Text style={preview.barLabel}>{labels[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const preview = StyleSheet.create({
  outerCard: { minHeight: 248, borderRadius: 26, borderWidth: 1, borderColor: '#F0F0EE', backgroundColor: '#F7FAF8', padding: 10, marginHorizontal: 0, shadowColor: '#7E9489', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  stockHeader: { height: 58, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#187D69', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  stockTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  addButton: { backgroundColor: '#2F8E7C', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 7 },
  addText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  innerCard: { flex: 1, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBF0ED', marginTop: 0, paddingHorizontal: 12, paddingVertical: 12 },
  alertBanner: { backgroundColor: '#FFF1E8', borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 4 },
  alertText: { color: '#24352E', fontSize: 12, fontWeight: '700' },
  productRow: { height: 51, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EAF7F2', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  productInfo: { flex: 1 },
  productName: { color: '#24352E', fontSize: 12, fontWeight: '800' },
  productStock: { color: '#6A7680', fontSize: 10, marginTop: 3 },
  price: { color: '#24352E', fontSize: 12, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#DDE5E1' },
  debtCard: { minHeight: 248, padding: 9, backgroundColor: '#F9FAF8' },
  debtLabel: { color: '#6A7680', fontSize: 12 },
  debtTotal: { color: '#24352E', fontFamily: SERIF, fontSize: 28, fontWeight: '800', marginTop: 5, marginBottom: 8 },
  debtRow: { height: 50, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F8F4EE', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  dueText: { color: '#EFA04A', fontSize: 10, marginTop: 3 },
  amountText: { color: '#F59B2A', fontSize: 12, fontWeight: '800' },
  reminderButton: { marginTop: 9, height: 38, borderRadius: 8, backgroundColor: '#E4F2EA', alignItems: 'center', justifyContent: 'center' },
  reminderText: { color: '#187D69', fontSize: 12, fontWeight: '800' },
  salesCard: { minHeight: 248 },
  salesTop: { height: 78, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 4 },
  salesLabel: { color: '#74A28F', fontSize: 12 },
  salesTotal: { color: '#24352E', fontFamily: SERIF, fontSize: 28, fontWeight: '800', marginTop: 8 },
  salesBadge: { borderRadius: 10, backgroundColor: '#E4F3EA', paddingHorizontal: 9, paddingVertical: 7 },
  salesBadgeText: { color: '#187D69', fontSize: 10, fontWeight: '800' },
  weekLabel: { color: '#24352E', fontSize: 12, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  chart: { height: 90, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingHorizontal: 4 },
  barColumn: { width: 28, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 20, borderRadius: 5, marginBottom: 5 },
  barLabel: { color: '#74A28F', fontSize: 9 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF8' },
  safe: { flex: 1 },
  header: { height: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  back: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#D8E4DE', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logo: { color: GREEN, fontSize: 13, lineHeight: 16, letterSpacing: 3, fontWeight: '900', textAlign: 'center' },
  skip: { width: 54, alignItems: 'flex-end', paddingVertical: 9 },
  skipSpacer: { width: 54 },
  skipText: { color: '#70A78F', fontSize: 13, fontWeight: '700' },
  list: { flex: 1 },
  page: { flex: 1, alignItems: 'center', paddingHorizontal: 12, paddingTop: 0 },
  artSlot: { width: '100%', height: 282, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  copy: { width: '100%', alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: 0 },
  eyebrow: { color: '#00A676', fontSize: 11, lineHeight: 16, letterSpacing: 1.8, fontWeight: '900', marginBottom: 7 },
  heading: { width: '100%', maxWidth: 360, color: '#26352F', fontFamily: SERIF, fontSize: 32, lineHeight: 38, fontWeight: '900', textAlign: 'left', marginBottom: 10 },
  description: { width: '100%', maxWidth: 365, color: '#70A08B', fontSize: 16, lineHeight: 23, textAlign: 'left' },
  footer: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, gap: 14 },
  footerStatus: { height: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 0 },
  pageCount: { color: '#70A78F', fontSize: 12, fontWeight: '700' },
  pagination: { flexDirection: 'row', alignItems: 'center', gap: 7, marginRight: 116 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9D3CE' },
  activeDot: { width: 24, backgroundColor: '#087F69' },
  next: { height: 58, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: '#087F69', borderRadius: 16, paddingHorizontal: 24 },
  nextText: { color: WHITE, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.72 },
});
