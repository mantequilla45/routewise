import BottomSheet from '@/components/BottomSheet';
import { colors, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const COMMUTER_OPTIONS = ['Regular', 'Student', 'PWD', 'Senior'];

type Props = {
  visible: boolean;
  value: string;
  onSelect: (option: string) => void;
  onClose: () => void;
};

/** Sheet listing the commuter types (fare categories), with a check on the current one. */
export default function CommuterPicker({ visible, value, onSelect, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Commuter type">
      <View>
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
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  optionPressed: {
    opacity: 0.6,
  },
});
