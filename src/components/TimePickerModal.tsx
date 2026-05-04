import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface Props {
  visible: boolean;
  value: string; // 'HH:MM'
  title: string;
  onConfirm: (value: string) => void;
  onDismiss: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function TimePickerModal({ visible, value, title, onConfirm, onDismiss }: Props) {
  const [h, m] = value.split(':');
  const [selHour, setSelHour] = useState(h ?? '07');
  const [selMin, setSelMin] = useState(m ?? '00');

  function handleConfirm() {
    onConfirm(`${selHour}:${selMin}`);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.done}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.previewTime}>
            {formatTime12(`${selHour}:${selMin}`)}
          </Text>

          <View style={styles.pickers}>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {HOURS.map(hr => (
                  <TouchableOpacity
                    key={hr}
                    style={[styles.pickerItem, selHour === hr && styles.pickerItemActive]}
                    onPress={() => setSelHour(hr)}
                  >
                    <Text style={[styles.pickerItemText, selHour === hr && styles.pickerItemTextActive]}>
                      {hr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Minute</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map(mn => (
                  <TouchableOpacity
                    key={mn}
                    style={[styles.pickerItem, selMin === mn && styles.pickerItemActive]}
                    onPress={() => setSelMin(mn)}
                  >
                    <Text style={[styles.pickerItemText, selMin === mn && styles.pickerItemTextActive]}>
                      {mn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  cancel: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  done: { fontSize: 16, color: '#38BDF8', fontWeight: '700' },
  previewTime: {
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '800',
    color: '#38BDF8',
    paddingVertical: 20,
  },
  pickers: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    gap: 24,
  },
  pickerCol: { flex: 1 },
  pickerLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' },
  pickerScroll: { height: 200 },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  pickerItemActive: { backgroundColor: '#0369A1' },
  pickerItemText: { fontSize: 20, color: '#94A3B8', fontWeight: '500' },
  pickerItemTextActive: { color: '#F8FAFC', fontWeight: '700' },
});
