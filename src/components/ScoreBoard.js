/**
 * ScoreBoard — displays player coins and last-spin result.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ScoreBoard({ coins, lastPayout, playerName }) {
  const resultText =
    lastPayout === null
      ? 'Good luck!'
      : lastPayout > 0
      ? `+${lastPayout} coins! 🎉`
      : 'No win. Try again!';

  const resultColor =
    lastPayout === null ? '#aaa' : lastPayout > 0 ? '#ffd700' : '#ff6b6b';

  return (
    <View style={styles.board}>
      <Text style={styles.playerName}>{playerName}</Text>
      <Text style={styles.coins}>🪙 {coins} coins</Text>
      <Text style={[styles.result, { color: resultColor }]}>{resultText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  coins: {
    color: '#ffd700',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  result: {
    fontSize: 18,
    fontWeight: '600',
  },
});
