/**
 * HomeScreen — landing screen with player greeting and Play button.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';

export default function HomeScreen({ playerName, playerPhoto, onPlay }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>🎰</Text>
        <Text style={styles.gameName}>Loudmouth{'\n'}Spin Lab</Text>
        <Text style={styles.tagline}>Dr. Loudmouth's Casino</Text>

        {playerPhoto ? (
          <Image source={{ uri: playerPhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
        )}

        <Text style={styles.welcome}>Welcome, {playerName}!</Text>

        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Text style={styles.playLabel}>PLAY NOW</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Match 3 symbols to win big!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#1a0533',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 72,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffd700',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#c084fc',
    marginBottom: 32,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffd700',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffd700',
    backgroundColor: '#2d0a5e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  welcome: {
    color: '#e2e8f0',
    fontSize: 18,
    marginBottom: 40,
  },
  playButton: {
    backgroundColor: '#ffd700',
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 50,
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 20,
  },
  playLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a0533',
    letterSpacing: 2,
  },
  hint: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
