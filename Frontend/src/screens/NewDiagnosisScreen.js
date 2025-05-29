import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import AudioRecorder from '../components/AudioRecorder';
// import MetadataForm from '../components/MetadataForm';
import PredictionResults from '../components/PredictionResults';

const NewDiagnosisScreen = () => {
  const [audioUri, setAudioUri] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!audioUri || !metadata) {
      Alert.alert('Missing Data', 'Please provide both audio and patient metadata.');
      return;
    }

    setIsSubmitting(true);
    setPredictions(null);

    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        name: 'chest_sound.wav',
        type: 'audio/wav',
      });
      formData.append('age', metadata.age.toString());
      formData.append('gender', metadata.gender);        // already one-hot as string
      formData.append('chest', metadata.chestLocation);  // already one-hot as string

      const response = await axios.post('http://127.0.0.1:7860/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPredictions(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Prediction failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🩺 BioSonic Diagnosis</Text>
      <Text style={styles.subtitle}>Record/upload audio and enter metadata</Text>

      <AudioRecorder onAudioReady={setAudioUri} />

      {/* <MetadataForm onMetadataChange={setMetadata} /> */}

      {isSubmitting ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 20 }} />
      ) : (
        <Text onPress={handleSubmit} style={styles.submitButton}>
          Submit for Prediction
        </Text>
      )}

      {predictions && <PredictionResults predictions={predictions} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    color: '#fff',
    textAlign: 'center',
    padding: 16,
    borderRadius: 8,
    fontWeight: 'bold',
    marginTop: 10,
  },
});

export default NewDiagnosisScreen;
