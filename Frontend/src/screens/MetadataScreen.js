// Updated MetadataScreen.js (Animations simplified)
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RecordingContext } from "../context/RecordingContext";

const { width, height } = Dimensions.get('window');

const chestLocations = [
  "Anterior Left", "Anterior Left Upper", "Anterior Right",
  "Anterior Right Lower", "Anterior Right Middle", "Anterior Right Upper",
  "Anterior Upper Right", "Lateral Left", "Lateral Right", "Posterior",
  "Posterior Left", "Posterior Left Lower & Right", "Posterior Left Lower",
  "Posterior Left Middle", "Posterior Left Right", "Posterior Left Upper",
  "Posterior Right", "Posterior Right Lower", "Posterior Right Middle",
  "Posterior Right Upper", "Trachea"
];

const genderMap = {
  Male: [0, 1, 0],
  Female: [1, 0, 0],
  Other: [0, 0, 1]
};

const chestOneHot = (index) => {
  const arr = Array(21).fill(0);
  arr[index] = 1;
  return arr;
};

const MetadataScreen = () => {
  const [age, setAge] = useState('');
  const [patientName, setPatientName] = useState('');
  const [gender, setGender] = useState('Male');
  const [chestLocation, setChestLocation] = useState(0);
  const navigation = useNavigation();
  const { setMetadata } = useContext(RecordingContext);

  const handleContinue = () => {
    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 100) {
      Alert.alert("Invalid Age", "Age must be between 0 and 100");
      return;
    }

    const normalizedAge = parsedAge / 100;
    const genderEncoded = genderMap[gender];
    const chestEncoded = chestOneHot(chestLocation);

    const metadata = {
      age: normalizedAge,
      gender: genderEncoded,
      chest: chestEncoded,
      patientName: patientName.trim(),
    };

    setMetadata(metadata);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1d3557", "#457b9d", "#a8dadc"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Enter Patient Data</Text>
          <Text style={styles.tagline}>Provide Details for Analysis</Text>

          {/* Patient Name */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Patient Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#a8dadc" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="e.g. Ali Khan"
                placeholderTextColor="#a8dadc"
              />
            </View>
          </View>

          {/* Age */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Age (0-100)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#a8dadc" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 45"
                placeholderTextColor="#a8dadc"
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="male-female-outline" size={20} color="#a8dadc" style={styles.inputIcon} />
              <Picker
                selectedValue={gender}
                onValueChange={(val) => setGender(val)}
                style={styles.picker}
                dropdownIconColor="#a8dadc"
              >
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>

          {/* Chest Location */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>Chest Location</Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="body-outline" size={20} color="#a8dadc" style={styles.inputIcon} />
              <Picker
                selectedValue={chestLocation}
                onValueChange={(val) => setChestLocation(val)}
                style={styles.picker}
                dropdownIconColor="#a8dadc"
              >
                {chestLocations.map((label, index) => (
                  <Picker.Item label={label} value={index} key={index} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={["#f1faee", "#a8dadc"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="arrow-forward-outline" size={20} color="#1d3557" />
              <Text style={styles.buttonTextPrimary}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#f1faee",
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "600",
    color: "#a8dadc",
    textAlign: "center",
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  label: { fontSize: 16, fontWeight: "600", color: "#f1faee", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.3)",
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 16, color: "#f1faee", paddingVertical: 10 },
  inputIcon: { marginRight: 8 },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.3)",
    paddingHorizontal: 12,
  },
  picker: {
    flex: 1,
    color: "#f1faee",
    height: Platform.OS === 'android' ? 50 : 44,
    marginTop: Platform.OS === 'android' ? -10 : 0,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  primaryButton: { overflow: "hidden" },
  buttonGradient: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  buttonTextPrimary: {
    color: "#1d3557",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});

export default MetadataScreen;