import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';
import { MascotMood } from '../types/todo';

interface CatMascotProps {
  mood?: MascotMood;
  size?: number;
  message?: string;
}

export const CatMascot: React.FC<CatMascotProps> = ({
  mood = 'happy',
  size = 110,
  message,
}) => {
  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          {/* Soft shadow under cat */}
          <Ellipse cx="60" cy="112" rx="42" ry="6" fill="#E2D9CC" opacity={0.6} />

          {/* Ears */}
          <G>
            {/* Left Ear Outer */}
            <Path
              d="M 28 48 C 22 24, 30 14, 46 22 Z"
              fill="#F97316"
              stroke="#EA580C"
              strokeWidth="2"
            />
            {/* Left Ear Inner */}
            <Path d="M 32 44 C 27 28, 33 21, 43 27 Z" fill="#FED7AA" />

            {/* Right Ear Outer */}
            <Path
              d="M 92 48 C 98 24, 90 14, 74 22 Z"
              fill="#F97316"
              stroke="#EA580C"
              strokeWidth="2"
            />
            {/* Right Ear Inner */}
            <Path d="M 88 44 C 93 28, 87 21, 77 27 Z" fill="#FED7AA" />
          </G>

          {/* Head Base (Ginger Orange) */}
          <Circle
            cx="60"
            cy="65"
            r="44"
            fill="#FB923C"
            stroke="#EA580C"
            strokeWidth="2"
          />

          {/* White Chest & Chin Pattern (Bụng / Má trắng) */}
          <Path
            d="M 30 75 C 30 102, 90 102, 90 75 C 80 88, 40 88, 30 75 Z"
            fill="#FFFDF9"
          />
          {/* White blaze between eyes down to muzzle */}
          <Path
            d="M 52 35 C 56 50, 42 66, 42 78 C 42 94, 78 94, 78 78 C 78 66, 64 50, 68 35 Z"
            fill="#FFFDF9"
          />

          {/* Orange tabby stripes on forehead */}
          <Path d="M 60 26 L 60 38" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M 52 30 L 55 40" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
          <Path d="M 68 30 L 65 40" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />

          {/* Cheeks blush */}
          <Ellipse cx="38" cy="74" rx="6" ry="3.5" fill="#FDA4AF" opacity={0.7} />
          <Ellipse cx="82" cy="74" rx="6" ry="3.5" fill="#FDA4AF" opacity={0.7} />

          {/* Mood-dependent Eyes */}
          {mood === 'celebrating' || mood === 'happy' ? (
            // Smiling curved happy eyes (^ ^)
            <G>
              <Path
                d="M 40 63 Q 47 54 54 63"
                stroke="#431407"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M 66 63 Q 73 54 80 63"
                stroke="#431407"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
              />
            </G>
          ) : mood === 'sleeping' ? (
            // Sleeping closed relaxed eyes (- -)
            <G>
              <Path
                d="M 40 64 Q 47 68 54 64"
                stroke="#78350F"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M 66 64 Q 73 68 80 64"
                stroke="#78350F"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
            </G>
          ) : (
            // Focused big curious eyes with sparkle
            <G>
              <Circle cx="47" cy="62" r="5.5" fill="#431407" />
              <Circle cx="45.5" cy="60" r="2" fill="#FFFFFF" />
              <Circle cx="73" cy="62" r="5.5" fill="#431407" />
              <Circle cx="71.5" cy="60" r="2" fill="#FFFFFF" />
            </G>
          )}

          {/* Cute Pink Nose */}
          <Path
            d="M 57 71 Q 60 69 63 71 Q 60 75 57 71 Z"
            fill="#FB7185"
          />

          {/* Cat Mouth (W shaped smile) */}
          <Path
            d="M 54 75 Q 57 79 60 76 Q 63 79 66 75"
            stroke="#78350F"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Whiskers */}
          <G stroke="#78350F" strokeWidth="1.6" strokeLinecap="round" opacity={0.6}>
            <Path d="M 28 68 L 40 71" />
            <Path d="M 27 75 L 39 75" />
            <Path d="M 92 68 L 80 71" />
            <Path d="M 93 75 L 81 75" />
          </G>

          {/* Celebrating Sparkles or Sleeping Zzz */}
          {mood === 'celebrating' && (
            <G>
              {/* Star 1 */}
              <Path
                d="M 20 28 Q 23 28 23 25 Q 23 28 26 28 Q 23 28 23 31 Q 23 28 20 28 Z"
                fill="#EAB308"
              />
              {/* Star 2 */}
              <Path
                d="M 96 26 Q 100 26 100 22 Q 100 26 104 26 Q 100 26 100 30 Q 100 26 96 26 Z"
                fill="#EAB308"
              />
            </G>
          )}

          {/* Sleeping Zzz */}
          {mood === 'sleeping' && (
            <G>
              <Path
                d="M 88 30 L 98 30 L 88 40 L 98 40"
                stroke="#EA580C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </G>
          )}
        </Svg>
      </View>

      {message && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3EFE6',
  },
  bubbleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350F',
  },
});
