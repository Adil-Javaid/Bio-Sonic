import React, { useState } from "react";
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
} from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import axios from "axios";

const PredictionScreen = ({ route, navigation }) => {
  // Get prediction results from navigation params
  const { results } = route.params || {};
  const [isSaving, setIsSaving] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [diagnosisName, setDiagnosisName] = useState("");
  const [notes, setNotes] = useState("");

  // Handle saving diagnosis to history
  const handleSaveDiagnosis = async () => {
    if (!diagnosisName.trim()) {
      Alert.alert("Required", "Please enter a name for this diagnosis");
      return;
    }

    setIsSaving(true);

    try {
      // In a real app, you would save to your database/async storage
      // This is just a simulation
      const newDiagnosis = {
        id: Date.now().toString(),
        name: diagnosisName,
        date: new Date().toISOString(),
        predictions: results.predictions,
        notes: notes.trim(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate back with success
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.title}>Diagnosis Results</Text>
        <View style={{ width: 24 }} />
      </View>

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
                  <View style={styles.confidenceBadge}>
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
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.recordAgainButton]}
              onPress={() => navigation.navigate("Home")}
            >
              <MaterialIcons name="mic" size={20} color="#3b82f6" />
              <Text style={styles.recordAgainText}>Record Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => setSaveModalVisible(true)}
            >
              <FontAwesome name="save" size={20} color="white" />
              <Text style={styles.saveText}>Save Results</Text>
            </TouchableOpacity>
          </View>

          {/* Save Diagnosis Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={saveModalVisible}
            onRequestClose={() => setSaveModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Save Diagnosis</Text>

                <Text style={styles.inputLabel}>Diagnosis Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Patient Annual Checkup"
                  value={diagnosisName}
                  onChangeText={setDiagnosisName}
                />

                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Add any additional notes..."
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />

                <View style={styles.modalButtonGroup}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setSaveModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleSaveDiagnosis}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="white" />
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
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.goBackText}>Go Back to Record</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  resultsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  predictionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryPrediction: {
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
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
    fontWeight: "bold",
    color: "#1e293b",
  },
  secondaryDisease: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  confidenceBadge: {
    backgroundColor: "#3b82f6",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  confidenceText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  confidenceDescription: {
    color: "#64748b",
    fontSize: 14,
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
    paddingHorizontal: 20,
    marginTop: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  recordAgainButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#3b82f6",
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    flex: 1,
    marginLeft: 10,
  },
  recordAgainText: {
    color: "#3b82f6",
    fontWeight: "600",
    marginLeft: 8,
  },
  saveText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
    padding: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: "#3b82f6",
    marginLeft: 10,
  },
  cancelButtonText: {
    color: "#64748b",
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
  },
  noResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 20,
    textAlign: "center",
  },
  goBackButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 8,
    width: "100%",
  },
  goBackText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default PredictionScreen;
