import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

const GREEN = '#064E3B';
const AMBER = '#F5A000';
const CREAM = '#FFF9F0';
const WHITE = '#FFFFFF';
const INK = '#26352F';
const WOOD = '#D8A66A';
const WOOD_DARK = '#B97B44';
const SKIN = '#8B553C';
const SKIN_LIGHT = '#A96D50';
const HAIR = '#34251F';
const MINT = '#DCEBE0';
const RED = '#BD5A43';

export type OnboardingArtType = 'shop' | 'records' | 'growth';

export function OnboardingArt({ type, width }: { type: OnboardingArtType; width: number }) {
  const height = width * (320 / 360);
  return (
    <Svg width={width} height={height} viewBox="0 0 360 320">
      {type === 'shop' ? <ShopScene /> : type === 'records' ? <RecordsScene /> : <GrowthScene />}
    </Svg>
  );
}

function ShopScene() {
  return (
    <G>
      <Path d="M37 73 C50 26 104 9 170 17 C235 0 311 31 327 84 L339 257 L22 257 Z" fill="#F2E9D9" />
      <Rect x="35" y="46" width="290" height="144" rx="12" fill="#F6F0E4" />
      <Rect x="46" y="59" width="268" height="2" fill="#E8DDCB" />
      <Rect x="46" y="119" width="268" height="2" fill="#E8DDCB" />
      <Rect x="46" y="178" width="268" height="2" fill="#E8DDCB" />
      <Rect x="40" y="111" width="280" height="9" rx="4" fill={WOOD} />
      <Rect x="40" y="170" width="280" height="9" rx="4" fill={WOOD} />

      <Path d="M59 83 Q60 72 73 72 Q86 72 87 83 L91 109 L56 109 Z" fill="#E9B96C" />
      <Path d="M58 84 Q73 78 88 84" stroke={WOOD_DARK} strokeWidth="3" />
      <Rect x="63" y="65" width="18" height="10" rx="3" fill={GREEN} />
      <Rect x="100" y="73" width="23" height="36" rx="5" fill="#E9A43F" />
      <Rect x="105" y="66" width="13" height="10" rx="3" fill={GREEN} />
      <Rect x="104" y="87" width="15" height="10" rx="2" fill="#FFF2D7" />
      <Rect x="137" y="77" width="18" height="32" rx="5" fill="#B9523F" />
      <Rect x="141" y="69" width="10" height="10" rx="3" fill={GREEN} />
      <Rect x="165" y="81" width="25" height="28" rx="4" fill="#D9B47C" />
      <Path d="M165 87 Q177 76 190 87" fill="#D9B47C" stroke="#C59658" strokeWidth="2" />
      <Rect x="225" y="74" width="24" height="34" rx="4" fill="#F0D8A8" />
      <Rect x="230" y="81" width="14" height="5" rx="2" fill={GREEN} />
      <Rect x="255" y="81" width="22" height="28" rx="4" fill="#E3C38E" />
      <Path d="M255 86 L266 77 L277 86" fill="none" stroke="#BE935C" strokeWidth="2" />
      <Rect x="285" y="68" width="17" height="41" rx="5" fill="#D97946" />
      <Rect x="289" y="62" width="9" height="8" rx="2" fill={GREEN} />
      <Rect x="284" y="89" width="19" height="7" fill="#F7E5BC" />
      <Rect x="69" y="130" width="18" height="32" rx="5" fill="#D86B4B" />
      <Rect x="73" y="124" width="10" height="8" rx="2" fill={GREEN} />
      <Rect x="99" y="130" width="21" height="32" rx="5" fill="#8AB56A" />
      <Rect x="104" y="124" width="11" height="8" rx="2" fill={GREEN} />
      <Rect x="133" y="133" width="31" height="28" rx="4" fill="#E9D4AA" />
      <Path d="M132 139 L148 126 L165 139" fill="#D8B981" />
      <Rect x="235" y="132" width="25" height="28" rx="4" fill="#E2C991" />
      <Rect x="270" y="128" width="20" height="33" rx="4" fill="#E4A649" />
      <Rect x="274" y="123" width="12" height="7" rx="2" fill={GREEN} />

      <Ellipse cx="180" cy="111" rx="42" ry="43" fill={HAIR} />
      <Path d="M146 91 Q145 66 178 65 Q211 66 215 92 L210 105 Q199 91 181 92 Q164 92 149 104 Z" fill={HAIR} />
      <Path d="M149 81 Q180 58 211 81 L207 89 Q180 75 153 91 Z" fill={AMBER} />
      <Ellipse cx="180" cy="112" rx="30" ry="34" fill={SKIN_LIGHT} />
      <Ellipse cx="149" cy="116" rx="5" ry="8" fill={SKIN} />
      <Ellipse cx="211" cy="116" rx="5" ry="8" fill={SKIN} />
      <Path d="M162 108 Q167 104 172 108 M188 108 Q193 104 198 108" fill="none" stroke={HAIR} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="168" cy="114" r="2" fill={INK} />
      <Circle cx="192" cy="114" r="2" fill={INK} />
      <Path d="M176 116 Q173 124 178 124" fill="none" stroke={SKIN} strokeWidth="2" strokeLinecap="round" />
      <Path d="M169 131 Q180 142 192 130" fill="none" stroke="#713C32" strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="160" cy="124" r="4" fill="#C77B65" opacity={0.45} />
      <Circle cx="200" cy="124" r="4" fill="#C77B65" opacity={0.45} />

      <Path d="M139 171 Q149 146 180 145 Q211 146 222 171 L232 245 L128 245 Z" fill={GREEN} />
      <Path d="M165 150 L180 168 L195 150 L204 245 L156 245 Z" fill="#E7EFE5" />
      <Path d="M151 164 Q132 166 128 188 L116 216 Q112 225 120 228 Q127 230 132 221 L151 197" fill={SKIN_LIGHT} />
      <Path d="M209 164 Q227 166 232 186 L241 202" fill="none" stroke={SKIN_LIGHT} strokeWidth="13" strokeLinecap="round" />
      <Path d="M241 202 Q246 207 245 215" fill="none" stroke={SKIN_LIGHT} strokeWidth="11" strokeLinecap="round" />
      <Rect x="230" y="165" width="25" height="43" rx="5" fill={INK} transform="rotate(-8 230 165)" />
      <Rect x="233" y="169" width="19" height="32" rx="2" fill="#E9F0E9" transform="rotate(-8 233 169)" />
      <Line x1="239" y1="174" x2="247" y2="173" stroke={GREEN} strokeWidth="2" />
      <Circle cx="244" cy="196" r="1.5" fill={AMBER} />

      <Rect x="21" y="231" width="318" height="18" rx="7" fill={WOOD_DARK} />
      <Rect x="28" y="237" width="304" height="71" rx="5" fill={WOOD} />
      <Path d="M38 259 H321 M45 279 H155" stroke="#C48E58" strokeWidth="2" opacity={0.65} />
      <Rect x="155" y="259" width="46" height="34" rx="5" fill="#F5E9D5" />
      <Rect x="163" y="267" width="30" height="4" rx="2" fill={AMBER} />
      <Rect x="163" y="276" width="23" height="3" rx="2" fill="#C8B99F" />
      <Rect x="163" y="284" width="27" height="3" rx="2" fill="#C8B99F" />
    </G>
  );
}

