import { useDrag } from "@use-gesture/react";
import { useCallback } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: SwipeGestureOptions) => {
  const bind = useDrag(
    ({ down, movement: [mx], direction: [xDir], velocity }) => {
      if (!enabled) return;

      const trigger = Math.abs(mx) > threshold;
      const dir = xDir < 0 ? -1 : 1;

      if (!down && trigger) {
        // Swipe left (negative direction)
        if (dir === -1 && onSwipeLeft) {
          onSwipeLeft();
        }
        // Swipe right (positive direction)
        else if (dir === 1 && onSwipeRight) {
          onSwipeRight();
        }
      }
    },
    {
      axis: "x", // Only horizontal movement
      bounds: { left: -300, right: 300, top: 0, bottom: 0 }, // Allow some horizontal movement
      // rubberband: true, // Elastic effect when dragging beyond bounds
      // filterTaps: true, // Ignore taps
      // preventScroll: true, // Prevent page scrolling during drag
    },
  );

  return bind;
};
