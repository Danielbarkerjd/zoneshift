import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { C } from '../theme/colors';

interface Props {
  visible: boolean;
  value: string; // 'YYYY-MM-DD' or ''
  title: string;
  onConfirm: (value: string) => void;
  onDismiss: () => void;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function DatePickerModal({ visible, value, title, onConfirm, onDismiss }: Props) {
  const today  = new Date();
  const parsed = value ? new Date(value + 'T12:00:00') : today;

  const [year,  setYear]  = useState(parsed.getFullYear());
  const [month, setMonth] = useState(parsed.getMonth() + 1);
  const [day,   setDay]   = useState(parsed.getDate());

  const numDays = daysInMonth(year, month);
  const DAYS    = Array.from({ length: numDays }, (_, i) => i + 1);
  const YEARS   = Array.from({ length: 3 }, (_, i) => today.getFullYear() + i);

  function handleConfirm() {
    const safeDay = Math.min(day, numDays);
    const mm = String(month).padStart(2, '0');
    const dd = String(safeDay).padStart(2, '0');
    onConfirm(`${year}-${mm}-${dd}`);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.done}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.preview}>
            {MONTHS[month - 1]} {Math.min(day, numDays)}, {year}
          </Text>

          <View style={styles.pickers}>
            <ColPicker label="Month" items={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))} selected={month} onSelect={setMonth} />
            <ColPicker label="Day"   items={DAYS.map(d => ({ label: String(d), value: d }))} selected={Math.min(day, numDays)} onSelect={setDay} />
            <ColPicker label="Year"  items={YEARS.map(y => ({ label: String(y), value: y }))} selected={year} onSelect={setYear} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ColPicker<T extends number | string>({
  label, items, selected, onSelect,
}: {
  label: string;
  items: { label: string; value: T }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.col}>
      <Text style={styles.colLabel}>{label}</Text>
      <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
        {items.map(item => (
          <TouchableOpacity
            key={String(item.value)}
            style={[styles.colItem, item.value === selected && styles.colItemActive]}
            onPress={() => onSelect(item.value)}
          >
            <Text style={[styles.colItemText, item.value === selected && styles.colItemTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cancel:      { fontSize: 16, color: C.textSec,     fontFamily: 'Outfit_400Regular' },
  headerTitle: { fontSize: 16, color: C.textPrimary, fontFamily: 'Outfit_500Medium' },
  done:        { fontSize: 16, color: C.primary,     fontFamily: 'Outfit_500Medium' },
  preview: {
    textAlign: 'center', fontSize: 28, fontFamily: 'Outfit_500Medium',
    color: C.primary, paddingVertical: 16,
  },
  pickers: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  col: { flex: 1 },
  colLabel: {
    fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_500Medium',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, textAlign: 'center',
  },
  colScroll: { height: 200 },
  colItem: { paddingVertical: 9, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2, alignItems: 'center' },
  colItemActive:     { backgroundColor: 'rgba(26,158,143,0.2)' },
  colItemText:       { fontSize: 16, color: C.textSec,  fontFamily: 'Outfit_400Regular' },
  colItemTextActive: { color: C.primary, fontFamily: 'Outfit_500Medium' },
});
