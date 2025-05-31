import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import DocumentPicker from "react-native-document-picker";
import { MaterialIcons, FontAwesome, Feather } from "@expo/vector-icons";
import BluetoothManager from "../services/BluetoothManager"; // Custom Bluetooth module

const HomeScreen = ({ navigation }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [audioUri, setAudioUri] = useState(null);

  // Request microphone permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS === "android") {
        try {
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
              "Permission required",
              "Microphone access is needed to record chest sounds"
            );
          }
        } catch (err) {
          console.warn(err);
        }
      }

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Initialize Bluetooth
      initializeBluetooth();
    })();
  }, []);

  // Initialize Bluetooth connection
  const initializeBluetooth = async () => {
    try {
      const isEnabled = await BluetoothManager.checkBluetoothEnabled();
      if (!isEnabled) {
        Alert.alert(
          "Bluetooth Disabled",
          "Please enable Bluetooth to connect to your stethoscope"
        );
        return;
      }

      // Scan for devices
      const devices = await BluetoothManager.scanDevices();
      const stethoscope = devices.find(
        (device) =>
          device.name?.includes("Littmann") ||
          device.name?.includes("Stethoscope") ||
          device.name?.includes("Eko")
      );

      if (stethoscope) {
        const connected = await BluetoothManager.connect(stethoscope.id);
        if (connected) {
          setIsConnected(true);
          setDeviceName(stethoscope.name);

          // Example: Start monitoring audio characteristics
          // You'll need to replace these with your device's actual UUIDs
          BluetoothManager.monitorCharacteristic(
            "SERVICE_UUID",
            "CHARACTERISTIC_UUID",
            (data) => {
              // Process incoming audio data
              console.log("Received audio data:", data);
            }
          );
        }
      }
    } catch (error) {
      console.error("Bluetooth error:", error);
      Alert.alert("Bluetooth Error", error.message);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      BluetoothManager.destroy();
    };
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

      // Convert to WAV format if needed
      await convertToWav(uri);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  // Convert audio to WAV format
  const convertToWav = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      // In a real app, you would use a proper audio conversion library
      // This is just a placeholder for the concept
      const wavUri = `${FileSystem.cacheDirectory}recording_${Date.now()}.wav`;
      await FileSystem.copyAsync({ from: uri, to: wavUri });

      return wavUri;
    } catch (error) {
      console.error("Conversion error:", error);
      return uri; // Fallback to original if conversion fails
    }
  };

  // Upload existing WAV file
  const uploadAudio = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
      });

      if (res[0].type === "audio/wav" || res[0].name.endsWith(".wav")) {
        setAudioUri(res[0].uri);
        Alert.alert("File Selected", "WAV file ready for analysis");
      } else {
        Alert.alert("Invalid File", "Please select a WAV format file");
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker
      } else {
        Alert.alert("Error", "Failed to select file");
        console.error(err);
      }
    }
  };

  // Send audio for prediction
  const sendForPrediction = async () => {
    if (!audioUri) {
      Alert.alert("No Audio", "Please record or upload an audio file first");
      return;
    }

    try {
      const formData = new FormData();
      const fileInfo = await FileSystem.getInfoAsync(audioUri);

      formData.append("audio", {
        uri: audioUri,
        name: "recording.wav",
        type: "audio/wav",
      });

      // Add metadata (example values - replace with actual user data)
      formData.append("age", "35");
      formData.append("chest", Array(21).fill(0).join(","));
      formData.append("gender", "1,0,0"); // Example: male

      const response = await fetch("http://your-api-url/predict", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = await response.json();
      navigation.navigate("NewDiagnosis", { results: result });
    } catch (error) {
      console.error("Prediction error:", error);
      Alert.alert("Error", "Failed to get prediction. Please try again.");
    }
  };

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
        {/* Bluetooth Status */}
        <View style={styles.bluetoothStatus}>
          <MaterialIcons
            name={isConnected ? "bluetooth-connected" : "bluetooth"}
            size={24}
            color={isConnected ? "#3b82f6" : "#64748b"}
          />
          <Text
            style={[styles.bluetoothText, isConnected && styles.connectedText]}
          >
            {isConnected ? `Connected to ${deviceName}` : "Not connected"}
          </Text>
        </View>

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

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            !audioUri && styles.analyzeButtonDisabled,
          ]}
          onPress={sendForPrediction}
          disabled={!audioUri}
        >
          <Text style={styles.analyzeButtonText}>Analyze Recording</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => navigation.navigate("History")}
        >
          <MaterialIcons name="history" size={24} color="#3b82f6" />
          <Text style={styles.footerButtonText}>History</Text>
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
  bluetoothStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  bluetoothText: {
    marginLeft: 10,
    color: "#64748b",
  },
  connectedText: {
    color: "#3b82f6",
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
