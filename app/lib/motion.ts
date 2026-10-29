import { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

/**
 * Shared transition presets so every screen moves the same way. Short and eased: content
 * fades in slightly slower than it fades out, and size/position changes glide rather than jump.
 */
const EASE = Easing.out(Easing.cubic);

export const motion = {
  /** Content appearing (a step, suggestions, a section coming back). */
  enter: FadeIn.duration(220).easing(EASE),
  /** Content leaving. */
  exit: FadeOut.duration(140).easing(EASE),
  /** Siblings moving or a container resizing because content changed. */
  layout: LinearTransition.duration(240).easing(EASE),
};
