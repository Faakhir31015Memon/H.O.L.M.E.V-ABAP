import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mood import MoodDetector
from gesture import HandGestureRecognizer

app = FastAPI(title="H.O.L.M.E.V Perception Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mood_detector = MoodDetector()
gesture_recognizer = HandGestureRecognizer()

class FramePerceptionRequest(BaseModel):
    landmarks: list = []
    hand_landmarks: list = []

@app.get("/health")
def health_check():
    return {
        "service": "python-perception",
        "status": "healthy",
        "gpu_accelerated": False,
        "timestamp": int(time.time() * 1000)
    }

@app.post("/api/perception/analyze")
def analyze_perception(req: FramePerceptionRequest):
    mood_result = mood_detector.analyze_expression_landmarks(req.landmarks)
    gesture_result = gesture_recognizer.classify_landmarks(req.hand_landmarks)

    return {
        "success": True,
        "mood": mood_result,
        "gesture": gesture_result,
        "timestamp": int(time.time() * 1000)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
