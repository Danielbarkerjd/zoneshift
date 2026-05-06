import { useState } from 'react';
import { Text as RNText, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText, Line } from 'react-native-svg';

interface Props {
  fontSize?: number;
}

export function Wordmark({ fontSize = 30 }: Props) {
  const [textWidth, setTextWidth] = useState<number | null>(null);

  const gap      = fontSize * 0.42;
  const sw       = fontSize * 0.055;
  const spacing  = fontSize * 0.1;
  const h1       = fontSize * 0.68;
  const h2       = fontSize * 0.40;
  const h3       = fontSize * 0.16;
  const capMid   = fontSize * 0.48; // vertical center of lowercase 't' from SVG top

  const extraW   = gap + sw + spacing + sw + spacing + sw + 4;
  const svgW     = textWidth != null ? textWidth + extraW : 1;
  const svgH     = fontSize * 1.05;

  const x1 = textWidth != null ? textWidth + gap + sw / 2 : 0;
  const x2 = x1 + spacing + sw;
  const x3 = x2 + spacing + sw;

  return (
    <View style={{ height: svgH }}>
      {/* Hidden native Text — used only to measure rendered width of "ZoneShift" */}
      <RNText
        style={{
          position: 'absolute',
          opacity: 0,
          fontSize,
          fontFamily: 'Outfit_500Medium',
          letterSpacing: 0.3,
        }}
        onLayout={e => setTextWidth(e.nativeEvent.layout.width)}
      >
        ZoneShift
      </RNText>

      <Svg width={svgW} height={svgH} style={{ opacity: textWidth !== null ? 1 : 0 }}>
        <Defs>
          <LinearGradient id="wordGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor="#E8ECF4" />
            <Stop offset="45%"  stopColor="#E8ECF4" />
            <Stop offset="65%"  stopColor="#1A9E8F" />
            <Stop offset="100%" stopColor="#1A9E8F" />
          </LinearGradient>
        </Defs>

        <SvgText
          x="0"
          y={fontSize * 0.82}
          fontSize={fontSize}
          fontFamily="Outfit_500Medium"
          fontWeight="500"
          letterSpacing={0.3}
          fill="url(#wordGrad)"
        >
          ZoneShift
        </SvgText>

        <Line
          x1={x1} y1={capMid - h1 / 2} x2={x1} y2={capMid + h1 / 2}
          stroke="#1A9E8F" strokeWidth={sw} strokeLinecap="round" opacity={0.75}
        />
        <Line
          x1={x2} y1={capMid - h2 / 2} x2={x2} y2={capMid + h2 / 2}
          stroke="#1A9E8F" strokeWidth={sw} strokeLinecap="round" opacity={0.4}
        />
        <Line
          x1={x3} y1={capMid - h3 / 2} x2={x3} y2={capMid + h3 / 2}
          stroke="#1A9E8F" strokeWidth={sw} strokeLinecap="round" opacity={0.18}
        />
      </Svg>
    </View>
  );
}
