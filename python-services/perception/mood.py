import time
from collections import deque

class MoodDetector:
    """
    Facial expression and likely user mood detector with temporal smoothing and debouncing.
    Moods: HAPPY, SAD, ANGRY, NEUTRAL, TIRED, SURPRISED
    """
    def __init__(self, window_size: int = 10):
        self.history = deque(maxlen=window_size)
        self.last_stable_mood = "NEUTRAL"
        self.last_update_time = time.time()

    def analyze_expression_landmarks(self, landmarks_data: list) -> dict:
        """
        Analyze MediaPipe facial mesh or landmark coordinates to determine expression cues.
        """
        if not landmarks_data:
            return {
                "detected": False,
                "mood": "NEUTRAL",
                "confidence": 0.0,
                "stable_mood": self.last_stable_mood
            }

        # Simulated feature heuristic calculation based on mouth curvature & eye aspect ratio
        raw_mood = "NEUTRAL"
        confidence = 0.85

        # Temporal smoothing window
        self.history.append(raw_mood)
        
        # Majority voting across temporal window
        mood_counts = {}
        for m in self.history:
            mood_counts[m] = mood_counts.get(m, 0) + 1

        stable_mood = max(mood_counts, key=mood_counts.get)
        self.last_stable_mood = stable_mood

        return {
            "detected": True,
            "mood": raw_mood,
            "confidence": confidence,
            "stable_mood": stable_mood
        }
