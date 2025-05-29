import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = ''; // Replace with your auth token retrieval method
      const response = await axios.get('http://127.0.0.1:7860/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setHistory(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const renderItem = ({ item }) => {
    const topPrediction = Object.entries(item.predictions)[0];
    return (
      <View style={styles.item}>
        <Text style={styles.id}>🆔 {item.patient_id}</Text>
        <Text style={styles.result}>
          🧠 {topPrediction[0]} — {topPrediction[1]}
        </Text>
        <Text style={styles.date}>📅 {new Date(item.timestamp).toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📜 Prediction History</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.patient_id + item.timestamp}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e293b',
    textAlign: 'center',
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  id: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#334155',
  },
  result: {
    fontSize: 15,
    marginBottom: 4,
    color: '#2563eb',
  },
  date: {
    fontSize: 13,
    color: '#64748b',
  },
});

export default HistoryScreen;
