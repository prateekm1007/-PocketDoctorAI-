import React, { useState } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiBase || process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3000';

export default function App() {
  const [fileInfo, setFileInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const pickAndUpload = async () => {
    setResult(null);
    const doc = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (doc?.canceled || !doc?.assets?.[0]) return;
    const asset = doc.assets[0];
    setFileInfo(asset);
    try {
      setBusy(true);
      const form = new FormData();
      form.append('file', { uri: asset.uri, name: asset.name || 'upload.bin', type: asset.mimeType || 'application/octet-stream' });
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form });
      setResult(await res.json());
    } catch (e) { setResult({ error: String(e) }); } finally { setBusy(false); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PocketDoctor AI V2</Text>
      <Text style={styles.subtitle}>API: {API_BASE}</Text>
      <View style={{height:16}}/>
      <Button title={busy ? 'Uploading...' : 'Pick & Upload'} onPress={pickAndUpload} disabled={busy}/>
      {fileInfo && <Text style={{marginTop:12}}>Selected: {fileInfo.name} ({fileInfo.size} bytes)</Text>}
      {result && <Text style={{marginTop:12}} selectable>{JSON.stringify(result, null, 2)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center', padding:24 },
  title: { fontSize:22, fontWeight:'700' },
  subtitle: { fontSize:12, opacity:0.7 }
});
