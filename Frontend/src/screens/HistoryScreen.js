import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

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

  const fetchHistory = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found");

      const predictionRes = await axios.get(
        `http://192.168.0.101:3000/api/predictions/${userId}`
      );
      const diagnosisRes = await axios.get(
        `http://192.168.0.101:3000/api/diagnoses/${userId}`
      );

      const predictionHistory = predictionRes.data.predictions || [];
      const diagnosisHistory = diagnosisRes.data.diagnoses || [];

      // Merge and tag each type
      const combined = [
        ...predictionHistory.map((item) => ({ ...item, type: "prediction" })),
        ...diagnosisHistory.map((item) => ({ ...item, type: "diagnosis" })),
      ];

      // Sort by timestamp (descending)
      const sorted = combined.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setHistory(sorted);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      Alert.alert("Error", "Failed to load history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderItem = ({ item }) => {
    const date = new Date(item.timestamp);
    const title = item.type === "diagnosis" ? item.name : "Auto Prediction";

    // Handle top prediction consistently (array for both types)
    const topPrediction = Array.isArray(item.predictions)
      ? item.predictions[0]
      : item.predictions
      ? Object.entries(item.predictions)[0]
      : null;

    return (
      <View
        style={styles.item}
        accessibilityLabel={`History item: ${title} for patient ${item.patient_name || "Unknown"}`}
      >
        <Text style={styles.date}>
          {date.toLocaleDateString()} • {date.toLocaleTimeString()}
        </Text>
        <Text style={styles.predictionLabel}>
          {title} (ID: {item.patient_id || "N/A"})
        </Text>
        <Text style={styles.patientName}>
          Name: {item.patient_name || "Unknown"}
        </Text>
        {topPrediction && (
          <Text style={styles.predictionText}>
            {topPrediction.disease || topPrediction[0]} (
            {Math.round((topPrediction.confidence || topPrediction[1]) * 10) / 10}
            %)
          </Text>
        )}
        {item.notes && (
          <Text style={styles.notes}>
            Notes: {item.notes}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={["#1d3557", "#457b9d", "#a8dadc"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#f1faee" />
        </View>
      </LinearGradient>
    );
  }

  return (
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

      {/* Animated Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Text style={styles.header}>Prediction History</Text>
      </Animated.View>

      {/* Animated Content */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Search Input */}
        <TextInput
          placeholder="Search by Patient ID or Name..."
          placeholderTextColor="#a8dadc"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          accessibilityLabel="Search history"
        />

        {history.filter((item) => {
          const idMatch = item.patient_id
            ?.toLowerCase()
            .includes(searchText.toLowerCase());
          const nameMatch = item.patient_name
            ?.toLowerCase()
            .includes(searchText.toLowerCase());
          return idMatch || nameMatch;
        }).length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.noHistoryText}>No prediction history found</Text>
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
                onPress={handleRefresh}
                accessibilityLabel="Refresh history"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#f1faee", "#a8dadc"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="refresh-outline" size={20} color="#1d3557" />
                  <Text style={styles.buttonTextPrimary}>Refresh</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <FlatList
            data={history.filter((item) => {
              const idMatch = item.patient_id
                ?.toLowerCase()
                .includes(searchText.toLowerCase());
              const nameMatch = item.patient_name
                ?.toLowerCase()
                .includes(searchText.toLowerCase());
              return idMatch || nameMatch;
            })}
            renderItem={renderItem}
            keyExtractor={(item, index) =>
              item._id || item.prediction_id || index.toString()
            }
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContent}
          />
        )}
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
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
    fontSize: 42,
    fontWeight: "800",
    color: "#f1faee",
    marginBottom: 20,
    marginTop: 20,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  searchInput: {
    backgroundColor: "rgba(241, 250, 238, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    color: "#f1faee",
    fontSize: 18,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.3)",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: "rgba(241, 250, 238, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(241, 250, 238, 0.2)",
  },
  date: {
    fontSize: 14,
    color: "#a8dadc",
    marginBottom: 4,
  },
  predictionLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f1faee",
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    color: "#f1faee",
    marginBottom: 4,
  },
  predictionText: {
    fontSize: 16,
    color: "#a8dadc",
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: "#a8dadc",
    fontStyle: "italic",
  },
  noHistoryText: {
    fontSize: 18,
    color: "#f1faee",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
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

export default HistoryScreen;