/**
 * SlotMachine component — displays the three spinning reels.
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SYMBOLS } from '../utils/gameLogic';

export default function SlotMachine({ reels, spinning }) {
  const spinAnims = useRef(reels.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (spinning) {
      const animations = spinAnims.map((anim) => {
        anim.setValue(0);
        return Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          { iterations: 10 }
        );
      });
      Animated.stagger(80, animations).start();
    }
  }, [spinning]);

  return (
    <View style={styles.machine}>
      <View style={styles.reelRow}>
        {reels.map((symbol, i) => (
          <Animated.View
            key={i}
            style={[
              styles.reel,
              {
                opacity: spinning
                  ? spinAnims[i].interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 0.3, 1],
                    })
                  : 1,
              },
            ]}
          >
            <Text style={styles.symbol}>{spinning ? SYMBOLS[i % SYMBOLS.length] : symbol}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  machine: {
    backgroundColor: '#2d0a5e',
    borderRadius: 20,
    padding: 20,
    marginVertical: 24,
    borderWidth: 3,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  reelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reel: {
    width: 80,
    height: 80,
    backgroundColor: '#1a0533',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  symbol: {
    fontSize: 40,
  },
});
