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
  Modal,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config";
import { login } from "../services/authService";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] =
    useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState({
    text: "",
    isError: false,
  });

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setResetMessage({ text: "Email is required", isError: true });
      return;
    }

    try {
      setResetMessage({ text: "Sending OTP...", isError: false });
      const response = await axios.post(
        `${config.API_BASE_URL}auth/forgot-password`,
        { email: resetEmail }
      );

      if (response.data.success) {
        setResetStep(2);
        setResetMessage({
          text: "OTP sent to your email",
          isError: false,
        });
      } else {
        setResetMessage({
          text: response.data.message,
          isError: true,
        });
      }
    } catch (err) {
      setResetMessage({
        text: err.response?.data?.message || "Failed to send OTP",
        isError: true,
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setResetMessage({ text: "OTP is required", isError: true });
      return;
    }

    try {
      setResetMessage({ text: "Verifying OTP...", isError: false });
      const response = await axios.post(
        `${config.API_BASE_URL}auth/verify-otp`,
        { email: resetEmail, otp }
      );

      if (response.data.success) {
        setResetToken(response.data.resetToken);
        setResetStep(3);
        setResetMessage({
          text: "OTP verified. Set new password",
          isError: false,
        });
      } else {
        setResetMessage({
          text: response.data.message,
          isError: true,
        });
      }
    } catch (err) {
      setResetMessage({
        text: err.response?.data?.message || "Failed to verify OTP",
        isError: true,
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      setResetMessage({
        text: "Both password fields are required",
        isError: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetMessage({
        text: "Passwords don't match",
        isError: true,
      });
      return;
    }

    try {
      setResetMessage({ text: "Updating password...", isError: false });
      const response = await axios.post(
        `${config.API_BASE_URL}auth/reset-password`,
        { resetToken, newPassword }
      );

      if (response.data.success) {
        setResetMessage({
          text: "Password updated successfully!",
          isError: false,
        });
        setTimeout(() => {
          setForgotPasswordModalVisible(false);
          resetForgotPasswordState();
        }, 2000);
      } else {
        setResetMessage({
          text: response.data.message,
          isError: true,
        });
      }
    } catch (err) {
      setResetMessage({
        text: err.response?.data?.message || "Failed to reset password",
        isError: true,
      });
    }
  };

  const resetForgotPasswordState = () => {
    setResetStep(1);
    setResetEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
    setResetMessage({ text: "", isError: false });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await login(email, password);

      // Check if response and token exist
      if (!response || !response.token) {
        throw new Error("Invalid login response");
      }

      // Ensure we have valid values before storing
      await AsyncStorage.setItem("authToken", response.token || "");
      await AsyncStorage.setItem("userRole", response.role || "user");

      Alert.alert("Success", "Logged in successfully!");
      navigation.navigate(response.role === "user" ? "Home" : "Home");
    } catch (err) {
      let errorMessage = "An unexpected error occurred";
      if (err.response) {
        errorMessage = err.response.data?.message || "Login failed";
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.request) {
        errorMessage = "Network error - please check your connection";
      }

      setError(errorMessage);

      // Clear invalid storage if any was set
      await AsyncStorage.multiRemove(["authToken", "userRole"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/favicon.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome to BioSonic</Text>
          <Text style={styles.subtitle}>AI-Powered Medical Diagnostics</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={20} color="#e63946" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#457b9d"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#a8dadc"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#457b9d"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#a8dadc"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#457b9d"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setForgotPasswordModalVisible(true)}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={["#1d3557", "#457b9d"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Login</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.signupContainer}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot Password Modal */}
        <Modal
          visible={forgotPasswordModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setForgotPasswordModalVisible(false);
            resetForgotPasswordState();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>

              {resetMessage.text ? (
                <Text
                  style={[
                    styles.modalMessage,
                    resetMessage.isError
                      ? styles.modalError
                      : styles.modalSuccess,
                  ]}
                >
                  {resetMessage.text}
                </Text>
              ) : null}

              {resetStep === 1 && (
                <>
                  <Text style={styles.modalText}>
                    Enter your email to receive a password reset OTP
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Email"
                    placeholderTextColor="#a8dadc"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleForgotPassword}
                  >
                    <Text style={styles.modalButtonText}>Send OTP</Text>
                  </TouchableOpacity>
                </>
              )}

              {resetStep === 2 && (
                <>
                  <Text style={styles.modalText}>
                    Enter the 6-digit OTP sent to {resetEmail}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="OTP"
                    placeholderTextColor="#a8dadc"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleVerifyOtp}
                  >
                    <Text style={styles.modalButtonText}>Verify OTP</Text>
                  </TouchableOpacity>
                </>
              )}

              {resetStep === 3 && (
                <>
                  <Text style={styles.modalText}>Enter your new password</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="New Password"
                    placeholderTextColor="#a8dadc"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Confirm Password"
                    placeholderTextColor="#a8dadc"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handlePasswordReset}
                  >
                    <Text style={styles.modalButtonText}>Reset Password</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setForgotPasswordModalVisible(false);
                  resetForgotPasswordState();
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1faee",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1d3557",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#457b9d",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(230, 57, 70, 0.1)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: "#e63946",
    marginLeft: 10,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1faee",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#a8dadc",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#1d3557",
    fontSize: 16,
  },
  passwordToggle: {
    padding: 10,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: "#457b9d",
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#a8dadc",
  },
  dividerText: {
    color: "#457b9d",
    marginHorizontal: 10,
    fontSize: 14,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  signupText: {
    color: "#1d3557",
    fontSize: 14,
  },
  signupLink: {
    color: "#457b9d",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(29, 53, 87, 0.7)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "85%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1d3557",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: {
    color: "#457b9d",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#f1faee",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: "#1d3557",
    borderWidth: 1,
    borderColor: "#a8dadc",
  },
  modalButton: {
    backgroundColor: "#457b9d",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  modalCancelButton: {
    backgroundColor: "#e63946",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalMessage: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    textAlign: "center",
  },
  modalError: {
    backgroundColor: "rgba(230, 57, 70, 0.1)",
    color: "#e63946",
  },
  modalSuccess: {
    backgroundColor: "rgba(69, 123, 157, 0.1)",
    color: "#457b9d",
  },
});

export default LoginScreen;
