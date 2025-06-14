import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      // Replace with your actual API URL
      const response = await axios.get("http://192.168.100.9:7860/history");
      // Sort by timestamp (newest first)
      const sortedHistory = response.data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setHistory(sortedHistory);
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
    const topPrediction = Object.entries(item.predictions)[0];
    const predictionDate = new Date(item.timestamp);

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={styles.date}>
            {predictionDate.toLocaleDateString()} •{" "}
            {predictionDate.toLocaleTimeString()}
          </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Details", JSON.stringify(item.metadata, null, 2))
            }
          >
            <MaterialIcons name="info-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.predictionContainer}>
          <Text style={styles.predictionLabel}>Top Prediction:</Text>
          <Text style={styles.predictionText}>
            {topPrediction[0]} ({topPrediction[1]})
          </Text>
        </View>

        <Text style={styles.fileName}>
          File: {item.audio_file.split("/").pop()}
        </Text>
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
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.timestamp}
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
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: "#64748b",
  },
  predictionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  fileName: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
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
