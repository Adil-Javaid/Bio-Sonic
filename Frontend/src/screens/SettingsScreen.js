import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import BluetoothManager from "../services/BluetoothManager"; // Custom Bluetooth module

const { width, height } = Dimensions.get("window");

const BASE_URL = "http://192.168.0.101:8080"; // Configurable base URL

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

const SettingsScreen = ({ navigation }) => {
  const [filters, setFilters] = useState({
    bandpass: false,
    notch: false,
  });
  const [userInfo, setUserInfo] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  
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

  // Load user info and filters
  useEffect(() => {
    (async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const res = await axiosWithRetry({
            method: "get",
            url: `${BASE_URL}/api/user/${userId}`,
            timeout: 10000,
          });
          setUserInfo(res.data);
        } else {
          setUserInfo({ firstName: "Guest", lastName: "User", email: "guest@biosonic.com" });
        }
      } catch (err) {
        console.error("Failed to load user info:", err.message);
        Alert.alert(
          "Network Error",
          "Failed to load user profile. Using guest mode.",
          [
            { text: "Retry", onPress: () => navigation.replace("Settings") },
            { text: "Continue", onPress: () => setUserInfo({ firstName: "Guest", lastName: "User", email: "guest@biosonic.com" }) },
          ]
        );
      }

      try {
        const saved = await AsyncStorage.getItem("audioFilters");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed === "object" && "bandpass" in parsed && "notch" in parsed) {
            setFilters(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load filters:", err.message);
      }
    })();
  }, []);

  const toggleFilter = async (key) => {
    try {
      const updated = { ...filters, [key]: !filters[key] };
      setFilters(updated);
      await AsyncStorage.setItem("audioFilters", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save filter:", err.message);
      Alert.alert("Error", "Failed to save filter settings");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userId");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err) {
      console.error("Logout error:", err.message);
      Alert.alert("Error", "Failed to logout");
    }
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
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Customize Your BioSonic Experience</Text>
            </View>
          </Animated.View>

          {/* Animated Content */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Bluetooth Status */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Bluetooth Stethoscope</Text>
              <View style={styles.statusCard}>
                <MaterialIcons
                  name={isConnected ? "bluetooth-connected" : "bluetooth"}
                  size={24}
                  color={isConnected ? "#f1faee" : "#a8dadc"}
                />
                <Text style={[styles.statusText, isConnected && styles.connectedText]}>
                  {isConnected ? `Connected to ${deviceName}` : "No Stethoscope Connected"}
                </Text>
              </View>
            </View>

            {/* User Info */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>User Profile</Text>
              {userInfo ? (
                <View style={styles.userBox}>
                  <View style={styles.featureItem}>
                    <Ionicons name="person-outline" size={20} color="#f1faee" />
                    <Text style={styles.featureText}>
                      Dr. {userInfo.firstName} {userInfo.lastName}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="mail-outline" size={20} color="#f1faee" />
                    <Text style={styles.featureText}>{userInfo.email}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.loadingText}>Loading profile...</Text>
              )}
            </View>

            {/* Audio Filters */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Audio Filters</Text>
              {Object.keys(filters).map((key) => (
                <View style={styles.filterRow} key={key}>
                  <View style={styles.featureItem}>
                    <Ionicons name="filter-outline" size={20} color="#f1faee" />
                    <Text style={styles.featureText}>
                      {key.charAt(0).toUpperCase() + key.slice(1)} Filter
                    </Text>
                  </View>
                  <Switch
                    value={filters[key]}
                    onValueChange={() => toggleFilter(key)}
                    thumbColor="#f1faee"
                    trackColor={{ false: "#a8dadc", true: "#f1faee" }}
                    accessibilityLabel={`${key.charAt(0).toUpperCase() + key.slice(1)} Filter Toggle`}
                  />
                </View>
              ))}
            </View>

            {/* Account Actions */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Account</Text>
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
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleLogout}
                  accessibilityLabel="Log Out"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#f1faee", "#a8dadc"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#1d3557" />
                    <Text style={styles.buttonTextPrimary}>Log Out</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Navigation Menu */}
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("Home")}
                activeOpacity={0.8}
                accessibilityLabel="Home"
              >
                <Ionicons name="home-outline" size={24} color="#f1faee" style={styles.menuIcon} />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Home</Text>
                  <Text style={styles.menuSubtitle}>Record or upload audio</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a8dadc" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("History")}
                activeOpacity={0.8}
                accessibilityLabel="View History"
              >
                <Ionicons name="time-outline" size={24} color="#f1faee" style={styles.menuIcon} />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>View History</Text>
                  <Text style={styles.menuSubtitle}>Review past recordings</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#a8dadc" />
              </TouchableOpacity>

    
            </View>

            <Text style={styles.footerText}>BioSonic © 2025 | Medical Support Available</Text>
          </Animated.View>

          {/* Medical Icons Decoration */}
          <View style={styles.decorativeIcons}>
            <Ionicons name="heart-outline" size={24} color="#a8dadc" style={styles.decorIcon1} />
            <Ionicons name="medical-outline" size={20} color="#a8dadc" style={styles.decorIcon2} />
            <Ionicons name="fitness-outline" size={22} color="#a8dadc" style={styles.decorIcon3} />
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
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#f1faee",
    textAlign: "center",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    paddingTop: 34,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#a8dadc",
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  card: {
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  statusText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#f1faee",
    fontWeight: "500",
  },
  connectedText: {
    color: "#f1faee",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f1faee",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 16,
  },
  userBox: {
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.3)",
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
  loadingText: {
    fontSize: 16,
    color: "#a8dadc",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
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
  buttonTextPrimary: {
    color: "#1d3557",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  menuContainer: {
    marginBottom: 20,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
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
    color: "#f1faee",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#a8dadc",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  footerText: {
    fontSize: 12,
    color: "#a8dadc",
    textAlign: "center",
    opacity: 0.8,
    marginTop: 20,
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

export default SettingsScreen;