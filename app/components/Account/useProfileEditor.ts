import { useAuth } from '@/context/auth';
import { api } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';

/**
 * State for the editable "Account Information" section: local copies of the name and commuter
 * type, which field is being edited, and the saves that push changes to the backend.
 */
export function useProfileEditor() {
  const { user, updateUser } = useAuth();
  const [isEditingSection, setIsEditingSection] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameValue, setNameValue] = useState<string>(user?.name || '');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const nameInputRef = useRef<TextInput>(null);
  const [commuterValue, setCommuterValue] = useState<string>(user?.commuter || '');
  const [isSavingCommuter, setIsSavingCommuter] = useState<boolean>(false);
  const [isCommuterPickerVisible, setIsCommuterPickerVisible] = useState<boolean>(false);

  // Keep local values in sync when the user changes externally
  useEffect(() => {
    setNameValue(user?.name || '');
    setCommuterValue(user?.commuter || '');
  }, [user]);

  // Focus the input when entering name edit mode
  useEffect(() => {
    if (isEditingName) {
      setTimeout(() => nameInputRef.current?.focus?.(), 100);
    }
  }, [isEditingName]);

  async function saveName(newName: string) {
    try {
      if (!user) return;
      const currentName = user?.name || '';
      if (newName === currentName) return;
      setIsSavingName(true);

      // The backend returns the full profile; updateUser also refreshes the cached copy.
      const updated = await api.me.update({ name: newName });
      await updateUser(updated);
    } catch (e) {
      console.warn('saveName error', e);
    } finally {
      setIsSavingName(false);
    }
  }

  async function saveCommuter(newCommuter: string) {
    try {
      if (!user) return;
      const current = user?.commuter || '';
      if (newCommuter === current) return;
      setIsSavingCommuter(true);

      const updated = await api.me.update({ commuter: newCommuter });
      await updateUser(updated);
    } catch (e) {
      console.warn('saveCommuter error', e);
    } finally {
      setIsSavingCommuter(false);
    }
  }

  // Leaves the inline name input (blur or "done") and persists what was typed
  const finishNameEdit = () => {
    setIsEditingName(false);
    saveName(nameValue);
  };

  const saveAll = async () => {
    const originalName = user?.name || '';
    const originalCommuter = user?.commuter || '';

    if (nameValue !== originalName) {
      await saveName(nameValue);
    }
    if (commuterValue !== originalCommuter) {
      await saveCommuter(commuterValue);
    }

    setIsEditingName(false);
    setIsEditingSection(false);
  };

  // The header button: "Edit" enters section editing, "Save" persists and leaves it
  const toggleEditing = () => (isEditingSection ? saveAll() : setIsEditingSection(true));

  return {
    isEditingSection,
    toggleEditing,
    name: {
      value: nameValue,
      setValue: setNameValue,
      isEditing: isEditingName,
      isSaving: isSavingName,
      inputRef: nameInputRef,
      startEdit: () => setIsEditingName(true),
      finishEdit: finishNameEdit,
    },
    commuter: {
      value: commuterValue,
      setValue: setCommuterValue,
      isSaving: isSavingCommuter,
      isPickerVisible: isCommuterPickerVisible,
      openPicker: () => setIsCommuterPickerVisible(true),
      closePicker: () => setIsCommuterPickerVisible(false),
    },
  };
}
