import React, { useState, useEffect, useRef } from "react";
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
  Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import BluetoothManager from "../services/BluetoothManager"; // Custom Bluetooth module

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
  None: [0, 0, 1]
};

const chestOneHot = (index) => {
  const arr = Array(21).fill(0);
  arr[index] = 1;
  return arr;
};

const MetadataScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { audioUri, patientId: passedPatientId } = route.params || {};
  const [age, setAge] = useState("");
  const [patientName, setPatientName] = useState("");
  const [gender, setGender] = useState("Male");
  const [chestLocation, setChestLocation] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [patientId, setPatientId] = useState(passedPatientId || "");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation effect
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initialize Bluetooth status
  useEffect(() => {
    (async () => {
      try {
        const isEnabled = await BluetoothManager.checkBluetoothEnabled();
        if (isEnabled) {
          const devices = await BluetoothManager.scanDevices();
          const stethoscope = devices.find(
            (device) =>
              device.name?.includes("Littmann") ||
              device.name?.includes("Stethoscope") ||
              device.name?.includes("Eko")
          );
          if (stethoscope) {
            setIsConnected(true);
            setDeviceName(stethoscope.name);
          }
        }
      } catch (error) {
        console.error("Bluetooth status check error:", error);
      }
    })();
  }, []);

  // Generate unique Patient ID if not provided
  useEffect(() => {
    if (!patientId) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setPatientId(`PAT-${date}-${randomNum}`);
    }
  }, [patientId]);

  const handleContinue = () => {
    // Validate age
    const parsedAge = parseFloat(age);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 100) {
      Alert.alert("Invalid Age", "Age must be a number between 0 and 100");
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

    navigation.navigate("Home", {
      metadata,
      audioUri,
      patientId,
    });
  };

  return (
    <LinearGradient
      colors={["#4fc3f7", "#0288d1", "#01579b"]}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.header}>
              <Text style={styles.title}>Enter Patient Data</Text>
              <Text style={styles.subtitle}>Provide details for accurate analysis</Text>
            </View>

            {/* Bluetooth Status */}
            <View style={styles.statusCard}>
              <MaterialIcons
                name={isConnected ? "bluetooth-connected" : "bluetooth"}
                size={24}
                color={isConnected ? "#0288d1" : "#607d8b"}
              />
              <Text style={[styles.statusText, isConnected && styles.connectedText]}>
                {isConnected ? `Connected to ${deviceName}` : "No Stethoscope Connected"}
              </Text>
            </View>

            {/* Input Card */}
            <View style={styles.card}>
              <Text style={styles.label}>Patient Full Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="e.g. Ali Khan"
                accessibilityLabel="Patient Full Name"
                placeholderTextColor="#90a4ae"
              />

              <Text style={styles.label}>Age (0–100)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 45.5"
                accessibilityLabel="Patient Age"
                placeholderTextColor="#90a4ae"
              />

              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={gender}
                  onValueChange={(val) => setGender(val)}
                  style={styles.picker}
                  accessibilityLabel="Gender Selection"
                >
                  <Picker.Item label="Male" value="Male" />
                  <Picker.Item label="Female" value="Female" />
                  <Picker.Item label="None" value="None" />
                </Picker>
              </View>

              <Text style={styles.label}>Chest Location</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={chestLocation}
                  onValueChange={(val) => setChestLocation(val)}
                  style={styles.picker}
                  accessibilityLabel="Chest Location Selection"
                >
                  {chestLocations.map((label, index) => (
                    <Picker.Item label={label} value={index} key={index} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Patient ID</Text>
              <Text style={styles.patientIdText}>{patientId || "Generating..."}</Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue to Record</Text>
            </TouchableOpacity>

            {/* Navigation Menu */}
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("History")}
                activeOpacity={0.85}
              >
                <Ionicons name="time-outline" size={24} color="#ffffff" style={styles.menuIcon} />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>View History</Text>
                  <Text style={styles.menuSubtitle}>Review past recordings</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4fc3f7" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("Settings")}
                activeOpacity={0.85}
              >
                <Ionicons name="settings-outline" size={24} color="#ffffff" style={styles.menuIcon} />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Settings</Text>
                  <Text style={styles.menuSubtitle}>Adjust filters & preferences</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4fc3f7" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("Profile")}
                activeOpacity={0.85}
              >
                <Ionicons name="person-circle-outline" size={24} color="#ffffff" style={styles.menuIcon} />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Doctor Profile</Text>
                  <Text style={styles.menuSubtitle}>Manage account details</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4fc3f7" />
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>BioSonic © 2025 | Medical Support Available</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#b2ebf2",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textAlign: "center",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statusText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "500",
  },
  connectedText: {
    color: "#0288d1",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "#4fc3f7",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "#4fc3f7",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  picker: {
    height: Platform.OS === "ios" ? 200 : 50,
    color: "#0f172a",
    fontSize: 16,
  },
  patientIdText: {
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#0288d1",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  menuContainer: {
    marginBottom: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#b2ebf2",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  footerText: {
    fontSize: 12,
    color: "#b2ebf2",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textAlign: "center",
    opacity: 0.8,
  },
});

export default MetadataScreen;