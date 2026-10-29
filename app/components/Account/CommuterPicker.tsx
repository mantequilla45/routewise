import { colors, radius, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COMMUTER_OPTIONS = ['Regular', 'Student', 'PWD', 'Senior'];

type Props = {
  visible: boolean;
  value: string;
  onSelect: (option: string) => void;
  onClose: () => void;
};

/** Bottom sheet listing the commuter types (fare categories), with a check on the current one. */
export default function CommuterPicker({ visible, value, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={[ui.handle, styles.handle]} />
          <Text style={[type.heading, styles.title]}>Select Commuter Type</Text>
          <View style={styles.list}>
            {COMMUTER_OPTIONS.map((option, index) => {
              const isSelected = value === option;
              return (
                <View key={option}>
                  {index > 0 && <View style={ui.divider} />}
                  <Pressable
                    onPress={() => onSelect(option)}
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={isSelected ? type.bodyMedium : type.body}>{option}</Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={colors.text} />}
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [ui.secondaryButton, pressed && styles.cancelPressed]}
            accessibilityRole="button"
          >
            <Text style={ui.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  list: {
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  optionPressed: {
    opacity: 0.6,
  },
  cancelPressed: {
    backgroundColor: colors.surfacePressed,
  },
});
