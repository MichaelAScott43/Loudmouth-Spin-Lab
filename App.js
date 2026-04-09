/**
 * Loudmouth Spin Lab — Main entry point
 *
 * Handles:
 *  - Facebook Instant Games SDK initialisation (web platform)
 *  - Expo splash-screen management
 *  - Root navigation between Home and Game screens
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Platform, View, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import { initFBInstant, isFBInstantReady } from './src/utils/fbInstant';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [screen, setScreen] = useState('home');
  const [appReady, setAppReady] = useState(false);
  const [playerName, setPlayerName] = useState('Player');
  const [playerPhoto, setPlayerPhoto] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        if (Platform.OS === 'web') {
          const fbResult = await initFBInstant();
          if (fbResult.name) setPlayerName(fbResult.name);
          if (fbResult.photo) setPlayerPhoto(fbResult.photo);
          // Hide the HTML loading overlay now that the SDK has initialised.
          if (typeof window !== 'undefined' && typeof window.hideFBLoadingOverlay === 'function') {
            window.hideFBLoadingOverlay();
          }
        }
      } catch (e) {
        console.warn('FB Instant init error:', e);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.hideFBLoadingOverlay === 'function') {
          window.hideFBLoadingOverlay();
        }
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appReady) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {screen === 'home' ? (
        <HomeScreen
          playerName={playerName}
          playerPhoto={playerPhoto}
          onPlay={() => setScreen('game')}
        />
      ) : (
        <GameScreen
          playerName={playerName}
          onHome={() => setScreen('home')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0533',
  },
});
