import { useEffect, useState } from "react";
import {
  advanceTypewriter,
  getTypewriterDelay,
  getVisibleText,
  initialTypewriterState
} from "../lib/typewriter";
import { useReducedMotion } from "../lib/use-reduced-motion";

export function TypewriterWord({ phrases }: { phrases: string[] }) {
  const [state, setState] = useState(initialTypewriterState);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const timeout = window.setTimeout(
      () => setState((current) => advanceTypewriter(current, phrases)),
      getTypewriterDelay(state)
    );

    return () => window.clearTimeout(timeout);
  }, [phrases, reducedMotion, state]);

  return (
    <>
      {/* The animation paints partial words, so only this span is announced. */}
      <span className="sr-only">{phrases[state.phraseIndex]}</span>
      <span
        aria-hidden="true"
        className="font-normal text-accent italic"
        data-testid="typewriter-text"
      >
        {getVisibleText(state, phrases, reducedMotion)}
      </span>
      {reducedMotion ? null : (
        <span
          aria-hidden="true"
          className="animate-term-blink ml-2 inline-block h-[5px] w-[0.46em] bg-accent align-[0.12em]"
          data-testid="typewriter-cursor"
        />
      )}
    </>
  );
}
