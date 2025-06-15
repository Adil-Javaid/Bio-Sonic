import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Animated,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import debounce from "lodash.debounce";
import BluetoothManager from "../services/BluetoothManager"; // Custom Bluetooth module

const BASE_URL = "http://192.168.0.101:8080"; // Align with SettingsScreen.js

// Custom axios retry logic
const axiosWithRetry = async (config, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios(config);
    } catch (error) {
      if (i === retries - 1) throw error;
      if (error.code === "ECONNABORTED" || error.response?.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

const MedicalSignUp = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [emailExists, setEmailExists] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const pulseAnim = useRef(new Animated.Value(1)).current;
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

  const pulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const checkEmailExists = debounce(async (email) => {
    if (!email) return;
    try {
      const response = await axiosWithRetry({
        method: "post",
        url: `${BASE_URL}/api/user/check-email`,
        data: { email },
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
      if (response.data.exists) {
        setError("Email already exists.");
        setEmailExists(true);
      } else {
        setError("");
        setEmailExists(false);
      }
    } catch (error) {
      console.error("Error checking email:", error.message);
      setError("Failed to check email availability.");
      Alert.alert(
        "Network Error",
        "Unable to verify email. Check your connection and try again.",
        [
          { text: "Retry", onPress: () => checkEmailExists(email) },
          { text: "Continue" },
        ]
      );
    }
  }, 500);

  const handleSubmit = async () => {
    pulse();

    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9]{0,9}$/.test(username)) {
      setError("Username must start with a letter and be up to 10 characters long.");
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      setError("Password must be at least 8 characters and include letters and numbers.");
      return;
    }

    if (emailExists) {
      setError("Email already exists.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axiosWithRetry({
        method: "post",
        url: `${BASE_URL}/api/user`,
        data: { username, email, password },
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      // Store userId
      const userId = response.data.userId || response.data.id;
      if (userId) {
        await AsyncStorage.setItem("userId", userId.toString());
      }

      // Clear form
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setEmailExists(null);

      Alert.alert("Registration Successful", response.data.message || "Account created!");
      setLoading(false);
      setShowRolePopup(true);
    } catch (error) {
      console.error("Registration error:", error.message);
      setError(
        error.response?.data?.message ||
        (error.code === "ECONNABORTED" ? "Request timed out." : "Failed to register.")
      );
      Alert.alert(
        "Network Error",
        error.code === "ECONNABORTED" ? "Request timed out. Check your connection." : "Failed to register.",
        [
          { text: "Retry", onPress: handleSubmit },
          { text: "Cancel" },
        ]
      );
      setLoading(false);
    }
  };

  const handleRoleSelection = async (role) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        await AsyncStorage.setItem("userRole", role);
        // Optionally update backend
        await axiosWithRetry({
          method: "patch",
          url: `${BASE_URL}/api/user/${userId}`,
          data: { role },
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        });
      }
      setShowRolePopup(false);
      navigation.navigate("Login");
    } catch (error) {
      console.error("Role selection error:", error.message);
      Alert.alert("Error", "Failed to save role. Please try again.");
    }
  };

  return (
    <LinearGradient
      colors={["#4fc3f7", "#0288d1", "#01579b"]}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.appName}>BioSonic Health</Text>
                <Text style={styles.tagline}>Precision Diagnostics Through AI</Text>
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

              {/* Form */}
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Create Your Account</Text>

                {error ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={20} color="#ef4444" style={styles.errorIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={[styles.inputContainer, focusedField === "username" && styles.inputFocused]}>
                  <MaterialIcons name="person" size={20} color="#0ff72a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#d8bed6"
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => {
                      setFocusedField(null);
                      if (!/^[a-zA-Z][a-zA-Z0-9]{0,9}$/.test(username) && username) {
                        setError("Username must start with a letter and be up to 10 characters long.");
                      } else {
                        setError("");
                      }
                    }}
                    accessibilityLabel="Username Input"
                  />
                </View>

                <View style={[
                  styles.inputContainer,
                  focusedField === "email" && styles.inputFocused,
                  emailExists === false && styles.inputValid,
                  emailExists === true && styles.inputInvalid,
                ]}>
                  <MaterialIcons name="email" size={20} color="#0ff72a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#d8bed6"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => {
                      setFocusedField(null);
                      checkEmailExists(email);
                    }}
                    accessibilityLabel="Email Input"
                  />
                  {emailExists === false && (
                    <MaterialIcons name="check-circle" size={18} color="#10b981" style={styles.validationIcon} />
                  )}
                  {emailExists === true && (
                    <MaterialIcons name="error" size={18} color="#ef4444" style={styles.validationIcon} />
                  )}
                </View>

                <View style={[styles.inputContainer, focusedField === "password" && styles.inputFocused]}>
                  <MaterialIcons name="lock" size={20} color="#0ff72a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#d8bed6"
                    secureTextEntry
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (text && !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(text)) {
                        setError("Password must be at least 8 characters and include letters and numbers.");
                      } else {
                        setError("");
                      }
                    }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    accessibilityLabel="Password Input"
                  />
                </View>

                <View style={[styles.inputContainer, focusedField === "confirmPassword" && styles.inputFocused]}>
                  <MaterialIcons name="lock" size={20} color="#0ff72a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#d8bed6"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    accessibilityLabel="Confirm Password Input"
                  />
                </View>

                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[styles.signUpButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                    accessibilityLabel="Create Account Button"
                  >
                    <LinearGradient
                      colors={["#0288d1", "#01579b"]}
                      style={styles.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.buttonText}>Create Account</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => Alert.alert("Feature Coming Soon", "Google Sign-Up is not yet available.")}
                  accessibilityLabel="Continue with Google"
                >
                  <Ionicons name="logo-google" size={20} color="#0ff72a" style={styles.googleIcon} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.loginPrompt}>
                  <Text style={styles.loginText}>Already have an account?</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                    accessibilityLabel="Sign In Link"
                  >
                    <Text style={styles.loginLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Role Selection Modal */}
              {showRolePopup && (
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Your Role</Text>
                      <TouchableOpacity
                        onPress={() => setShowRolePopup(false)}
                        accessibilityLabel="Close Role Selection"
                      >
                        <MaterialIcons name="close" size={24} color="#0ff72a" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalSubtitle}>Choose how you'll use BioSonic Health</Text>

                    <TouchableOpacity
                      style={styles.roleButton}
                      onPress={() => handleRoleSelection("patient")}
                      accessibilityLabel="Select Patient Role"
                    >
                      <LinearGradient
                        colors={["#e3f2fd", "#bbdefb"]}
                        style={styles.roleButtonGradient}
                      >
                        <MaterialIcons name="person" size={40} color="#0ff72a" style={styles.roleIcon} />
                        <Text style={styles.roleButtonText}>I'm a Patient</Text>
                        <Text style={styles.roleDescription}>Track my health and get AI analysis</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.roleButton}
                      onPress={() => handleRoleSelection("doctor")}
                      accessibilityLabel="Select Doctor Role"
                    >
                      <LinearGradient
                        colors={["#e8f5e9", "#c8e6c9"]}
                        style={styles.roleButtonGradient}
                      >
                        <MaterialIcons name="medical-services" size={40} color="#0ff72a" style={styles.roleIcon} />
                        <Text style={styles.roleButtonText}>I'm a Doctor</Text>
                        <Text style={styles.roleDescription}>Access patient data and diagnostic tools</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Text style={styles.footerText}>BioSonic © 2025 | Medical Support Available</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingTop: 28,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 16,
    color: "#b2ebf2",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textAlign: "center",
    marginTop: 8,
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
    color: "#0ff72a",
    fontWeight: "500",
  },
  connectedText: {
    color: "#0288d1",
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4fc3f7",
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 50,
  },
  inputFocused: {
    borderColor: "#0288d1",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  inputValid: {
    borderColor: "#10b981",
  },
  inputInvalid: {
    borderColor: "#ef4444",
  },
  inputIcon: {
    marginRight: 10,
  },
  validationIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#0ff72a",
    fontSize: 16,
  },
  signUpButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
    height: 50,
  },
  disabledButton: {
    opacity: 0.7,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "#b2ebf2",
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4fc3f7",
    marginBottom: 20,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "#b2ebf2",
    fontSize: 16,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  loginLink: {
    color: "#4fc3f7",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 5,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    flex: 1,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    color: "#0ff72a",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  roleButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  roleButtonGradient: {
    padding: 20,
    alignItems: "center",
  },
  roleIcon: {
    marginBottom: 12,
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0ff72a",
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
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

export default MedicalSignUp;