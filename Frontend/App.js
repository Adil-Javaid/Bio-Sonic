import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './AppNavigator';
import { RecordingProvider } from './src/context/RecordingContext';

export default function App() {
  return (
    <>
    <RecordingProvider>
      <StatusBar style="auto" />
      <AppNavigator />
      </RecordingProvider>
    </>
  );
}
