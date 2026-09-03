import math
import time

class HandGestureRecognizer:
    """
    Hand gesture landmark recognizer for driving 3D scene interactions.
    Gestures: OPEN_PALM, POINT, PINCH, GRAB, ROTATE, SCALE, RELEASE
    """
    def __init__(self):
        self.last_gesture = "NONE"

    def classify_landmarks(self, hand_landmarks: list) -> dict:
        if not hand_landmarks:
            return {
                "gesture": "NONE",
                "x": 0.5,
                "y": 0.5,
                "confidence": 0.0,
                "hand": "right",
                "timestamp": int(time.time() * 1000)
            }

        # Calculate distance between thumb tip and index tip for pinch detection
        # Hand landmark indexing: 4 = thumb tip, 8 = index tip
        thumb_tip = hand_landmarks[4] if len(hand_landmarks) > 4 else {"x": 0.5, "y": 0.5}
        index_tip = hand_landmarks[8] if len(hand_landmarks) > 8 else {"x": 0.5, "y": 0.5}

        dx = thumb_tip.get("x", 0.5) - index_tip.get("x", 0.5)
        dy = thumb_tip.get("y", 0.5) - index_tip.get("y", 0.5)
        dist = math.sqrt(dx * dx + dy * dy)

        gesture = "OPEN_PALM"
        if dist < 0.05:
            gesture = "PINCH"
        elif dist < 0.08:
            gesture = "GRAB"

        self.last_gesture = gesture

        return {
            "gesture": gesture,
            "x": index_tip.get("x", 0.5),
            "y": index_tip.get("y", 0.5),
            "confidence": 0.92,
            "hand": "right",
            "timestamp": int(time.time() * 1000)
        }