function RecordsScene() {
  return (
    <G>
      <Path d="M45 79 Q61 24 126 27 Q191 8 246 34 Q304 41 319 91 L330 275 L31 275 Z" fill="#F0E6D5" />
      <Rect x="47" y="53" width="266" height="149" rx="12" fill="#F8F3E9" />
      <Rect x="58" y="65" width="244" height="2" fill="#E4D8C6" />
      <Rect x="58" y="128" width="244" height="2" fill="#E4D8C6" />
      <Rect x="42" y="121" width="276" height="9" rx="4" fill={WOOD} />
      <Rect x="42" y="194" width="276" height="9" rx="4" fill={WOOD} />

      <Path d="M67 98 Q70 79 87 79 Q103 80 105 99 L109 117 L64 117 Z" fill="#DFA85E" />
      <Path d="M68 97 Q86 85 104 97" fill="none" stroke="#BA8446" strokeWidth="3" />
      <Rect x="70" y="74" width="31" height="7" rx="3" fill={GREEN} />
      <Rect x="124" y="76" width="25" height="40" rx="5" fill="#E8A143" />
      <Rect x="130" y="68" width="13" height="11" rx="3" fill={GREEN} />
      <Rect x="128" y="92" width="17" height="11" rx="2" fill="#FFF1D6" />
      <Rect x="174" y="83" width="21" height="34" rx="5" fill="#B95E45" />
      <Rect x="178" y="76" width="13" height="9" rx="3" fill={GREEN} />
      <Rect x="228" y="82" width="31" height="34" rx="5" fill="#D6BC8B" />
      <Path d="M228 90 Q243 74 259 90" fill="#C7A76E" />
      <Rect x="272" y="79" width="21" height="38" rx="5" fill="#82A962" />
      <Rect x="277" y="72" width="11" height="9" rx="3" fill={GREEN} />
      <Rect x="72" y="144" width="22" height="38" rx="6" fill="#79A769" />
      <Rect x="77" y="137" width="12" height="9" rx="3" fill={GREEN} />
      <Rect x="109" y="147" width="30" height="34" rx="4" fill="#D5B987" />
      <Path d="M109 153 L124 140 L139 153" fill="#C7A675" />
      <Rect x="164" y="146" width="20" height="36" rx="5" fill="#E5AA48" />
      <Rect x="168" y="139" width="12" height="9" rx="3" fill={GREEN} />

      <Rect x="24" y="222" width="312" height="74" rx="12" fill={WOOD} />
      <Rect x="24" y="214" width="312" height="16" rx="7" fill={WOOD_DARK} />
      <Rect x="146" y="220" width="101" height="67" rx="4" fill="#EEE6D7" transform="rotate(-4 146 220)" />
      <Rect x="155" y="226" width="85" height="59" rx="3" fill={WHITE} transform="rotate(-4 155 226)" />
      <SvgText x="164" y="240" fill={GREEN} fontSize="8" fontWeight="700" transform="rotate(-4 164 240)">SALES RECEIPT</SvgText>
      <Line x1="164" y1="247" x2="227" y2="242" stroke="#C9C0B1" strokeWidth="1.5" />
      <Line x1="164" y1="254" x2="224" y2="250" stroke="#C9C0B1" strokeWidth="1.5" />
      <Line x1="165" y1="261" x2="219" y2="257" stroke="#C9C0B1" strokeWidth="1.5" />
      <Line x1="166" y1="269" x2="215" y2="265" stroke="#C9C0B1" strokeWidth="1.5" />
      <Path d="M101 261 C86 250 62 250 53 264 C61 278 85 282 103 274 Z" fill="#E8BC79" />
      <Path d="M56 265 Q79 253 99 266 M63 272 Q80 263 97 269" fill="none" stroke="#C18D4D" strokeWidth="2" />
      <Path d="M279 245 L307 245 L305 279 L281 279 Z" fill="#E8D7B5" />
      <Path d="M284 245 L293 236 L302 245" fill="#D2B27C" />
      <Rect x="286" y="253" width="13" height="5" rx="2" fill={GREEN} />
      <Rect x="286" y="263" width="15" height="3" rx="1.5" fill="#B49F7D" />
      <SvgText x="276" y="289" fill={GREEN} fontSize="7" fontWeight="700">RUDO · $1.50</SvgText>

      <Rect x="108" y="41" width="147" height="31" rx="15" fill={GREEN} />
      <Circle cx="128" cy="56" r="8" fill={AMBER} />
      <Path d="M124 56 L127 59 L133 52" fill="none" stroke={WHITE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <SvgText x="143" y="60" fill={WHITE} fontSize="10" fontWeight="700">Stock &amp; sales</SvgText>
    </G>
  );
}

function GrowthScene() {
  return (
    <G>
      <Path d="M35 95 Q46 35 108 28 Q178 0 247 34 Q310 39 326 95 L330 276 L29 276 Z" fill="#F0E8D8" />
      <Rect x="50" y="51" width="194" height="172" rx="14" fill={WHITE} />
      <Rect x="65" y="66" width="99" height="9" rx="4" fill={GREEN} />
      <Rect x="65" y="83" width="67" height="5" rx="2.5" fill="#D7DED4" />
      <Rect x="65" y="107" width="163" height="100" rx="8" fill="#F7F5EF" />
      <Line x1="79" y1="186" x2="218" y2="186" stroke="#D8DED5" strokeWidth="1.5" />
      <Line x1="79" y1="161" x2="218" y2="161" stroke="#E4E7DF" strokeWidth="1" />
      <Line x1="79" y1="136" x2="218" y2="136" stroke="#E4E7DF" strokeWidth="1" />
      <Rect x="89" y="161" width="17" height="25" rx="4" fill="#9ABBA2" />
      <Rect x="118" y="147" width="17" height="39" rx="4" fill="#78A184" />
      <Rect x="147" y="151" width="17" height="35" rx="4" fill={AMBER} />
      <Rect x="176" y="124" width="17" height="62" rx="4" fill={GREEN} />
      <Rect x="205" y="117" width="12" height="69" rx="4" fill={GREEN} />
      <SvgText x="84" y="200" fill="#77867A" fontSize="7">MON</SvgText>
      <SvgText x="114" y="200" fill="#77867A" fontSize="7">TUE</SvgText>
      <SvgText x="145" y="200" fill="#77867A" fontSize="7">WED</SvgText>
      <SvgText x="175" y="200" fill="#77867A" fontSize="7">THU</SvgText>
      <SvgText x="203" y="200" fill="#77867A" fontSize="7">FRI</SvgText>
      <Path d="M267 154 L284 137 L299 146 L322 116" fill="none" stroke={GREEN} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M309 116 L322 116 L322 129" fill="none" stroke={GREEN} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="284" cy="137" r="4" fill={AMBER} />
      <Circle cx="299" cy="146" r="4" fill={AMBER} />
      <Circle cx="322" cy="116" r="4" fill={AMBER} />

      <Rect x="237" y="162" width="98" height="91" rx="9" fill="#F6F0E4" />
      <Rect x="249" y="174" width="48" height="7" rx="3" fill={GREEN} />
      <Rect x="249" y="188" width="70" height="4" rx="2" fill="#D0D0C5" />
      <Rect x="249" y="199" width="61" height="4" rx="2" fill="#D0D0C5" />
      <Rect x="249" y="210" width="54" height="4" rx="2" fill="#D0D0C5" />
      <Rect x="249" y="223" width="31" height="7" rx="3" fill={AMBER} />
      <Circle cx="318" cy="176" r="10" fill="#E7F0E7" />
      <Path d="M313 176 L317 180 L324 171" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      <Rect x="28" y="252" width="308" height="18" rx="8" fill={WOOD_DARK} />
      <Rect x="38" y="264" width="288" height="33" rx="5" fill={WOOD} />
      <Path d="M52 281 H310" stroke="#C18D54" strokeWidth="2" />
      <Rect x="75" y="232" width="45" height="19" rx="8" fill="#6F4934" />
      <Path d="M97 232 C91 216 75 215 71 203 C87 199 99 210 99 224 C100 210 110 202 122 205 C119 220 107 226 101 233" fill="#6F9B57" />
      <Path d="M96 230 C87 216 85 211 80 208 M100 230 C107 215 113 211 118 209" fill="none" stroke="#4F7743" strokeWidth="2" />
      <Circle cx="73" cy="106" r="20" fill="#F2E1BD" />
      <Path d="M65 107 L71 113 L82 99" fill="none" stroke={AMBER} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}
