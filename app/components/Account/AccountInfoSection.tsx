import CommuterPicker from '@/components/Account/CommuterPicker';
import EditableField, { InfoRow } from '@/components/Account/EditableField';
import { useProfileEditor } from '@/components/Account/useProfileEditor';
import type { AuthUser } from '@/context/auth';
import { colors, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  user: AuthUser;
  onSignOut: () => void;
};

/** Settings-style list: editable name and commuter type, email details, sign out. */
export default function AccountInfoSection({ user, onSignOut }: Props) {
  const { isEditingSection, toggleEditing, name, commuter } = useProfileEditor();
  const isVerified = !!user.email_verified;

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={type.overline}>Account information</Text>
        <Pressable
          onPress={toggleEditing}
          style={({ pressed }) => pressed && styles.pressed}
          hitSlop={12}
          accessibilityRole="button"
        >
          <Text style={styles.editText}>{isEditingSection ? 'Save' : 'Edit'}</Text>
        </Pressable>
      </View>

      <View style={styles.group}>
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
        <View style={styles.divider} />
        <EditableField
          label="Commuter Type"
          value={commuter.value}
          isEditing={isEditingSection}
          isSaving={commuter.isSaving}
          onPress={commuter.openPicker}
        />
        <View style={styles.divider} />
        <InfoRow label="Email" value={user.email} />
        <View style={styles.divider} />
        <InfoRow label="Email Verified" value={isVerified ? 'Yes' : 'No'} />
      </View>

      <View style={[styles.group, styles.signOutGroup]}>
        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [styles.signOutRow, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  editText: {
    ...type.bodyMedium,
    color: colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
  group: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  divider: {
    ...ui.divider,
    marginLeft: spacing.lg,
  },
  signOutGroup: {
    marginTop: spacing.xxl,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  rowPressed: {
    backgroundColor: colors.surfacePressed,
  },
  signOutText: {
    ...type.bodyMedium,
    color: colors.danger,
  },
});
