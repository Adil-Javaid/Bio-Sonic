from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import numpy as np
from tensorflow.keras.models import load_model
import librosa
import io
import soundfile as sf
from scipy.signal import butter, lfilter
import os
from datetime import datetime
# from pymongo import MongoClient
from bson import ObjectId
import motor.motor_asyncio
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

app = FastAPI()

uri = "mongodb+srv://asaduser780:tMvhQMoLgqPuD9qw@cluster0.rop4rd5.mongodb.net/asaduser780?retryWrites=true&w=majority&appName=Cluster0"
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# MONGODB_URL = "mongodb://localhost:27017"  # Replace with your MongoDB URL
# client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client["biosonic"]  # Your database name
predictions_collection = db["predictions"]  # Collection for storing results
users_collection = db["bioUsers"]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.on_event("startup")
# async def startup_db_client():
#     try:
#         # Send a ping to confirm a successful connection
#         await client.admin.command('ping')
#         print("Pinged your deployment. You successfully connected to MongoDB!")
#     except Exception as e:
#         print("MongoDB connection failed:", e)
#         raise
# Load model and labels
model = load_model(r"C:\Users\FA21-BSE-006.cuilhr\Desktop\Bio Sonic\Backend\ai model\biosonic_augmented_model.h5")
DISEASE_LABELS = [
    "asthma", "asthma + lung fibrosis", "bronchiectasis", "bronchiolitis", "copd",
    "healthy", "heart failure", "heart failure + copd", "heart failure + lung fibrosis",
    "lrti", "lung fibrosis", "pleural effusion", "pneumonia", "urti"
]

# Bandpass filter
def bandpass_filter(y, sr, lowcut=100.0, highcut=2000.0):
    nyq = 0.5 * sr
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(4, [low, high], btype='band')
    return lfilter(b, a, y)

# Notch filter
def notch_filter(y, sr, notch_freq=50.0, Q=30.0):
    nyq = 0.5 * sr
    notch = notch_freq / nyq
    b, a = butter(2, [notch - 0.01, notch + 0.01], btype='bandstop')
    return lfilter(b, a, y)

# Process audio
def process_audio(file_bytes, max_len=100, n_mfcc=13):
    try:
        y, sr = sf.read(io.BytesIO(file_bytes))
        if len(y.shape) > 1:
            y = np.mean(y, axis=1)
        y = bandpass_filter(y, sr)
        y = notch_filter(y, sr)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc).T
        if mfcc.shape[0] < max_len:
            mfcc = np.pad(mfcc, ((0, max_len - mfcc.shape[0]), (0, 0)))
        else:
            mfcc = mfcc[:max_len, :]
        return np.expand_dims(mfcc, axis=0)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Audio processing error: {str(e)}")

@app.post("/predict")
async def predict(
    age: float = Form(...),
    chest: str = Form(...),
    gender: str = Form(...),
    audio: UploadFile = File(...),
    user_id: str = Form(None)  # Optional user ID
):
    try:
        # Save the uploaded file (keep your existing file handling code)
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_path = os.path.join(upload_dir, f"recording_{timestamp}.wav")
        
        with open(file_path, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)
        
        print(f"Saved uploaded file to: {file_path}")
        
        # Process metadata
        chest_array = np.array([float(x.strip()) for x in chest.split(",")])
        gender_array = np.array([float(x.strip()) for x in gender.split(",")])
        
        if chest_array.shape[0] != 21 or gender_array.shape[0] != 3:
            raise HTTPException(status_code=400, detail="Metadata shape mismatch")
        
        age_array = np.array([[age]])
        chest_array = chest_array.reshape(1, -1)
        gender_array = gender_array.reshape(1, -1)

        # Process audio
        mfcc_features = process_audio(content)

        # Make prediction
        prediction = model.predict([age_array, chest_array, gender_array, mfcc_features])[0]
        top_indices = prediction.argsort()[-3:][::-1]
        result = {DISEASE_LABELS[i]: f"{round(prediction[i]*100, 2)}%" for i in top_indices}
        
        # Store results in MongoDB
        prediction_doc = {
            "timestamp": datetime.now(),
            "audio_path": file_path,
            "results": result,
            "metadata": {
                "age": age,
                "chest": chest,
                "gender": gender
            }
        }
        
        if user_id:
            prediction_doc["user_id"] = user_id
        
        # Insert prediction into MongoDB
        insert_result = await predictions_collection.insert_one(prediction_doc)
        
        return {
            "status": "success",
            "predictions": result,
            "prediction_id": str(insert_result.inserted_id),
            "file_received": audio.filename,
            "file_size": f"{len(content)/1024:.2f} KB"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint to get prediction history
@app.get("/predictions/{user_id}")
async def get_predictions(user_id: str):
    try:
        predictions = await predictions_collection.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).to_list(100)
        
        # Convert ObjectId to string for JSON serialization
        for pred in predictions:
            pred["_id"] = str(pred["_id"])
            
        return {"status": "success", "predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test")
async def test_connection():
    return {"status": "success", "message": "API is working", "db_status": "connected" if client else "disconnected"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)   
# @app.get("/test")
# async def test_connection():
#     return {"status": "success", "message": "API is working"}

# if __name__ == "__main__":
#     uvicorn.run(app, host="192.168.100.9", port=7860)  # Use 0.0.0.0 to allow LAN access