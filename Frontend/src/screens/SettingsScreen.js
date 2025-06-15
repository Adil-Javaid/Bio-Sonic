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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import BluetoothManager from "../services/BluetoothManager"; // Custom Bluetooth module

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
    <LinearGradient
      colors={["#4fc3f7", "#0288d1", "#01579b"]}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.header}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Customize your BioSonic experience</Text>
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

            {/* User Info */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>User Profile</Text>
              {userInfo ? (
                <View style={styles.userBox}>
                  <Text style={styles.userName}>
                    👤 Dr. {userInfo.firstName} {userInfo.lastName}
                  </Text>
                  <Text style={styles.userEmail}>📧 {userInfo.email}</Text>
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
                  <Text style={styles.label}>
                    {key.charAt(0).toUpperCase() + key.slice(1)} Filter
                  </Text>
                  <Switch
                    value={filters[key]}
                    onValueChange={() => toggleFilter(key)}
                    thumbColor="#0288d1"
                    trackColor={{ false: "#90a4ae", true: "#4fc3f7" }}
                    accessibilityLabel={`${key} Filter Toggle`}
                  />
                </View>
              ))}
            </View>

            {/* Account Actions */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Account</Text>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                accessibilityLabel="Log Out"
              >
                <Text style={styles.logoutText}>🚪 Log Out</Text>
              </TouchableOpacity>
            </View>

            {/* Navigation Menu */}
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("Home")}
                activeOpacity={0.85}
                accessibilityLabel="Home"
              >
                <Ionicons name="home-outline" size={24} color="#ffffff" style={styles.menuIcon} />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Home</Text>
                  <Text style={styles.menuSubtitle}>Record or upload audio</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4fc3f7" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("History")}
                activeOpacity={0.85}
                accessibilityLabel="View History"
              >
                <Ionicons name="time-outline" size={24} color="#ffffff" style={styles.menuIcon} />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>View History</Text>
                  <Text style={styles.menuSubtitle}>Review past recordings</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4fc3f7" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("Profile")}
                activeOpacity={0.85}
                accessibilityLabel="Doctor Profile"
              >
                <Ionicons name="person-circle-outline" size={24} color="#ffffff" style={styles.menuIcon} />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Doctor Profile</Text>
                  <Text style={styles.menuSubtitle}>Manage account details</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4fc3f7" />
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>BioSonic © 2025 | Medical Support Available</Text>
          </Animated.View>
        </ScrollView>
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
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#b2ebf2",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textAlign: "center",
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
    color: "#0f172a",
    fontWeight: "500",
  },
  connectedText: {
    color: "#0288d1",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 16,
  },
  userBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4fc3f7",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: "#0f172a",
  },
  loadingText: {
    fontSize: 16,
    color: "#b2ebf2",
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
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
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

export default SettingsScreen;