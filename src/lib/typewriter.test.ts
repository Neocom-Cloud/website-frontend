import { describe, expect, it } from "vitest";
import {
  DELETING_DELAY_MS,
  PAUSE_DELAY_MS,
  TYPING_DELAY_MS,
  TypewriterState,
  advanceTypewriter,
  getTypewriterDelay,
  getVisibleText,
  initialTypewriterState
} from "./typewriter";

const phrases = ["ab", "xyz"];

describe("typewriter state machine", () => {
  it("types one character per tick", () => {
    const next = advanceTypewriter(initialTypewriterState, phrases);

    expect(next).toMatchObject({ characterIndex: 1, deleting: false, paused: false });
  });

  it("pauses and flips to deleting once the phrase is complete", () => {
    const next = advanceTypewriter({ ...initialTypewriterState, characterIndex: 1 }, phrases);

    expect(next).toMatchObject({ characterIndex: 2, deleting: true, paused: true });
  });

  it("resumes from the pause without changing the text", () => {
    const paused: TypewriterState = {
      phraseIndex: 0,
      characterIndex: 2,
      deleting: true,
      paused: true
    };

    expect(advanceTypewriter(paused, phrases)).toEqual({ ...paused, paused: false });
  });

  it("deletes character by character and moves to the next phrase", () => {
    let state: TypewriterState = {
      phraseIndex: 0,
      characterIndex: 2,
      deleting: true,
      paused: false
    };

    state = advanceTypewriter(state, phrases);
    expect(state.characterIndex).toBe(1);

    state = advanceTypewriter(state, phrases);
    expect(state).toEqual({
      phraseIndex: 1,
      characterIndex: 0,
      deleting: false,
      paused: false
    });
  });

  it("wraps around to the first phrase", () => {
    const last: TypewriterState = {
      phraseIndex: 1,
      characterIndex: 1,
      deleting: true,
      paused: false
    };

    expect(advanceTypewriter(last, phrases).phraseIndex).toBe(0);
  });

  it("is a no-op without phrases", () => {
    expect(advanceTypewriter(initialTypewriterState, [])).toBe(initialTypewriterState);
  });

  it("uses distinct delays for typing, deleting and pausing", () => {
    expect(getTypewriterDelay(initialTypewriterState)).toBe(TYPING_DELAY_MS);
    expect(getTypewriterDelay({ ...initialTypewriterState, deleting: true })).toBe(
      DELETING_DELAY_MS
    );
    expect(getTypewriterDelay({ ...initialTypewriterState, paused: true })).toBe(PAUSE_DELAY_MS);
  });

  it("shows the partial phrase, or the full phrase under reduced motion", () => {
    const state = { ...initialTypewriterState, phraseIndex: 1, characterIndex: 2 };

    expect(getVisibleText(state, phrases, false)).toBe("xy");
    expect(getVisibleText(state, phrases, true)).toBe("xyz");
  });
});
