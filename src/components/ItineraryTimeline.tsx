import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../theme/colors';

const DOT_COL = 20;

export function ItWaypoint({
  kind,
  city,
  date,
  time,
  tz,
  isEstimated,
  onEdit,
  isLast,
}: {
  kind: 'dep' | 'arr' | 'transit';
  city: string;
  date?: string;
  time: string;
  tz?: string;
  isEstimated?: boolean;
  onEdit?: () => void;
  isLast?: boolean;
}) {
  const dotColor = kind === 'arr' ? C.amber : kind === 'transit' ? C.textMuted : C.primary;
  const metaParts = [date, time, tz].filter(Boolean);
  return (
    <View style={s.wpRow}>
      <View style={s.dotCol}>
        <View style={[s.dot, { backgroundColor: dotColor }]} />
        {!isLast && <View style={s.dotLine} />}
      </View>
      <View style={s.wpBody}>
        <View style={s.wpHeader}>
          <Text style={s.wpCity} numberOfLines={1}>{city}</Text>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}>
              <Text style={s.editText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={s.wpMeta}>
          {metaParts.join('  ·  ')}{isEstimated ? '  ·  est.' : ''}
        </Text>
      </View>
    </View>
  );
}

export function ItConnector({ label, onEdit }: { label?: string; onEdit?: () => void }) {
  return (
    <View style={s.connRow}>
      <View style={s.dotCol}>
        <View style={s.connLine} />
      </View>
      {(label || onEdit) ? (
        <View style={s.connContent}>
          {label ? <Text style={s.connLabel}>{label}</Text> : <View />}
          {onEdit && (
            <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.editText}>Edit stops</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wpRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dotCol: { width: DOT_COL, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  dotLine: { width: 2, flex: 1, minHeight: 16, backgroundColor: C.border, marginVertical: 3 },
  wpBody: { flex: 1, paddingLeft: 10, paddingBottom: 14 },
  wpHeader: { flexDirection: 'row', alignItems: 'center' },
  wpCity: { flex: 1, fontSize: 14, fontFamily: 'Outfit_700Bold', color: C.textPrimary },
  wpMeta: { fontSize: 12, color: C.textMuted, fontFamily: 'Outfit_400Regular', marginTop: 2 },
  editText: { fontSize: 13, color: C.primary, fontFamily: 'Outfit_700Bold', marginLeft: 8 },
  connRow: { flexDirection: 'row', height: 28, alignItems: 'center' },
  connLine: { width: 2, height: 28, backgroundColor: C.border },
  connContent: { flex: 1, paddingLeft: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  connLabel: { fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_400Regular', fontStyle: 'italic' },
});
