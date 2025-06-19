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
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import config from "../../config";

const { width, height } = Dimensions.get("window");

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

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for button
  const pulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

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

  const handleSubmit = async () => {
    pulse();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9]{0,9}$/.test(username)) {
      setError(
        "Username must start with a letter and be up to 10 characters long."
      );
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      setError(
        "Password must be at least 8 characters long and include both letters and numbers."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}api/user`,
        {
          username,
          email,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      Alert.alert("Registration Successful", response.data.message);
      setLoading(false);
      setShowRolePopup(true);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      setLoading(false);
    }
  };

  const handleRoleSelection = (role) => {
    setShowRolePopup(false);
    navigation.navigate("Login");
  };

  const checkEmailExists = async (email) => {
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}api/user/check-email`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.exists) {
        setError("Email already exists.");
        setEmailExists(true);
      } else {
        setError("");
        setEmailExists(false);
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setError("Error checking email availability");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["#1d3557", "#457b9d", "#a8dadc"]}
        style={styles.background}
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
          {/* Animated Header */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <View style={styles.header}>
              <Text style={styles.appName}>BioSonic Health</Text>
              <Text style={styles.tagline}>Precision Diagnostics Through AI</Text>
            </View>
          </Animated.View>

          {/* Animated Form */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Create Your Account</Text>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color="#f1faee" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View
                style={[
                  styles.inputContainer,
                  focusedField === "username" && styles.inputFocused,
                ]}
              >
                <Ionicons name="person-outline" size={20} color="#a8dadc" />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#a8dadc"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => {
                    setFocusedField(null);
                    if (!/^[a-zA-Z][a-zA-Z0-9]{0,9}$/.test(username)) {
                      setError(
                        "Username must start with a letter and be up to 10 characters long."
                      );
                    } else {
                      setError("");
                    }
                  }}
                  accessibilityLabel="Username"
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  focusedField === "email" && styles.inputFocused,
                  emailExists === false && styles.inputValid,
                  emailExists === true && styles.inputInvalid,
                ]}
              >
                <Ionicons name="mail-outline" size={20} color="#a8dadc" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#a8dadc"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => {
                    setFocusedField(null);
                    checkEmailExists(email);
                  }}
                  accessibilityLabel="Email"
                />
                {emailExists === false && (
                  <Ionicons name="checkmark-circle-outline" size={20} color="#f1faee" />
                )}
                {emailExists === true && (
                  <Ionicons name="close-circle-outline" size={20} color="#f1faee" />
                )}
              </View>

              <View
                style={[
                  styles.inputContainer,
                  focusedField === "password" && styles.inputFocused,
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#a8dadc" />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#a8dadc"
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(text)) {
                      setError(
                        "Password must be at least 8 characters long and include both letters and numbers."
                      );
                    } else {
                      setError("");
                    }
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  accessibilityLabel="Password"
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  focusedField === "confirmPassword" && styles.inputFocused,
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#a8dadc" />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#a8dadc"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  accessibilityLabel="Confirm Password"
                />
              </View>

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
                    { scale: pulseAnim },
                  ],
                }}
              >
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={loading}
                  accessibilityLabel="Create Account"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#f1faee", "#a8dadc"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#1d3557" />
                    ) : (
                      <>
                        <Ionicons name="person-add-outline" size={20} color="#1d3557" />
                        <Text style={styles.buttonTextPrimary}>Create Account</Text>
                      </>
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
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {}}
                accessibilityLabel="Continue with Google"
                activeOpacity={0.8}
              >
                <View style={styles.secondaryButtonContent}>
                  <Ionicons name="logo-google" size={20} color="#f1faee" />
                  <Text style={styles.buttonTextSecondary}>Continue with Google</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.loginPrompt}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Medical Icons Decoration */}
          <View style={styles.decorativeIcons}>
            <Ionicons name="heart-outline" size={24} color="#a8dadc" style={styles.decorIcon1} />
            <Ionicons name="medical-outline" size={20} color="#a8dadc" style={styles.decorIcon2} />
            <Ionicons name="fitness-outline" size={22} color="#a8dadc" style={styles.decorIcon3} />
          </View>
        </ScrollView>

        {/* Role Selection Modal */}
        {showRolePopup && (
          <View style={styles.modalOverlay}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }}
            >
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Select Your Role</Text>
                <Text style={styles.modalSubtitle}>
                  Choose how you'll use BioSonic Health
                </Text>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => handleRoleSelection("patient")}
                  accessibilityLabel="Select Patient Role"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#f1faee", "#a8dadc"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="person-outline" size={20} color="#1d3557" />
                    <Text style={styles.buttonTextPrimary}>I'm a Patient</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => handleRoleSelection("doctor")}
                  accessibilityLabel="Select Doctor Role"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#f1faee", "#a8dadc"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="medkit-outline" size={20} color="#1d3557" />
                    <Text style={styles.buttonTextPrimary}>I'm a Doctor</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
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
    alignItems: "center",
    paddingVertical: height * 0.05,
    marginBottom: 20,
  },
  appName: {
    fontSize: 42,
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
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  formContainer: {
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f1faee",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.3)",
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 56,
  },
  inputFocused: {
    borderColor: "#f1faee",
  },
  inputValid: {
    borderColor: "#f1faee",
  },
  inputInvalid: {
    borderColor: "#f1faee",
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#f1faee",
    paddingVertical: 12,
    paddingHorizontal: 8,
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
  disabledButton: {
    opacity: 0.6,
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(241, 250, 238, 0.3)",
  },
  dividerText: {
    color: "#f1faee",
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#f1faee",
    fontSize: 16,
  },
  loginLink: {
    color: "#f1faee",
    fontWeight: "700",
    marginLeft: 5,
    fontSize: 16,
    textDecorationLine: "underline",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.3)",
  },
  errorText: {
    color: "#f1faee",
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(29, 53, 87, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f1faee",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#a8dadc",
    textAlign: "center",
    marginBottom: 20,
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

export default MedicalSignUp;