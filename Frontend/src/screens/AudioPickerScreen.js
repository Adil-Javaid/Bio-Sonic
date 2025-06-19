// AudioPickerScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { RecordingContext } from "../context/RecordingContext";

const AudioPickerScreen = ({ navigation, route }) => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setAudioUri } = useContext(RecordingContext);

  const fetchAudioFiles = async () => {
    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      alert("Permission required to access audio files");
      return;
    }

    const { assets } = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      sortBy: ["modificationTime"],
      first: 100,
    });

    const detailedAssets = await Promise.all(
      assets.map(async (asset) => {
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        return {
          ...asset,
          duration: Math.round((info.duration || 0) * 10) / 10, // in seconds
        };
      })
    );

    setAudioFiles(detailedAssets);
    setLoading(false);
  };

  useEffect(() => {
    fetchAudioFiles();
  }, []);

  const handleSelect = (item) => {
    setAudioUri(item.uri);
navigation.goBack();
  };

  const formatDuration = (duration) => {
    const mins = Math.floor(duration / 60);
    const secs = Math.round(duration % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
      <Ionicons name="musical-notes-outline" size={24} color="#1d3557" />
      <View style={styles.itemInfo}>
        <Text style={styles.itemText} numberOfLines={1}>{item.filename}</Text>
        <Text style={styles.itemDuration}>{formatDuration(item.duration || 0)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select an Audio File</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#1d3557" />
      ) : (
        <FlatList
          data={audioFiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

export default AudioPickerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1faee",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1d3557",
    marginBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  itemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: "#1d3557",
  },
  itemDuration: {
    fontSize: 14,
    color: "#457b9d",
    marginTop: 2,
  },
});