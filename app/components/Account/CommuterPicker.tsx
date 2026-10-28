import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COMMUTER_OPTIONS = ['Regular', 'Student', 'PWD', 'Senior'];

type Props = {
  visible: boolean;
  value: string;
  onSelect: (option: string) => void;
  onClose: () => void;
};

/** Centered modal listing the commuter types (fare categories) to choose from. */
export default function CommuterPicker({ visible, value, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Select Commuter Type</Text>
          {COMMUTER_OPTIONS.map((option) => (
            <TouchableOpacity key={option} onPress={() => onSelect(option)} style={styles.option}>
              <Text style={[styles.optionText, value === option && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Lexend_600SemiBold',
    marginBottom: 20,
    textAlign: 'center',
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Lexend_400Regular',
    color: '#333',
  },
  optionTextSelected: {
    color: '#4CAF50',
  },
  cancelButton: {
    paddingVertical: 12,
    marginTop: 12,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Lexend_600SemiBold',
    color: '#f44336',
    textAlign: 'center',
  },
});
