import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { errorMessage } from './errors';

function base64ToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (c === '=') break;
    const value = chars.indexOf(c);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

export async function pickAvatar(
  session: Session | null,
  setPhoto: (uri: string | null) => void,
): Promise<void> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const ext = (asset.fileName?.split('.').pop() || 'jpg').toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

    if (supabase && session) {
      try {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const bytes = base64ToBytes(base64);
        const path = `${session.user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, bytes, { contentType, upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(path, { cacheNonce: String(Date.now()) });
        setPhoto(urlData.publicUrl);
        return;
      } catch (cloudError) {
        console.warn('Cloud avatar save failed, saving locally:', cloudError);
        Alert.alert('Saved on this device', 'Could not reach the cloud, so the photo is saved on this device only.');
      }
    }

    const dir = FileSystem.documentDirectory;
    if (!dir) {
      setPhoto(asset.uri);
      return;
    }
    const dest = `${dir}profile.${ext}`;
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.copyAsync({ from: asset.uri, to: dest });
    setPhoto(dest);
  } catch (error) {
    Alert.alert('Photo failed', errorMessage(error, 'Could not save the photo.'));
  }
}
