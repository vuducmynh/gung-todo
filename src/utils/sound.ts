import { createAudioPlayer } from 'expo-audio';

let completePlayer: any = null;
let popPlayer: any = null;

try {
  completePlayer = createAudioPlayer(require('../../assets/sounds/complete.wav'));
  popPlayer = createAudioPlayer(require('../../assets/sounds/pop.wav'));
} catch (error) {
  // Silently fallback if audio subsystem is disabled
}

/**
 * Play a cute, crisp audio effect (completion chime or button pop)
 */
export const playSound = (type: 'complete' | 'pop' = 'complete', enabled: boolean = true) => {
  if (!enabled) return;

  try {
    const player = type === 'complete' ? completePlayer : popPlayer;
    if (player) {
      if (typeof player.seekTo === 'function') {
        player.seekTo(0);
      }
      if (typeof player.play === 'function') {
        player.play();
      }
    }
  } catch {
    // Silently ignore playback exceptions
  }
};
