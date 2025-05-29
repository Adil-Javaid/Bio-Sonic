import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Picker, TouchableOpacity } from 'react-native';

const PatientMetadataForm = ({ onMetadataChange, onSubmit, isSubmitting, hasAudio }) => {
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('female');
  const [chestLocation, setChestLocation] = useState('Tc');

  const handleSubmit = () => {
    // Normalize age
    const normalizedAge = age / 100;

    // One-hot gender encoding
    const genderEncoding =
      gender === 'male' ? '1,0,0' : gender === 'female' ? '0,1,0' : '0,0,1';

    // One-hot chest location
    const locations = [
      'Al', 'Ar', 'Ll', 'Lr', 'Pl', 'Pr', 'Tc',
      'Posterior left lower lobe', 'Posterior right lower lobe',
      'Posterior left upper lobe', 'Posterior right upper lobe',
      'Anterior left lower lobe', 'Anterior right lower lobe',
      'Anterior left upper lobe', 'Anterior right upper lobe',
      'Left lateral', 'Right lateral', 'Left mid-axillary',
      'Right mid-axillary', 'Trachea', 'Other',
    ];
    const chestEncoding = locations.map(loc => (loc === chestLocation ? '1' : '0')).join(',');

    onMetadataChange({
      age: normalizedAge,
      gender: genderEncoding,
      chestLocation: chestEncoding,
    });

    onSubmit();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧾 Patient Metadata</Text>

      <Text style={styles.label}>Age (0–100)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={age.toString()}
        onChangeText={(text) => setAge(Number(text))}
      />

      <Text style={styles.label}>Gender</Text>
      <Picker
        selectedValue={gender}
        onValueChange={(itemValue) => setGender(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Male" value="male" />
        <Picker.Item label="Female" value="female" />
        <Picker.Item label="Other" value="other" />
      </Picker>

      <Text style={styles.label}>Chest Location</Text>
      <Picker
        selectedValue={chestLocation}
        onValueChange={(itemValue) => setChestLocation(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Trachea" value="Tc" />
        <Picker.Item label="Anterior Left" value="Al" />
        <Picker.Item label="Anterior Right" value="Ar" />
        <Picker.Item label="Lateral Left" value="Ll" />
        <Picker.Item label="Lateral Right" value="Lr" />
        <Picker.Item label="Posterior Left" value="Pl" />
        <Picker.Item label="Posterior Right" value="Pr" />
        <Picker.Item label="Posterior Left Lower Lobe" value="Posterior left lower lobe" />
        <Picker.Item label="Posterior Right Lower Lobe" value="Posterior right lower lobe" />
        <Picker.Item label="Posterior Left Upper Lobe" value="Posterior left upper lobe" />
        <Picker.Item label="Posterior Right Upper Lobe" value="Posterior right upper lobe" />
        <Picker.Item label="Anterior Left Lower Lobe" value="Anterior left lower lobe" />
        <Picker.Item label="Anterior Right Lower Lobe" value="Anterior right lower lobe" />
        <Picker.Item label="Anterior Left Upper Lobe" value="Anterior left upper lobe" />
        <Picker.Item label="Anterior Right Upper Lobe" value="Anterior right upper lobe" />
        <Picker.Item label="Left Lateral" value="Left lateral" />
        <Picker.Item label="Right Lateral" value="Right lateral" />
        <Picker.Item label="Left Mid-axillary" value="Left mid-axillary" />
        <Picker.Item label="Right Mid-axillary" value="Right mid-axillary" />
        <Picker.Item label="Other" value="Other" />
      </Picker>

      <TouchableOpacity
        style={[styles.button, (!hasAudio || isSubmitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!hasAudio || isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Analyzing...' : 'Analyze Chest Sound'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e293b',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  picker: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PatientMetadataForm;
