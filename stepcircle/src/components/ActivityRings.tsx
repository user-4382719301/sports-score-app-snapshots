import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../theme';
import type { RingProgress } from '../types';

interface RingSpec {
  progress: number;
  color: string;
  dimColor: string;
}

interface Props {
  rings: RingProgress;
  size: number;
  /** Ring thickness; defaults scale with size. */
  strokeWidth?: number;
}

function Ring({
  spec,
  radius,
  strokeWidth,
  center,
}: {
  spec: RingSpec;
  radius: number;
  strokeWidth: number;
  center: number;
}) {
  const circumference = 2 * Math.PI * radius;
  // Visually cap just under a full turn so the rounded cap stays visible.
  const fill = Math.min(spec.progress, 0.999);
  return (
    <G>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={spec.dimColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {fill > 0 && (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={spec.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * fill} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
    </G>
  );
}

/** The Move / Exercise / Stand ring trio, drawn concentrically. */
export function ActivityRings({ rings, size, strokeWidth }: Props) {
  const stroke = strokeWidth ?? Math.max(8, size * 0.1);
  const gap = stroke * 0.25;
  const center = size / 2;
  const outer = center - stroke / 2;
  const middle = outer - stroke - gap;
  const inner = middle - stroke - gap;

  const specs: Array<{ spec: RingSpec; radius: number }> = [
    { spec: { progress: rings.move, color: colors.move, dimColor: colors.moveDim }, radius: outer },
    {
      spec: { progress: rings.exercise, color: colors.exercise, dimColor: colors.exerciseDim },
      radius: middle,
    },
    {
      spec: { progress: rings.stand, color: colors.stand, dimColor: colors.standDim },
      radius: inner,
    },
  ];

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {specs.map(({ spec, radius }, i) => (
          <Ring key={i} spec={spec} radius={radius} strokeWidth={stroke} center={center} />
        ))}
      </Svg>
    </View>
  );
}
