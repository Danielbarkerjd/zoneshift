import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

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
  const today = new Date();
  const parsed = value ? new Date(value + 'T12:00:00') : today;

  const [year, setYear] = useState(parsed.getFullYear());
  const [month, setMonth] = useState(parsed.getMonth() + 1); // 1-based
  const [day, setDay] = useState(parsed.getDate());

  const numDays = daysInMonth(year, month);
  const DAYS = Array.from({ length: numDays }, (_, i) => i + 1);
  const YEARS = Array.from({ length: 3 }, (_, i) => today.getFullYear() + i);

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
            <ColPicker label="Day" items={DAYS.map(d => ({ label: String(d), value: d }))} selected={Math.min(day, numDays)} onSelect={setDay} />
            <ColPicker label="Year" items={YEARS.map(y => ({ label: String(y), value: y }))} selected={year} onSelect={setYear} />
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
  sheet: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  cancel: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  done: { fontSize: 16, color: '#38BDF8', fontWeight: '700' },
  preview: { textAlign: 'center', fontSize: 28, fontWeight: '800', color: '#38BDF8', paddingVertical: 16 },
  pickers: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  col: { flex: 1 },
  colLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, textAlign: 'center' },
  colScroll: { height: 200 },
  colItem: { paddingVertical: 9, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2, alignItems: 'center' },
  colItemActive: { backgroundColor: '#0369A1' },
  colItemText: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  colItemTextActive: { color: '#F8FAFC', fontWeight: '700' },
});
