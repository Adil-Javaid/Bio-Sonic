import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { MaterialIcons, FontAwesome, Feather } from "@expo/vector-icons";
// const API_URL = "http://192.168.100.1:7860/predict"; // Replace with your laptop's local IP
const API_URL = "http://192.168.0.101:7860/api/predict"; // Replace with your laptop's local IP

const chestLabels = [
  "Anterior Left", "Anterior Left Upper", "Anterior Right",
  "Anterior Right Lower", "Anterior Right Middle", "Anterior Right Upper",
  "Anterior Upper Right", "Lateral Left", "Lateral Right", "Posterior",
  "Posterior Left", "Posterior Left Lower & Right", "Posterior Left Lower",
  "Posterior Left Middle", "Posterior Left Right", "Posterior Left Upper",
  "Posterior Right", "Posterior Right Lower", "Posterior Right Middle",
  "Posterior Right Upper", "Trachea"
];


const HomeScreen = ({ navigation, route }) => {
  const { metadata } = route.params || {};
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [audioUri, setAudioUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Request microphone permissions
useEffect(() => {
  (async () => {
    if (Platform.OS === "android") {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (!hasPermission) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "BioSonic needs access to your microphone",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permission Denied",
            "Microphone access is required to record audio."
          );
          return;
        }
      }
    }

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Microphone Permission", "Permission not granted.");
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  })();
}, []);

  // Start recording
  const startRecording = async () => {
    try {
      console.log("Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);

      // Start timer
      let seconds = 0;
      const timer = setInterval(() => {
        seconds++;
        setRecordTime(seconds);
      }, 1000);

      return () => clearInterval(timer);
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert(
        "Recording Error",
        "Could not start recording. Please try again."
      );
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      if (!recording) return;

      console.log("Stopping recording...");
      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      setRecordTime(0);

      const uri = recording.getURI();
      setAudioUri(uri);
      console.log("Recording saved to", uri);

      Alert.alert("Recording Saved", "Your recording is ready for analysis");
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  // Upload existing WAV file
  // const uploadAudio = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: "audio/wav",
  //       copyToCacheDirectory: true,
  //     });

  //     if (result.type === "success") {
  //       if (result.name.endsWith(".wav")) {
  //         setAudioUri(result.uri);
  //         Alert.alert("File Selected", "Your WAV file is ready for analysis");
  //       } else {
  //         Alert.alert("Invalid File", "Please select a WAV format file");
  //       }
  //     }
  //   } catch (err) {
  //     console.error("File picker error:", err);
  //     Alert.alert("Error", "Failed to select file");
  //   }
  // };

  {metadata && (
  <View style={{
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6"
  }}>
    <Text style={{ fontWeight: "bold", color: "#0f172a" }}>Patient Metadata</Text>
    <Text style={{ color: "#334155" }}>Age: {Math.round(metadata.age * 100)}</Text>
    <Text style={{ color: "#334155" }}>
      Gender: {metadata.gender[0] === 1 ? "Female" : metadata.gender[1] === 1 ? "Male" : "N/A"}
    </Text>
    <Text style={{ color: "#334155" }}>
  Chest Location: {chestLabels[route.params.metadata.chest.findIndex((v) => v === 1)]}
</Text>
  </View>
)}

  // Test connection to backend
  const testConnection = async () => {
    const API_URL = "http://192.168.100.9:7860/test"; // Direct IP connection
    console.log(`Testing connection to: ${API_URL}`);

    try {
      // First test basic network reachability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(API_URL, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log("Connection successful:", result);

      Alert.alert(
        "✅ Connection Successful",
        `Connected to ${result.server_ip}\n\n` +
          `Mobile IP: 192.168.100.11\n` +
          `Server IP: 192.168.100.9`
      );

      return true;
    } catch (error) {
      console.error("Connection failed:", error);

      let errorMsg = error.message;
      if (error.name === "AbortError") {
        errorMsg = "Request timed out (5s) - check firewall/antivirus";
      } else if (error.message.includes("Network request failed")) {
        errorMsg = "Network unreachable - check WiFi settings";
      }

      Alert.alert(
        "❌ Connection Failed",
        `${errorMsg}\n\n` +
          `Tried connecting from:\n` +
          `Mobile (192.168.100.11) → Server (192.168.100.9:7860)\n\n` +
          `Troubleshooting:\n` +
          `1. Verify both devices on same WiFi\n` +
          `2. Disable Windows Defender Firewall temporarily\n` +
          `3. Try ping 192.168.100.9 from mobile terminal`
      );

      return false;
    }
  };

  // Upload existing WAV file
  const uploadAudio = async () => {
    try {
      // 1. First ensure we have storage permissions
      if (Platform.OS === "android") {
        // For Android 10 and below
        const apiLevel = parseInt(Platform.Version.toString(), 10);

        if (apiLevel < 30) {
          // Android 11 and below needs legacy permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: "Storage Permission",
              message: "App needs access to your files",
              buttonPositive: "OK",
            }
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              "Permission required",
              "Please allow storage access in settings"
            );
            return;
          }
        }
      }

      // 2. Launch the document picker to browse storage
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/wav", "audio/*", "*/*", "application/pdf"], // More permissive MIME types
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log("Picker result:", result);

      // 3. Handle the selected file
      if (result.type === "success") {
        // Verify it's a WAV file
        if (!result.name.toLowerCase().endsWith(".wav")) {
          Alert.alert("Invalid File", "Please select a .wav audio file");
          return;
        }

        // For Android, ensure we have a usable file URI
        let finalUri = result.uri;
        if (Platform.OS === "android") {
          // Handle content:// URIs
          if (result.uri.startsWith("content://")) {
            const cacheFile = `${FileSystem.cacheDirectory}${result.name}`;
            await FileSystem.copyAsync({
              from: result.uri,
              to: cacheFile,
            });
            finalUri = cacheFile;
          }
        }

        // Verify file exists
        const fileInfo = await FileSystem.getInfoAsync(finalUri);
        if (!fileInfo.exists) {
          throw new Error("File not found after selection");
        }

        setAudioUri(finalUri);
        Alert.alert("Success", `${result.name} selected and ready for upload`);
      }
    } catch (error) {
      console.error("File selection error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to select file. Please try again."
      );
    }
  };

  // Send audio for prediction
  const sendForPrediction = async (userId = null) => {
    if (!audioUri) {
      Alert.alert("No Audio", "Please record or upload an audio file first");
      return;
    }

    setIsLoading(true);
    const filterSettings = await AsyncStorage.getItem("audioFilters");
if (filterSettings) {
  const filters = JSON.parse(filterSettings);
  formData.append("filters", JSON.stringify(filters));
}


    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        name: "recording.wav",
        type: "audio/wav",
      });
      const metadata = route.params?.metadata;

