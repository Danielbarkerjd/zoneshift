import { View, Text, StyleSheet } from 'react-native';
import { formatHourDiffCompact } from '../utils/format';

interface Props {
  hourDiff: number;
  direction: 'east' | 'west' | 'none';
  variant?: 'default' | 'onTeal';
}

export function DiffPill({ hourDiff, direction, variant = 'default' }: Props) {
  if (direction === 'none') return null;
  const label = direction === 'east' ? 'East' : 'West';
  return (
    <View style={[styles.pill, variant === 'onTeal' && styles.pillOnTeal]}>
      <Text style={[styles.text, variant === 'onTeal' && styles.textOnTeal]}>
        {formatHourDiffCompact(hourDiff)} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#1A9E8F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  pillOnTeal: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  text: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Outfit_700Bold',
  },
  textOnTeal: {
    color: '#FFFFFF',
  },
});
