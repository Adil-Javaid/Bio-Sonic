import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import {
  MaterialIcons,
  FontAwesome,
  Feather,
  Ionicons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { useContext } from "react";
import { RecordingContext } from "../context/RecordingContext"; // adjust path

const { width, height } = Dimensions.get("window");

const API_URL = "http://192.168.0.101:7860/api/predict"; // Prediction endpoint
const TEST_API_URL = "http://192.168.100.9:7860/test"; // Test endpoint

const chestLabels = [
  "Anterior Left",
  "Anterior Left Upper",
  "Anterior Right",
  "Anterior Right Lower",
  "Anterior Right Middle",
  "Anterior Right Upper",
  "Anterior Upper Right",
  "Lateral Left",
  "Lateral Right",
  "Posterior",
  "Posterior Left",
  "Posterior Left Lower & Right",
  "Posterior Left Lower",
  "Posterior Left Middle",
  "Posterior Left Right",
  "Posterior Left Upper",
  "Posterior Right",
  "Posterior Right Lower",
  "Posterior Right Middle",
  "Posterior Right Upper",
  "Trachea",
];

// Fetch with retry logic
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      if (
        error.name === "AbortError" ||
        error.message.includes("Network request failed")
      ) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const HomeScreen = ({ navigation, route }) => {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);
  const { audioUri, setAudioUri, metadata, setMetadata } = useContext(RecordingContext);

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

  useFocusEffect(
  React.useCallback(() => {
    if (route.params?.selectedAudio) {
      const audio = route.params.selectedAudio;
      setAudioUri(audio.uri);
      Alert.alert("Audio Selected", `${audio.filename} is ready for analysis`);
    }
  }, [route.params?.selectedAudio])
);


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

      let seconds = 0;
      const timer = setInterval(() => {
        seconds++;
        setRecordTime(seconds);
      }, 1000);

      recording.setOnRecordingStatusUpdate(() => {});
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
      Alert.alert("Recording Error", "Failed to stop recording.");
    }
  };

  // Upload existing WAV file
  const uploadAudio = async () => {
    try {
      if (Platform.OS === "android") {
        const apiLevel = parseInt(Platform.Version.toString(), 10);
        if (apiLevel < 30) {
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
              "Permission Required",
              "Please allow storage access in settings"
            );
            return;
          }
        }
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.type === "success") {
        const fileName = result.name || "audio_file";
        const extension = fileName.split(".").pop().toLowerCase();

        const allowed = ["wav", "mp3", "m4a", "aac"];
        if (!allowed.includes(extension)) {
          Alert.alert(
            "Unsupported File",
            "Please select a supported audio file (.wav, .mp3, .m4a, .aac)"
          );
          return;
        }

        let finalUri = result.uri;
        if (Platform.OS === "android" && result.uri.startsWith("content://")) {
          const cacheFile = `${FileSystem.cacheDirectory}${fileName}`;
          await FileSystem.copyAsync({
            from: result.uri,
            to: cacheFile,
          });
          finalUri = cacheFile;
        }

        const fileInfo = await FileSystem.getInfoAsync(finalUri);
        if (!fileInfo.exists) {
          throw new Error("File not found after selection");
        }

        setAudioUri(finalUri);
        Alert.alert(
          "Audio Ready",
          `${fileName} (${(fileInfo.size / 1024).toFixed(
            1
          )} KB) is ready for analysis`
        );
      }
    } catch (error) {
      console.error("File selection error:", error);
      Alert.alert("Error", error.message || "Failed to select file.");
    }
  };

  // Test connection to backend
  const testConnection = async () => {
    console.log(`Testing connection to: ${TEST_API_URL}`);
    try {
      const result = await fetchWithRetry(TEST_API_URL, {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });
      console.log("Connection successful:", result);
      Alert.alert(
        "✅ Connection Successful",
        `Connected to ${result.server_ip}\n\nMobile IP: 192.168.100.11\nServer IP: 192.168.100.9`
      );
    } catch (error) {
      console.error("Connection failed:", error);
      let errorMsg = error.message;
      if (error.name === "AbortError") {
        errorMsg = "Request timed out (10s) - check firewall/antivirus";
      } else if (error.message.includes("Network request failed")) {
        errorMsg = "Network unreachable - check WiFi settings";
      }
      Alert.alert(
        "❌ Connection Failed",
        `${errorMsg}\n\nTried connecting from:\nMobile (192.168.100.11) → Server (192.168.100.9:7860)\n\nTroubleshooting:\n1. Verify both devices on same WiFi\n2. Disable Windows Defender Firewall temporarily\n3. Try ping 192.168.100.9 from mobile terminal`,
        [{ text: "Retry", onPress: testConnection }, { text: "Cancel" }]
      );
    }
  };

  // Send audio for prediction
  const sendForPrediction = async () => {
    if (!audioUri || !metadata) {
      Alert.alert("Missing Data", "Please upload audio and enter metadata.");
      return;
    }

    setIsLoading(true);
    setElapsedTime(0);

    intervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: audioUri,
        name: "recording.wav",
        type: "audio/wav",
      });

      formData.append("age", metadata.age.toString());
      formData.append("chest", metadata.chest.join(","));
      formData.append("gender", metadata.gender.join(","));

      const userId = await AsyncStorage.getItem("userId");
      if (userId) formData.append("user_id", userId);

      const result = await Promise.race([
  fetchWithRetry(API_URL, {
    method: "POST",
    body: formData,
    headers: { "Content-Type": "multipart/form-data" },
  }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out after 30s")), 30000)
  )
]);


      clearInterval(intervalRef.current);
      setIsLoading(false);
      setElapsedTime(0);

      navigation.navigate("NewDiagnosis", {
        results: result.predictions,
        audioUri,
        predictionId: result.prediction_id,
        patient_id: result.patient_id,
        metadata,
      });
    } catch (error) {
      clearInterval(intervalRef.current);
      setIsLoading(false);
      setElapsedTime(0);

      console.error("Prediction error:", error.message);
      Alert.alert("Error", error.message || "Prediction failed");
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <SafeAreaView style={styles.container}>
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

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }}
            >
              <Text style={styles.title}>BioSonic Health</Text>
              <Text style={styles.tagline}>AI-Powered Diagnostics</Text>
            </Animated.View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              accessibilityLabel="Profile"
            >
              <Feather name="user" size={28} color="#f1faee" />
            </TouchableOpacity>
          </View>

          {/* Animated Content */}
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Metadata Display */}
            {metadata && (
              <View style={styles.metadataCard}>
                {metadata.patientName?.length > 0 && (
                  <View style={styles.featureItem}>
                    <Ionicons name="person-outline" size={20} color="#f1faee" />
                    <Text style={styles.featureText}>
                      Name: {metadata.patientName}
                    </Text>
                  </View>
                )}
                <View style={styles.featureItem}>
                  <Ionicons name="calendar-outline" size={20} color="#f1faee" />
                  <Text style={styles.featureText}>
                    Age: {Math.round(metadata.age * 100)}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="male-female-outline"
                    size={20}
                    color="#f1faee"
                  />
                  <Text style={styles.featureText}>
                    Gender:{" "}
                    {metadata.gender[0] === 1
                      ? "Female"
                      : metadata.gender[1] === 1
                      ? "Male"
                      : "N/A"}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="body-outline" size={20} color="#f1faee" />
                  <Text style={styles.featureText}>
                    Chest Location:{" "}
                    {chestLabels[metadata.chest.findIndex((v) => v === 1)]}
                  </Text>
                </View>
              </View>
            )}

            {/* Test Connection Button */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={testConnection}
              accessibilityLabel="Test Server Connection"
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#f1faee", "#a8dadc"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="cloud-outline" size={20} color="#1d3557" />
                <Text style={styles.buttonTextPrimary}>
                  Test Server Connection
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Upload Section */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Upload Existing Recording</Text>
              <Text style={styles.cardSubtitle}>
  Supported: .wav, .mp3, .m4a, .aac {"\n"}
  Tap "Browse" in the picker to find full storage
</Text>

              <TouchableOpacity
  style={[styles.button, styles.secondaryButton]}
  onPress={() => navigation.navigate("AudioPicker")}
  accessibilityLabel="Browse Audio Files"
  activeOpacity={0.8}
>
  <View style={styles.secondaryButtonContent}>
    <Ionicons name="musical-notes-outline" size={20} color="#f1faee" />
    <Text style={styles.buttonTextSecondary}>Browse Audio Files</Text>
  </View>
</TouchableOpacity>

              {audioUri && (
                <View style={styles.audioPreview}>
                  <Ionicons
                    name="musical-notes-outline"
                    size={20}
                    color="#f1faee"
                  />
                  <Text style={styles.audioPreviewText} numberOfLines={1}>
                    {decodeURIComponent(audioUri.split("/").pop())}
                  </Text>
                </View>
              )}
            </View>

            {/* Metadata Button */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate("Metadata")}
              accessibilityLabel="Enter Patient Metadata"
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#f1faee", "#a8dadc"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#1d3557"
                />
                <Text style={styles.buttonTextPrimary}>
                  Enter Patient Metadata
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Analyze Button */}
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (!audioUri || isLoading) && styles.buttonDisabled,
              ]}
              onPress={sendForPrediction}
              disabled={!audioUri || !metadata || isLoading}
              accessibilityLabel="Analyze Recording"
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#f1faee", "#a8dadc"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator
                      color="#1d3557"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.buttonTextPrimary}>
                      Analyzing... {elapsedTime}s
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="analytics-outline"
                      size={20}
                      color="#1d3557"
                    />
                    <Text style={styles.buttonTextPrimary}>
                      Analyze Recording
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Medical Icons Decoration */}
          <View style={styles.decorativeIcons}>
            <Ionicons
              name="heart-outline"
              size={24}
              color="#a8dadc"
              style={styles.decorIcon1}
            />
            <Ionicons
              name="medical-outline"
              size={20}
              color="#a8dadc"
              style={styles.decorIcon2}
            />
            <Ionicons
              name="fitness-outline"
              size={22}
              color="#a8dadc"
              style={styles.decorIcon3}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
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
    paddingVertical: 20,
  },
  title: {
    fontSize: 42,
    paddingTop: 34,
    fontWeight: "800",
    color: "#f1faee",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 20,
    fontWeight: "600",
    color: "#a8dadc",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  metadataCard: {
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  card: {
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f1faee",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#a8dadc",
    marginBottom: 12,
  },
  recordingControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 18,
    color: "#f1faee",
    marginBottom: 4,
  },
  recordingTime: {
    fontSize: 16,
    color: "#a8dadc",
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
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
  secondaryButtonContent: {
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
  buttonDisabled: {
    opacity: 0.6,
  },
  audioPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 8,
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    borderRadius: 8,
  },
  audioPreviewText: {
    marginLeft: 8,
    color: "#f1faee",
    fontSize: 16,
    flex: 1,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  featureText: {
    color: "#f1faee",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
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

export default HomeScreen;
