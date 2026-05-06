import { useEffect, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { C } from '../theme/colors';

interface Props {
  visible: boolean;
  value: string; // always 'HH:MM' 24h
  title: string;
  onConfirm: (value: string) => void;
  onDismiss: () => void;
}

const HOURS_12 = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const MINUTES  = ['00', '15', '30', '45'];

function parse24(hhmm: string): { hour12: string; min: string; ampm: 'AM' | 'PM' } {
  const [hRaw, mRaw] = (hhmm || '07:00').split(':');
  const h24 = parseInt(hRaw, 10) || 0;
  const m   = (mRaw || '00').padStart(2, '0');
  const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return { hour12: String(h12), min: m, ampm };
}

function to24(hour12: string, min: string, ampm: 'AM' | 'PM'): string {
  let h = parseInt(hour12, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

export function TimePickerModal({ visible, value, title, onConfirm, onDismiss }: Props) {
  const init = parse24(value);
  const [selHour, setSelHour] = useState(init.hour12);
  const [selMin,  setSelMin]  = useState(init.min);
  const [ampm,    setAmpm]    = useState<'AM' | 'PM'>(init.ampm);

  // Re-sync whenever the modal opens or the external value changes
  useEffect(() => {
    if (visible) {
      const parsed = parse24(value);
      setSelHour(parsed.hour12);
      setSelMin(parsed.min);
      setAmpm(parsed.ampm);
    }
  }, [visible, value]);

  function handleConfirm() {
    onConfirm(to24(selHour, selMin, ampm));
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
            {`${selHour}:${selMin} ${ampm}`}
          </Text>

          <View style={styles.ampmRow}>
            {(['AM', 'PM'] as const).map(label => (
              <TouchableOpacity
                key={label}
                style={[styles.ampmBtn, ampm === label && styles.ampmBtnActive]}
                onPress={() => setAmpm(label)}
              >
                <Text style={[styles.ampmText, ampm === label && styles.ampmTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.pickers}>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {HOURS_12.map(hr => (
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

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cancel:     { fontSize: 16, color: C.textSec,     fontFamily: 'Outfit_400Regular' },
  sheetTitle: { fontSize: 16, color: C.textPrimary, fontFamily: 'Outfit_500Medium' },
  done:       { fontSize: 16, color: C.primary,     fontFamily: 'Outfit_500Medium' },
  previewTime: {
    textAlign: 'center', fontSize: 36, fontFamily: 'Outfit_500Medium',
    color: C.primary, paddingVertical: 16,
  },
  ampmRow: {
    flexDirection: 'row', alignSelf: 'center',
    backgroundColor: C.bg, borderRadius: 10, padding: 3,
    marginBottom: 16, gap: 3,
  },
  ampmBtn:        { paddingVertical: 8, paddingHorizontal: 28, borderRadius: 8 },
  ampmBtnActive:  { backgroundColor: C.primary },
  ampmText:       { fontSize: 15, fontFamily: 'Outfit_500Medium', color: C.textSec },
  ampmTextActive: { color: '#FFFFFF' },
  pickers: { flexDirection: 'row', paddingHorizontal: 40, gap: 24 },
  pickerCol: { flex: 1 },
  pickerLabel: {
    fontSize: 11, color: C.textMuted, fontFamily: 'Outfit_500Medium',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, textAlign: 'center',
  },
  pickerScroll: { height: 200 },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginBottom: 4, alignItems: 'center' },
  pickerItemActive:     { backgroundColor: 'rgba(26,158,143,0.2)' },
  pickerItemText:       { fontSize: 20, color: C.textSec,  fontFamily: 'Outfit_400Regular' },
  pickerItemTextActive: { color: C.primary, fontFamily: 'Outfit_500Medium' },
});
