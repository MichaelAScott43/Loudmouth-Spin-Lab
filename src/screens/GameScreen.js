/**
 * GameScreen — main gameplay screen.
 *
 * Handles spin mechanics, coin tracking, and FB Instant Game score posting.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import SlotMachine from '../components/SlotMachine';
import SpinButton from '../components/SpinButton';
import ScoreBoard from '../components/ScoreBoard';
import { spin, canSpin, SPIN_COST, STARTING_COINS } from '../utils/gameLogic';
import { postScore, shareWin } from '../utils/fbInstant';

export default function GameScreen({ playerName, onHome }) {
  const [coins, setCoins] = useState(STARTING_COINS);
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [lastPayout, setLastPayout] = useState(null);
  const [highScore, setHighScore] = useState(STARTING_COINS);
  const spinTimeout = useRef(null);

  useEffect(() => {
    return () => {
      if (spinTimeout.current) clearTimeout(spinTimeout.current);
    };
  }, []);

  const handleSpin = async () => {
    if (!canSpin(coins) || spinning) return;

    setSpinning(true);
    setLastPayout(null);

    spinTimeout.current = setTimeout(async () => {
      const result = spin();
      setReels(result.reels);
      setLastPayout(result.payout);
      setSpinning(false);

      const newCoins = coins - SPIN_COST + result.payout;
      setCoins(newCoins);

      if (newCoins > highScore) {
        setHighScore(newCoins);
        await postScore(newCoins);
      }

      if (result.win && result.payout >= 50) {
        await shareWin(result.payout);
      }

      if (newCoins < SPIN_COST) {
        showGameOver(newCoins);
      }
    }, 1200);
  };

  const showGameOver = (finalCoins) => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      window.alert(`Game Over! You finished with ${finalCoins} coins.\nHigh score: ${highScore}`);
      resetGame();
    } else {
      Alert.alert(
        'Game Over!',
        `You finished with ${finalCoins} coins.\nHigh score: ${highScore}`,
        [{ text: 'Play Again', onPress: resetGame }]
      );
    }
  };

  const resetGame = () => {
    setCoins(STARTING_COINS);
    setReels(['🍒', '🍋', '🍊']);
    setLastPayout(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onHome} style={styles.backButton}>
            <Text style={styles.backLabel}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Spin Lab</Text>
          <View style={styles.highScoreBox}>
            <Text style={styles.highScoreLabel}>Best</Text>
            <Text style={styles.highScoreValue}>{highScore}</Text>
          </View>
        </View>

        {/* Score */}
        <ScoreBoard
          coins={coins}
          lastPayout={lastPayout}
          playerName={playerName}
        />

        {/* Slot machine */}
        <SlotMachine reels={reels} spinning={spinning} />

        {/* Spin button */}
        <SpinButton
          onPress={handleSpin}
          disabled={!canSpin(coins) || spinning}
          cost={SPIN_COST}
        />

        {/* Symbol legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Payouts (3-match)</Text>
          <View style={styles.legendRow}>
            {['🍒×50', '🍋×100', '🍊×150', '⭐×250', '💎×500', '7️⃣×1000'].map((item) => (
              <Text key={item} style={styles.legendItem}>{item}</Text>
            ))}
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backLabel: {
    color: '#c084fc',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffd700',
    fontSize: 22,
    fontWeight: 'bold',
  },
  highScoreBox: {
    alignItems: 'center',
  },
  highScoreLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  highScoreValue: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legend: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#2d0a5e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a1a8a',
  },
  legendTitle: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  legendItem: {
    color: '#e2e8f0',
    fontSize: 12,
    backgroundColor: '#1a0533',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
