import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
  TextInput,
  SafeAreaView,
  Animated,
} from "react-native";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import BluetoothManager from "../services/BluetoothManager"; // Custom Bluetooth module

const API_URL = "http://192.168.0.101:3000/api/diagnoses"; // Configurable API URL

const NewDiagnosisScreen = ({ route, navigation }) => {
  const { results, patientId, audioUri, metadata } = route.params || {};
  const [isSaving, setIsSaving] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [diagnosisName, setDiagnosisName] = useState("");
  const [notes, setNotes] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
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

  // Handle saving diagnosis to history
  const handleSaveDiagnosis = async () => {
    if (!diagnosisName.trim()) {
      Alert.alert("Required", "Please enter a name for this diagnosis");
      return;
    }

    if (notes.length > 500) {
      Alert.alert("Invalid Notes", "Notes cannot exceed 500 characters");
      return;
    }

    setIsSaving(true);

    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        throw new Error("User not logged in");
      }

      const response = await axios.post(API_URL, {
        name: diagnosisName.trim(),
        notes: notes.trim(),
        patient_id: patientId,
        patient_name: metadata?.patientName || "Unknown",
        user_id: userId,
        predictions: results?.predictions || [],
      });

      setSaveModalVisible(false);
      setDiagnosisName("");
      setNotes("");
      Alert.alert("Saved", "Diagnosis saved to your history");
      navigation.navigate("History");
    } catch (error) {
      console.error("Save diagnosis error:", error);
      Alert.alert("Error", error.message || "Failed to save diagnosis");
    } finally {
      setIsSaving(false);
    }
  };

  // Format confidence percentage
  const formatConfidence = (confidence) => {
    return Math.round(confidence * 10) / 10;
  };

  // Get confidence color based on percentage
  const getConfidenceColor = (confidence) => {
    if (confidence > 70) return "#10b981"; // Green
    if (confidence > 40) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  // Close modal and clear inputs
  const closeModal = () => {
    setSaveModalVisible(false);
    setDiagnosisName("");
    setNotes("");
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
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go Back"
              >
                <MaterialIcons name="arrow-back" size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.title}>Diagnosis Results</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Patient ID */}
            {patientId && (
              <Text style={styles.patientIdText}>Patient ID: {patientId}</Text>
            )}

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

            {results && results.predictions && results.predictions.length > 0 ? (
              <>
                {/* Predictions */}
                <View style={styles.resultsContainer}>
                  <Text style={styles.sectionTitle}>Top Predictions</Text>

                  {/* Primary Prediction */}
                  {results.predictions[0] && (
                    <View style={[styles.predictionCard, styles.primaryPrediction]}>
                      <View style={styles.predictionHeader}>
                        <Text style={styles.primaryDisease}>
                          {results.predictions[0].disease || "Unknown"}
                        </Text>
                        <View style={styles.confidenceBadge}>
                          <Text style={styles.confidenceText}>
                            {formatConfidence(results.predictions[0].confidence || 0)}%
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.confidenceDescription}>
                        {results.predictions[0].confidence > 70
                          ? "High confidence"
                          : results.predictions[0].confidence > 40
                          ? "Moderate confidence"
                          : "Low confidence"}
                      </Text>
                    </View>
                  )}

                  {/* Secondary Predictions */}
                  <View style={styles.secondaryPredictions}>
                    {results.predictions.slice(1, 3).map((prediction, index) => (
                      <View key={index} style={styles.predictionCard}>
                        <View style={styles.predictionRow}>
                          <Text style={styles.secondaryDisease}>
                            {prediction.disease || "Unknown"}
                          </Text>
                          <View
                            style={[
                              styles.confidenceBadge,
                              {
                                backgroundColor: getConfidenceColor(
                                  prediction.confidence || 0
                                ),
                              },
                            ]}
                          >
                            <Text style={styles.confidenceText}>
                              {formatConfidence(prediction.confidence || 0)}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[styles.button, styles.recordAgainButton]}
                    onPress={() =>
                      navigation.navigate("Home", {
                        metadata: null,
                        audioUri: null,
                        patientId: null,
                      })
                    }
                    accessibilityLabel="Record Again"
                  >
                    <MaterialIcons name="mic" size={24} color="#0288d1" />
                    <Text style={styles.recordAgainText}>Record Again</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={() => setSaveModalVisible(true)}
                    accessibilityLabel="Save Results"
                  >
                    <FontAwesome name="save" size={24} color="#ffffff" />
                    <Text style={styles.saveText}>Save Results</Text>
                  </TouchableOpacity>
                </View>

                {/* Save Diagnosis Modal */}
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={saveModalVisible}
                  onRequestClose={closeModal}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Save Diagnosis</Text>
                        <TouchableOpacity onPress={closeModal} accessibilityLabel="Close Modal">
                          <MaterialIcons name="close" size={24} color="#0f172a" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.inputLabel}>Diagnosis Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Patient Annual Checkup"
                        value={diagnosisName}
                        onChangeText={setDiagnosisName}
                        accessibilityLabel="Diagnosis Name"
                        placeholderTextColor="#90a4ae"
                      />

                      <Text style={styles.inputLabel}>Notes (Optional)</Text>
                      <TextInput
                        style={[styles.input, styles.notesInput]}
                        placeholder="Add any additional notes..."
                        multiline
                        numberOfLines={3}
                        value={notes}
                        onChangeText={setNotes}
                        maxLength={500}
                        accessibilityLabel="Diagnosis Notes"
                        placeholderTextColor="#90a4ae"
                      />

                      <View style={styles.modalButtonGroup}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.cancelButton]}
                          onPress={closeModal}
                          accessibilityLabel="Cancel Save"
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.modalButton, styles.confirmButton]}
                          onPress={handleSaveDiagnosis}
                          disabled={isSaving}
                          accessibilityLabel="Save Diagnosis"
                        >
                          {isSaving ? (
                            <ActivityIndicator color="#ffffff" />
                          ) : (
                            <Text style={styles.confirmButtonText}>Save</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </>
            ) : (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  No prediction results available
                </Text>
                <TouchableOpacity
                  style={styles.goBackButton}
                  onPress={() =>
                    navigation.navigate("Home", {
                      metadata: null,
                      audioUri: null,
                      patientId: null,
                    })
                  }
                  accessibilityLabel="Go Back to Record"
                >
                  <Text style={styles.goBackText}>Go Back to Record</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Navigation Menu */}
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("History")}
                activeOpacity={0.85}
                accessibilityLabel="View History"
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
                accessibilityLabel="Settings"
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
                accessibilityLabel="Doctor Profile"
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  patientIdText: {
    fontSize: 16,
    color: "#b2ebf2",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textAlign: "center",
    marginBottom: 20,
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
  resultsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 16,
  },
  predictionCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  primaryPrediction: {
    borderLeftWidth: 4,
    borderLeftColor: "#0288d1",
    marginBottom: 20,
  },
  predictionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  primaryDisease: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
  },
  secondaryDisease: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: "#0288d1",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  confidenceText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  confidenceDescription: {
    fontSize: 16,
    color: "#b2ebf2",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  secondaryPredictions: {
    marginTop: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  recordAgainButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "#0288d1",
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#0288d1",
    marginLeft: 10,
  },
  recordAgainText: {
    color: "#0288d1",
    fontWeight: "700",
    fontSize: 18,
    marginLeft: 8,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  saveText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
    marginLeft: 8,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "#4fc3f7",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "#ef4444",
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: "#0288d1",
    marginLeft: 10,
  },
  cancelButtonText: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 18,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  noResults: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 20,
  },
  noResultsText: {
    fontSize: 18,
    color: "#b2ebf2",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    marginBottom: 20,
    textAlign: "center",
  },
  goBackButton: {
    backgroundColor: "#0288d1",
    padding: 18,
    borderRadius: 12,
    width: "100%",
  },
  goBackText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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

export default NewDiagnosisScreen;