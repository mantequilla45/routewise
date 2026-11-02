import { useAuth } from '@/context/auth';
import { api } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';

/**
 * State for the editable profile rows: local copies of the name and commuter type, whether the
 * name is being typed, and the saves that push each change to the backend as soon as it's made.
 */
export function useProfileEditor() {
  const { user, updateUser } = useAuth();
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameValue, setNameValue] = useState<string>(user?.name || '');
  const [isSavingName, setIsSavingName] = useState<boolean>(false);
  const nameInputRef = useRef<TextInputInstance>(null);
  const [commuterValue, setCommuterValue] = useState<string>(user?.commuter || '');
  const [isSavingCommuter, setIsSavingCommuter] = useState<boolean>(false);
  const [isCommuterPickerVisible, setIsCommuterPickerVisible] = useState<boolean>(false);

  // Keep local values in sync when the user changes externally (React's recommended
  // "adjust state when a prop changes" pattern; avoids a second render from an effect).
  const [syncedUser, setSyncedUser] = useState(user);
  if (user !== syncedUser) {
    setSyncedUser(user);
    setNameValue(user?.name || '');
    setCommuterValue(user?.commuter || '');
  }

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

  return {
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
      // Picking a commuter type saves it right away
      select: (option: string) => {
        setCommuterValue(option);
        setIsCommuterPickerVisible(false);
        saveCommuter(option);
      },
      isSaving: isSavingCommuter,
      isPickerVisible: isCommuterPickerVisible,
      openPicker: () => setIsCommuterPickerVisible(true),
      closePicker: () => setIsCommuterPickerVisible(false),
    },
  };
}
