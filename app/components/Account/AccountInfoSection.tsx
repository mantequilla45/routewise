import CommuterPicker from '@/components/Account/CommuterPicker';
import EditableField from '@/components/Account/EditableField';
import { useProfileEditor } from '@/components/Account/useProfileEditor';
import { colors, radius, spacing, type, ui } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onSignOut: () => void;
};

/**
 * The signed-in settings: one rounded group with the editable profile (tap a row to change it,
 * saved right away) and a shortcut to saved routes, then sign out and the app version.
 */
export default function AccountInfoSection({ onSignOut }: Props) {
  const router = useRouter();
  const { name, commuter } = useProfileEditor();
  const version = Constants.expoConfig?.version;

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <EditableField
          label="Name"
          value={name.value}
          isEditing
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
          label="Commuter type"
          value={commuter.value}
          isEditing
          isSaving={commuter.isSaving}
          onPress={commuter.openPicker}
        />
        <View style={styles.divider} />
        <Pressable
          onPress={() => router.push('/saved')}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={type.body}>Saved routes</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>
      </View>

      <Pressable
        onPress={onSignOut}
        hitSlop={8}
        style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        accessibilityRole="button"
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      {!!version && <Text style={styles.version}>RouteWise {version}</Text>}

      <CommuterPicker
        visible={commuter.isPickerVisible}
        value={commuter.value}
        onSelect={commuter.select}
        onClose={commuter.closePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  // One inset group, like iOS Settings
  group: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  divider: {
    ...ui.divider,
    marginLeft: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  rowPressed: {
    backgroundColor: colors.surfacePressed,
  },
  signOut: {
    alignSelf: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  signOutPressed: {
    opacity: 0.6,
  },
  signOutText: {
    ...type.bodyMedium,
    color: colors.danger,
  },
  version: {
    ...type.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textTertiary,
  },
});
