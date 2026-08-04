import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { colors, type as t } from '../theme';
import type { DailyActivity } from '../types';
import { dayLabel } from '../lib/dates';

interface Props {
  week: DailyActivity[];
  goalSteps: number;
  height?: number;
  barColor?: string;
}

/** Seven-day step bar chart with a dashed goal line, Apple-Health style. */
export function WeekBars({ week, goalSteps, height = 120, barColor = colors.move }: Props) {
  const max = Math.max(goalSteps * 1.2, ...week.map((d) => d.steps), 1);
  const barWidth = 22;
  const slot = 100 / Math.max(week.length, 1);
  const goalY = height - (goalSteps / max) * height;

  return (
    <View>
      <Svg width="100%" height={height}>
        {week.map((day, i) => {
          const h = Math.max(2, (day.steps / max) * height);
          const met = day.steps >= goalSteps;
          return (
            <Rect
              key={day.date}
              x={`${slot * i + slot / 2 - 3.5}%`}
              y={height - h}
              width={barWidth}
              height={h}
              rx={5}
              fill={met ? barColor : colors.cardElevated}
            />
          );
        })}
        <Line
          x1="0"
          x2="100%"
          y1={goalY}
          y2={goalY}
          stroke={colors.textSecondary}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </Svg>
      <View style={styles.labels}>
        {week.map((day) => (
          <Text key={day.date} style={[t.caption, styles.label]}>
            {dayLabel(day.date)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', marginTop: 4 },
  label: { flex: 1, textAlign: 'center' },
});
