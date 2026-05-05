import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { colors } from "../theme/colors";
import { fonts } from "../theme/fonts";

function ringColor(score: number) {
  if (score >= 90) return colors.success;
  if (score >= 75) return colors.accent;
  return colors.warn;
}

type Props = { score: number; size?: number };

export function ScoreRing({ score, size = 48 }: Props) {
  const stroke = ringColor(score);
  const r = (18 * size) / 48;
  const strokeW = Math.max(2, (3 * size) / 48);
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const fs = Math.round(size * 0.27);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${cx} ${cy})`}>
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={colors.border}
            strokeWidth={strokeW}
            fill="none"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={stroke}
            strokeWidth={strokeW}
            fill="none"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.ringLabel]}>
        <Text style={[styles.ringScore, { color: stroke, fontSize: fs }]}>
          {score}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringLabel: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringScore: {
    fontFamily: fonts.bold,
    fontWeight: "700",
  },
});
