import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PredictionResults = ({ predictions }) => {
  if (!predictions) return null;

  const predictionEntries = Object.entries(predictions['Top-3 Predictions']);

  const getColorByRank = (index) => {
    switch (index) {
      case 0: return '#ef4444'; // red
      case 1: return '#0ea5e9'; // blue
      case 2: return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📊 Analysis Results</Text>

      {predictionEntries.map(([condition, confidence], index) => (
        <View key={condition} style={styles.row}>
          <View style={styles.labelBox}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.condition}>{condition.replace(/_/g, ' ')}</Text>
          </View>
          <Text style={[styles.confidence, { color: getColorByRank(index) }]}>
            {confidence}
          </Text>
        </View>
      ))}

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          ⚠️ These predictions are AI-generated and should be used as a supplementary tool. Always consult a licensed professional for diagnosis and treatment.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  labelBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontWeight: 'bold',
    color: '#64748b',
    marginRight: 8,
  },
  condition: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  confidence: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteBox: {
    marginTop: 20,
    backgroundColor: '#fef9c3',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noteText: {
    color: '#854d0e',
    fontSize: 13,
  },
});

export default PredictionResults;
