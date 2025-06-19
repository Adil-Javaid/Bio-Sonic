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
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const PredictionScreen = ({ route, navigation }) => {
  const { results, patient_id, metadata } = route.params || {};
  const [isSaving, setIsSaving] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [diagnosisName, setDiagnosisName] = useState("");
  const [notes, setNotes] = useState("");

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  // Start animations
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSaveDiagnosis = async () => {
    if (!diagnosisName.trim()) {
      Alert.alert("Required", "Please enter a name for this diagnosis");
      return;
    }

    setIsSaving(true);

    try {
      const user_id = await AsyncStorage.getItem("userId");
      const response = await axios.post("http://192.168.0.101:3000/api/diagnoses", {
        name: diagnosisName.trim(),
        notes: notes.trim(),
        patient_id,
        patient_name: metadata?.patientName || "Unknown",
        user_id,
        predictions: results.predictions,
      });

      setSaveModalVisible(false);
      Alert.alert("Saved", "Diagnosis saved to your history");
      navigation.navigate("History");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save diagnosis");
    } finally {
      setIsSaving(false);
    }
  };

  const formatConfidence = (confidence) => {
    return Math.round(confidence * 10) / 10;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 70) return "#f1faee"; // Light for high confidence
    if (confidence > 40) return "#a8dadc"; // Medium for moderate
    return "#f1faee"; // Light for low (red avoided for contrast)
  };

  return (
    <LinearGradient
      colors={["#1d3557", "#457b9d", "#a8dadc"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Animated Header */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go Back"
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back-outline" size={28} color="#f1faee" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>Diagnosis Results</Text>
              {patient_id && (
                <Text style={styles.patientId}>Patient ID: {patient_id}</Text>
              )}
            </View>
            <View style={{ width: 28 }} />
          </View>
        </Animated.View>

        {/* Animated Content */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {results ? (
            <>
              <View style={styles.resultsContainer}>
                <Text style={styles.sectionTitle}>Top Predictions</Text>

                {/* Primary Prediction */}
                {results.predictions[0] && (
                  <View style={[styles.predictionCard, styles.primaryPrediction]}>
                    <View style={styles.predictionHeader}>
                      <Text style={styles.primaryDisease}>
                        {results.predictions[0].disease}
                      </Text>
                      <View
                        style={[
                          styles.confidenceBadge,
                          {
                            backgroundColor: getConfidenceColor(
                              results.predictions[0].confidence
                            ),
                          },
                        ]}
                      >
                        <Text style={styles.confidenceText}>
                          {formatConfidence(results.predictions[0].confidence)}%
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
                          {prediction.disease}
                        </Text>
                        <View
                          style={[
                            styles.confidenceBadge,
                            {
                              backgroundColor: getConfidenceColor(
                                prediction.confidence
                              ),
                            },
                          ]}
                        >
                          <Text style={styles.confidenceText}>
                            {formatConfidence(prediction.confidence)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <Animated.View
                style={{
                  opacity: buttonAnim,
                  transform: [
                    {
                      translateY: buttonAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => navigation.navigate("Home")}
                    accessibilityLabel="Record Again"
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonContent}>
                      <Ionicons name="mic-outline" size={20} color="#f1faee" />
                      <Text style={styles.buttonTextSecondary}>Record Again</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => setSaveModalVisible(true)}
                    accessibilityLabel="Save Results"
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#f1faee", "#a8dadc"]}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="save-outline" size={20} color="#1d3557" />
                      <Text style={styles.buttonTextPrimary}>Save Results</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </>
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>
                No prediction results available
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => navigation.navigate("Home")}
                accessibilityLabel="Go Back to Record"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#f1faee", "#a8dadc"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="home-outline" size={20} color="#1d3557" />
                  <Text style={styles.buttonTextPrimary}>Go Back to Record</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Medical Icons Decoration */}
        <View style={styles.decorativeIcons}>
          <Ionicons name="heart-outline" size={24} color="#a8dadc" style={styles.decorIcon1} />
          <Ionicons name="medical-outline" size={20} color="#a8dadc" style={styles.decorIcon2} />
          <Ionicons name="fitness-outline" size={22} color="#a8dadc" style={styles.decorIcon3} />
        </View>
      </ScrollView>

      {/* Save Diagnosis Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={saveModalVisible}
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Save Diagnosis</Text>

              <Text style={styles.inputLabel}>Diagnosis Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Patient Annual Checkup"
                placeholderTextColor="#a8dadc"
                value={diagnosisName}
                onChangeText={setDiagnosisName}
                accessibilityLabel="Diagnosis Name"
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Add any additional notes..."
                placeholderTextColor="#a8dadc"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                accessibilityLabel="Notes"
              />

              <View style={styles.modalButtonGroup}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.secondaryButton]}
                  onPress={() => setSaveModalVisible(false)}
                  accessibilityLabel="Cancel"
                  activeOpacity={0.8}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="close-outline" size={20} color="#f1faee" />
                    <Text style={styles.buttonTextSecondary}>Cancel</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.primaryButton]}
                  onPress={handleSaveDiagnosis}
                  disabled={isSaving}
                  accessibilityLabel="Save Diagnosis"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#f1faee", "#a8dadc"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#1d3557" />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={20} color="#1d3557" />
                        <Text style={styles.buttonTextPrimary}>Save</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: "rgba(241, 250, 238, 0.1)",
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    left: width * 0.8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 20,
  },
  headerText: {
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#f1faee",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  patientId: {
    fontSize: 16,
    color: "#a8dadc",
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
  resultsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f1faee",
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  predictionCard: {
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  primaryPrediction: {
    borderLeftWidth: 4,
    borderLeftColor: "#f1faee",
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
    color: "#f1faee",
  },
  secondaryDisease: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f1faee",
  },
  confidenceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  confidenceText: {
    color: "#1d3557",
    fontWeight: "700",
    fontSize: 14,
  },
  confidenceDescription: {
    color: "#a8dadc",
    fontSize: 16,
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
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  primaryButton: {
    overflow: "hidden",
  },
  buttonGradient: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#f1faee",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTextPrimary: {
    color: "#1d3557",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  buttonTextSecondary: {
    color: "#f1faee",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(29, 53, 87, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f1faee",
    marginBottom: 20,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputLabel: {
    fontSize: 16,
    color: "#f1faee",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    color: "#f1faee",
    fontSize: 18,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.3)",
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  noResults: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: "#f1faee",
    marginBottom: 20,
    textAlign: "center",
  },
  decorativeIcons: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  decorIcon1: {
    position: "absolute",
    top: height * 0.15,
    left: 30,
    opacity: 0.3,
  },
  decorIcon2: {
    position: "absolute",
    bottom: height * 0.25,
    right: 40,
    opacity: 0.3,
  },
  decorIcon3: {
    position: "absolute",
    top: height * 0.4,
    right: 20,
    opacity: 0.3,
  },
});

export default PredictionScreen;