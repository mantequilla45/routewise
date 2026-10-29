import CommuterPicker from '@/components/Account/CommuterPicker';
import EditableField, { InfoRow } from '@/components/Account/EditableField';
import { useProfileEditor } from '@/components/Account/useProfileEditor';
import type { AuthUser } from '@/context/auth';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  user: AuthUser;
  onSignOut: () => void;
};

/** The "Account Information" card: editable name and commuter type, email details, sign out. */
export default function AccountInfoSection({ user, onSignOut }: Props) {
  const { isEditingSection, toggleEditing, name, commuter } = useProfileEditor();
  const isVerified = !!user.email_verified;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <TouchableOpacity onPress={toggleEditing} style={styles.editButton}>
          <Ionicons name="pencil" size={16} color="#000000" />
          <Text style={styles.editButtonText}>{isEditingSection ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <EditableField
        label="Full Name"
        value={name.value}
        isEditing={isEditingSection}
        isSaving={name.isSaving}
        onPress={name.startEdit}
        textInput={{
          active: name.isEditing,
          onChangeText: name.setValue,
          onDone: name.finishEdit,
        }}
        inputRef={name.inputRef}
      />
      <EditableField
        label="Commuter Type"
        value={commuter.value}
        isEditing={isEditingSection}
        isSaving={commuter.isSaving}
        onPress={commuter.openPicker}
      />
      <InfoRow label="Email" value={user.email} />
      <InfoRow label="Email Verified" value={isVerified ? 'Yes' : 'No'} />

      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <View style={styles.signOutContent}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>

      <CommuterPicker
        visible={commuter.isPickerVisible}
        value={commuter.value}
        onSelect={(option) => {
          commuter.setValue(option);
          commuter.closePicker();
        }}
        onClose={commuter.closePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '90%',
    alignSelf: 'center',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Lexend_600SemiBold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFCC66',
    borderRadius: 8,
  },
  editButtonText: {
    marginLeft: 2,
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Lexend_600SemiBold',
  },
  actionSection: {
    paddingVertical: 10,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lexend_600SemiBold',
    marginLeft: 8,
  },
});
