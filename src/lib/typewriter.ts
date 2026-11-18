export interface TypewriterState {
  phraseIndex: number;
  characterIndex: number;
  deleting: boolean;
  paused: boolean;
}

export const TYPING_DELAY_MS = 105;
export const DELETING_DELAY_MS = 42;
export const PAUSE_DELAY_MS = 1900;

export const initialTypewriterState: TypewriterState = {
  phraseIndex: 0,
  characterIndex: 0,
  deleting: false,
  paused: false
};

export function getTypewriterDelay(state: TypewriterState): number {
  if (state.paused) {
    return PAUSE_DELAY_MS;
  }

  return state.deleting ? DELETING_DELAY_MS : TYPING_DELAY_MS;
}

/**
 * Advances the typewriter by one tick: type a character, hold the finished
 * phrase, delete it character by character, then move on to the next phrase.
 */
export function advanceTypewriter(
  state: TypewriterState,
  phrases: readonly string[]
): TypewriterState {
  if (phrases.length === 0) {
    return state;
  }

  if (state.paused) {
    return { ...state, paused: false };
  }

  if (!state.deleting) {
    const characterIndex = state.characterIndex + 1;
    const finished = characterIndex >= phrases[state.phraseIndex].length;

    return {
      ...state,
      characterIndex,
      paused: finished,
      deleting: finished
    };
  }

  const characterIndex = state.characterIndex - 1;

  if (characterIndex <= 0) {
    return {
      phraseIndex: (state.phraseIndex + 1) % phrases.length,
      characterIndex: 0,
      deleting: false,
      paused: false
    };
  }

  return { ...state, characterIndex };
}

export function getVisibleText(
  state: TypewriterState,
  phrases: readonly string[],
  reducedMotion: boolean
): string {
  const phrase = phrases[state.phraseIndex] ?? "";

  return reducedMotion ? phrase : phrase.slice(0, state.characterIndex);
}
