import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
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
import config from "../../config";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";

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
  const pulseAnim = new Animated.Value(1);

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
        colors={["#e8f4f8", "#d0e8f0", "#b8dce8"]}
        style={styles.background}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Animated Header with Medical Theme */}
          <Animatable.View
            animation="fadeInDown"
            duration={1000}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/Logo.jpg")}
                style={styles.logo}
              />
              <View style={styles.cellAnimation}>
                {[...Array(6)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.cell,
                      {
                        top: Math.random() * 30,
                        left: Math.random() * 30,
                        opacity: Math.random() * 0.5 + 0.3,
                        transform: [{ scale: Math.random() * 0.5 + 0.5 }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.appName}>BioSonic Health</Text>
            <Text style={styles.tagline}>Precision Diagnostics Through AI</Text>
          </Animatable.View>

          {/* Registration Form */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={300}
            style={styles.formContainer}
          >
            <Text style={styles.formTitle}>Create Your Account</Text>

            {error ? (
              <Animatable.View
                animation="shake"
                duration={500}
                style={styles.errorContainer}
              >
                <Image
                  source={require("../../assets/close.png")}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{error}</Text>
              </Animatable.View>
            ) : null}

            <View
              style={[
                styles.inputContainer,
                focusedField === "username" && styles.inputFocused,
              ]}
            >
              <Image
                source={require("../../assets/User.png")}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#7f8c8d"
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
              <Image
                source={require("../../assets/email.png")}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#7f8c8d"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => {
                  setFocusedField(null);
                  checkEmailExists(email);
                }}
              />
              {emailExists === false && (
                <Image
                  source={require("../../assets/check-mark.png")}
                  style={styles.validationIcon}
                />
              )}
              {emailExists === true && (
                <Image
                  source={require("../../assets/close.png")}
                  style={styles.validationIcon}
                />
              )}
            </View>

            <View
              style={[
                styles.inputContainer,
                focusedField === "password" && styles.inputFocused,
              ]}
            >
              <Image
                source={require("../../assets/password.png")}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#7f8c8d"
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
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                focusedField === "confirmPassword" && styles.inputFocused,
              ]}
            >
              <Image
                source={require("../../assets/password.png")}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#7f8c8d"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#3498db", "#2980b9"]}
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

            <TouchableOpacity style={styles.googleButton} onPress={() => {}}>
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
                }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Role Selection Modal */}
          {showRolePopup && (
            <View style={styles.modalOverlay}>
              <Animatable.View
                animation="zoomIn"
                duration={500}
                style={styles.modalContainer}
              >
                <Text style={styles.modalTitle}>Select Your Role</Text>
                <Text style={styles.modalSubtitle}>
                  Choose how you'll use BioSonic Health
                </Text>

                <TouchableOpacity
                  style={[styles.roleButton, styles.patientButton]}
                  onPress={() => handleRoleSelection("patient")}
                >
                  <LinearGradient
                    colors={["#e3f2fd", "#bbdefb"]}
                    style={styles.roleButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Image
                      source={require("../../assets/medical.png")}
                      style={styles.roleIcon}
                    />
                    <Text style={styles.roleButtonText}>I'm a Patient</Text>
                    <Text style={styles.roleDescription}>
                      Track my health and get AI analysis
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleButton, styles.doctorButton]}
                  onPress={() => handleRoleSelection("doctor")}
                >
                  <LinearGradient
                    colors={["#e8f5e9", "#c8e6c9"]}
                    style={styles.roleButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Image
                      source={require("../../assets/doctor.png")}
                      style={styles.roleIcon}
                    />
                    <Text style={styles.roleButtonText}>I'm a Doctor</Text>
                    <Text style={styles.roleDescription}>
                      Access patient data and diagnostic tools
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            </View>
          )}
        </ScrollView>
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
    width: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    paddingVertical: height * 0.05,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoContainer: {
    position: "relative",
    width: 100,
    height: 100,
    marginBottom: 15,
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    zIndex: 2,
  },
  cellAnimation: {
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  cell: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3498db",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 5,
    fontFamily: "sans-serif-condensed",
  },
  tagline: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    fontStyle: "italic",
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 25,
    textAlign: "center",
    fontFamily: "sans-serif-condensed",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#dfe6e9",
    height: 55,
  },
  inputFocused: {
    borderColor: "#3498db",
    backgroundColor: "#fff",
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  inputValid: {
    borderColor: "#2ecc71",
  },
  inputInvalid: {
    borderColor: "#e74c3c",
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "#7f8c8d",
  },
  validationIcon: {
    width: 18,
    height: 18,
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#2c3e50",
    fontSize: 16,
    fontFamily: "Roboto",
  },
  signUpButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 10,
    height: 55,
    shadowColor: "#3498db",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Roboto",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#dfe6e9",
  },
  dividerText: {
    color: "#7f8c8d",
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dfe6e9",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: "#2c3e50",
    fontWeight: "500",
    fontSize: 15,
    fontFamily: "Roboto",
  },
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#7f8c8d",
    fontSize: 15,
  },
  loginLink: {
    color: "#3498db",
    fontWeight: "600",
    marginLeft: 5,
    fontSize: 15,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdecea",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  errorIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 5,
    fontFamily: "sans-serif-condensed",
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 25,
  },
  roleButton: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 1,
  },
  patientButton: {
    borderColor: "#bbdefb",
  },
  doctorButton: {
    borderColor: "#c8e6c9",
  },
  roleButtonGradient: {
    padding: 20,
    alignItems: "center",
  },
  roleIcon: {
    width: 50,
    height: 50,
    marginBottom: 15,
    tintColor: "#2c3e50",
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 5,
    fontFamily: "sans-serif-condensed",
  },
  roleDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    fontFamily: "Roboto",
  },
});

export default MedicalSignUp;