const age = metadata?.age ?? 0.35; // normalized
const chest = metadata?.chest?.join(",") ?? Array(21).fill(0).join(",");
const gender = metadata?.gender?.join(",") ?? "0,1,0";

formData.append("age", age.toString());
formData.append("chest", chest);
formData.append("gender", gender);

      if (userId) {
        formData.append("user_id", userId);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Store prediction ID for future reference
      const predictionId = result.prediction_id;

      navigation.navigate("NewDiagnosis", {
        results: result.predictions,
        audioUri: audioUri,
        predictionId: predictionId,
      });
    } catch (error) {
      console.error("Prediction error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  // Send audio for prediction
  // const sendForPrediction = async () => {
  //   if (!audioUri) {
  //     Alert.alert("No Audio", "Please record or upload an audio file first");
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     // Read the file content
  //     const fileContent = await FileSystem.readAsStringAsync(audioUri, {
  //       encoding: FileSystem.EncodingType.Base64,
  //     });

  //     // Create form data
  //     const formData = new FormData();
  //     formData.append("audio", {
  //       uri: audioUri,
  //       name: "recording.wav",
  //       type: "audio/wav",
  //     });

  //     // Add metadata (example values - adjust as needed)
  //     formData.append("age", "35");
  //     formData.append("chest", Array(21).fill(0).join(","));
  //     formData.append("gender", "1,0,0"); // Male example

  //     const response = await fetch(API_URL, {
  //       method: "POST",
  //       body: formData,
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const result = await response.json();
  //     console.log("Prediction result:", result);

  //     navigation.navigate("NewDiagnosis", {
  //       results: result,
  //       audioUri: audioUri,
  //     });
  //   } catch (error) {
  //     console.error("Prediction error:", error);
  //     Alert.alert(
  //       "Error",
  //       `Failed to get prediction: ${error.message}\n\nMake sure your laptop and phone are on the same network and the server is running.`
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BioSonic</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Feather name="user" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Connection Test Button */}
        <TouchableOpacity style={styles.testButton} onPress={testConnection}>
          <Text style={styles.testButtonText}>Test Server Connection</Text>
        </TouchableOpacity>

{route.params?.metadata && (
  <View
    style={{
      backgroundColor: "#f0f9ff",
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: "#3b82f6",
    }}
  >
    {route.params.metadata.patientName?.length > 0 && (
      <Text style={{ color: "#334155" }}>
        Name: {route.params.metadata.patientName}
      </Text>
    )}

    <Text style={{ color: "#334155" }}>
      Age: {Math.round(route.params.metadata.age * 100)}
    </Text>

    <Text style={{ color: "#334155" }}>
      Gender:
      {route.params.metadata.gender[0] === 1
        ? " Female"
        : route.params.metadata.gender[1] === 1
        ? " Male"
        : " N/A"}
    </Text>

    <Text style={{ color: "#334155" }}>
      Chest Location:{" "}
      {
        chestLabels[
          route.params.metadata.chest.findIndex((v) => v === 1)
        ]
      }
    </Text>
  </View>
)}



        {/* Recording Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Record Chest Sounds</Text>

          <View style={styles.recordingControls}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingActive,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <FontAwesome
                name={isRecording ? "stop" : "microphone"}
                size={24}
                color="white"
              />
            </TouchableOpacity>

            <View style={styles.recordingInfo}>
              <Text style={styles.recordingStatus}>
                {isRecording ? "Recording..." : "Press to record"}
              </Text>
              {isRecording && (
                <Text style={styles.recordingTime}>
                  {formatTime(recordTime)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upload Existing Recording</Text>
          <Text style={styles.cardSubtitle}>
            WAV format (4000 Hz sampling rate)
          </Text>

          <TouchableOpacity style={styles.uploadButton} onPress={uploadAudio}>
            <MaterialIcons name="upload-file" size={24} color="#3b82f6" />
            <Text style={styles.uploadButtonText}>Select WAV File</Text>
          </TouchableOpacity>

          {audioUri && (
            <View style={styles.audioPreview}>
              <MaterialIcons name="audiotrack" size={20} color="#3b82f6" />
              <Text style={styles.audioPreviewText} numberOfLines={1}>
                {audioUri.split("/").pop()}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
  style={[styles.analyzeButton, { backgroundColor: "#0ea5e9" }]}
  onPress={() => navigation.navigate("Metadata")}
>
  <Text style={styles.analyzeButtonText}>Enter Patient Metadata</Text>
</TouchableOpacity>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (!audioUri || isLoading) && styles.analyzeButtonDisabled,
          ]}
          onPress={sendForPrediction}
          disabled={!audioUri || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.analyzeButtonText}>Analyze Recording</Text>
          )}
        </TouchableOpacity>
      </View>

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  testButton: {
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  testButtonText: {
    color: "white",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  recordingControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  recordingActive: {
    backgroundColor: "#ef4444",
  },
  recordingInfo: {
    flex: 1,
  },
  recordingStatus: {
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 4,
  },
  recordingTime: {
    fontSize: 14,
    color: "#64748b",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderRadius: 8,
    marginTop: 8,
  },
  uploadButtonText: {
    color: "#3b82f6",
    fontWeight: "500",
    marginLeft: 8,
  },
  audioPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },
  audioPreviewText: {
    marginLeft: 8,
    color: "#334155",
    flex: 1,
  },
  analyzeButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  analyzeButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  analyzeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    padding: 16,
    backgroundColor: "white",
  },
  footerButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerButtonText: {
    color: "#3b82f6",
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default HomeScreen;
