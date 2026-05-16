import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from './store';
import { detectSourceKind } from './wallet';

type Props = { onClose: () => void };

export function AddWallet({ onClose }: Props) {
  const addWallet = useApp((s) => s.addWallet);
  const [input, setInput] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const kind = detectSourceKind(input);

  const onSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await addWallet(input, label);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add wallet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose}><Text style={styles.cancel}>Cancel</Text></Pressable>
          <Text style={styles.title}>ADD WALLET</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>LABEL</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Cold storage"
            placeholderTextColor="#444"
            autoCapitalize="words"
          />

          <Text style={[styles.label, { marginTop: 24 }]}>XPUB OR ADDRESS</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={input}
            onChangeText={setInput}
            placeholder="xpub6... or bc1q..."
            placeholderTextColor="#444"
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />
          {kind && <Text style={styles.detected}>Detected: {kind}</Text>}

          {error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.privacy}>
            BTCROCKET reads balances only. Private keys never leave your wallet — never paste a seed phrase here.
          </Text>

          <Pressable
            style={[styles.saveButton, (!kind || saving) && styles.saveButtonDisabled]}
            disabled={!kind || saving}
            onPress={onSave}
          >
            <Text style={styles.saveText}>{saving ? 'CONNECTING…' : 'CONNECT'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06070d' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a22',
  },
  cancel: { color: '#888', fontSize: 15, width: 60 },
  title: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  body: { flex: 1, padding: 24 },
  label: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  input: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#11131c',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  detected: { color: '#ff6b35', fontSize: 12, marginTop: 6, fontWeight: '600' },
  error: { color: '#ff5252', fontSize: 13, marginTop: 12 },
  privacy: { color: '#555', fontSize: 12, marginTop: 24, lineHeight: 18 },
  saveButton: {
    marginTop: 32,
    paddingVertical: 16,
    backgroundColor: '#ff6b35',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#3a2a22' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});
