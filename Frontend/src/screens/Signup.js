import React, { useState } from 'react';
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
} from "react-native";
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import config from '../../config';

const MedicalSignUp = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [emailExists, setEmailExists] = useState(null);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!username || !email || !password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9]{0,9}$/.test(username)) {
      setError("Username must start with a letter and be up to 10 characters long.");
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      setError("Password must be at least 8 characters long and include both letters and numbers.");
      return;
    }

    setError('');
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
    navigation.navigate('Login');
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with Medical Theme */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/icon.png')} // Replace with your medical logo
            style={styles.logo}
          />
          <Text style={styles.appName}>BioSonic Health</Text>
          <Text style={styles.tagline}>AI-Powered Medical Diagnostics</Text>
        </View>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Create Your Account</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Image 
              source={require('../../assets/User.png')} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#A0AEC0"
              value={username}
              onChangeText={setUsername}
              onBlur={() => {
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

          <View style={styles.inputContainer}>
            <Image 
              source={require('../../assets/email.png')} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0AEC0"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onBlur={() => checkEmailExists(email)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Image 
              source={require('../../assets/password.png')} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0AEC0"
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
            />
          </View>

          <View style={styles.inputContainer}>
            <Image 
              source={require('../../assets/password.png')} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#A0AEC0"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity 
            style={[styles.signUpButton, loading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={() => {}}
          >
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} 
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Selection Modal */}
        {showRolePopup && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select Your Role</Text>
              <Text style={styles.modalSubtitle}>Choose how you'll use BioSonic Health</Text>
              
              <TouchableOpacity
                style={[styles.roleButton, styles.patientButton]}
                onPress={() => handleRoleSelection("patient")}
              >
                <Image 
                  source={require('../../assets/icon.png')}
                  style={styles.roleIcon}
                />
                <Text style={styles.roleButtonText}>I'm a Patient</Text>
                <Text style={styles.roleDescription}>
                  Track my health and get AI analysis
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleButton, styles.doctorButton]}
                onPress={() => handleRoleSelection("doctor")}
              >
                <Image 
                  source={require('../../assets/icon.png')}
                  style={styles.roleIcon}
                />
                <Text style={styles.roleButtonText}>I'm a Doctor</Text>
                <Text style={styles.roleDescription}>
                  Access patient data and diagnostic tools
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 25,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#4A5568',
  },
  input: {
    flex: 1,
    height: 50,
    color: '#2D3748',
    fontSize: 15,
  },
  signUpButton: {
    backgroundColor: '#4299E1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#4299E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#BEE3F8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#718096',
    paddingHorizontal: 10,
    fontSize: 12,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#4A5568',
    fontWeight: '500',
    fontSize: 15,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#718096',
    fontSize: 14,
  },
  loginLink: {
    color: '#4299E1',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 14,
  },
  errorText: {
    color: '#E53E3E',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 25,
    width: '100%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 25,
  },
  roleButton: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientButton: {
    backgroundColor: '#EBF8FF',
    borderColor: '#BEE3F8',
  },
  doctorButton: {
    backgroundColor: '#F0FFF4',
    borderColor: '#C6F6D5',
  },
  roleIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 5,
  },
  roleDescription: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
  },
});

export default MedicalSignUp;