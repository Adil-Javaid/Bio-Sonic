import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';

const AudioRecorder = ({ onAudioReady }) => {
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert('Permission to access microphone is required!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      onAudioReady(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const pickWavFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/wav',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        setAudioUri(uri);
        onAudioReady(uri);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>🎙 Record or Upload Chest Sound</Text>

      <TouchableOpacity style={styles.button} onPress={recording ? stopRecording : startRecording}>
        <Text style={styles.buttonText}>
          {recording ? '🛑 Stop Recording' : '⏺️ Start Recording'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={pickWavFile}>
        <Text style={styles.buttonTextSecondary}>📂 Upload WAV File</Text>
      </TouchableOpacity>

      {audioUri && (
        <Text style={styles.fileName}>File: {audioUri.split('/').pop()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: '#e2e8f0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: '#334155',
    fontWeight: 'bold',
  },
  fileName: {
    marginTop: 10,
    color: '#475569',
    fontSize: 14,
  },
});

export default AudioRecorder;
