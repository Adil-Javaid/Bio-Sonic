import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput, // ✅ FIXED
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ FIXED
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchHistory = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      const predictionRes = await axios.get(
        `http://192.168.0.101:3000/api/predictions/${userId}`
      );
      const diagnosisRes = await axios.get(
        `http://192.168.0.101:3000/api/diagnoses/${userId}`
      );

      const predictionHistory = predictionRes.data.predictions || [];
      const diagnosisHistory = diagnosisRes.data.diagnoses || [];

      const combined = [
        ...predictionHistory.map((item) => ({ ...item, type: "prediction" })),
        ...diagnosisHistory.map((item) => ({ ...item, type: "diagnosis" })),
      ];

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
    const topPrediction =
      item.type === "diagnosis"
        ? item.predictions?.[0]
        : Object.entries(item.predictions || {})[0];

    return (
      <View style={styles.item}>
        <Text style={styles.date}>
          {date.toLocaleDateString()} • {date.toLocaleTimeString()}
        </Text>
        <Text style={styles.predictionLabel}>
          {title} (ID: {item.patient_id || "N/A"})
        </Text>
        <Text style={{ color: "#334155", marginBottom: 4 }}>
          Name: {item.patient_name || "Unknown"}
        </Text>
        <Text style={styles.predictionText}>
          {topPrediction[0]} ({topPrediction[1]}%)
        </Text>
        {item.notes && (
          <Text style={{ color: "#64748b", fontStyle: "italic", marginTop: 4 }}>
            Notes: {item.notes}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Prediction History</Text>

      <TextInput
        placeholder="Search by Patient ID or Name..."
        style={styles.searchInput}
        value={searchText}
        onChangeText={setSearchText}
      />

      {history.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noHistoryText}>No prediction history found</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  searchInput: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    color: "#1e293b",
  },
  patientId: {
    fontSize: 12,
    color: "#3b3b3b",
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  date: {
    fontSize: 14,
    color: "#64748b",
  },
  predictionLabel: {
    fontWeight: "bold",
    marginRight: 5,
    color: "#334155",
  },
  predictionText: {
    color: "#3b82f6",
    fontSize: 16,
  },
  noHistoryText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default HistoryScreen;
