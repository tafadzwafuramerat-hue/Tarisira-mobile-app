import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from './LocalizedText';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { C } from '../constants/theme';

export const CAT_COLORS = ['#00A86B', '#000000', '#005F3C', '#9DB8AB', '#6FA88F', '#C9D8CF'];

const WEEK = [22, 30, 24, 40, 34, 52, 8];
const WEEK_LABELS = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

export function LineChart() {
  const W = 300, H = 100, max = 60;
  const pts = WEEK.slice(1).map((v, i, a) => [(i / (a.length - 1)) * W, H - (v / max) * H]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return (
    <View>
      <Svg width="100%" height={110} viewBox={`0 0 ${W} ${H + 6}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={C.green} stopOpacity="0.22" />
            <Stop offset="1" stopColor={C.green} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#g)" />
        <Path d={d} stroke={C.green} strokeWidth="2.5" fill="none" />
      </Svg>
      <View style={c.weekRow}>{WEEK_LABELS.map((l) => <Text key={l} style={c.weekLabel}>{l}</Text>)}</View>
    </View>
  );
}

const BARS: [number, number][] = [[1, 14], [5, 20], [10, 17], [15, 24], [20, 21], [25, 28], [30, 1]];
export function BarChart() {
  return (
    <View style={{ flexDirection: 'row', marginTop: 16, alignItems: 'flex-end' }}>
      {BARS.map(([d, v]) => (
        <View key={d} style={{ alignItems: 'center', flex: 1 }}>
          <View style={{ height: 70, justifyContent: 'flex-end' }}>
            <View style={{ width: 20, height: v * 2, backgroundColor: C.green, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
          </View>
          <Text style={[c.weekLabel, { marginTop: 8 }]}>{d}</Text>
        </View>
      ))}
    </View>
  );
}

export function Donut({ data }: { data: [string, number][] }) {
  const total = data.reduce((a, b) => a + b[1], 0) || 1;
  const R = 40, CIRC = 2 * Math.PI * R;
  let acc = 0;
  return (
    <Svg width={130} height={130} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r={R} stroke={C.line} strokeWidth="14" fill="none" />
      {data.map(([name, v], i) => {
        const len = (v / total) * CIRC;
        const el = (
          <Circle key={name} cx="50" cy="50" r={R} fill="none" stroke={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth="14"
            strokeDasharray={`${len} ${CIRC - len}`} strokeDashoffset={-acc} rotation="-90" origin="50, 50" />
        );
        acc += len;
        return el;
      })}
    </Svg>
  );
}

const c = StyleSheet.create({
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 },
  weekLabel: { color: C.muted, fontSize: 12 },
});
