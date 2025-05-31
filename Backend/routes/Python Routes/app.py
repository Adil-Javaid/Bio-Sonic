from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import uvicorn
import numpy as np
from tensorflow.keras.models import load_model
import librosa
import io
import soundfile as sf
from scipy.signal import butter, lfilter

app = FastAPI()

# Load model and labels
model = load_model(r"C:\Users\LENOVO\biosonic\biosonic_augmented_model.h5")
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

@app.post("/predict")
async def predict(
    age: float = Form(...),
    chest: str = Form(...),
    gender: str = Form(...),
    audio: UploadFile = File(...)
):
    try:
        chest_array = np.array([float(x.strip()) for x in chest.split(",")])
        gender_array = np.array([float(x.strip()) for x in gender.split(",")])
    except:
        return {"error": "Invalid metadata input"}
    
    if chest_array.shape[0] != 21 or gender_array.shape[0] != 3:
        return {"error": "Metadata shape mismatch"}
    
    age_array = np.array([[age]])
    chest_array = chest_array.reshape(1, -1)
    gender_array = gender_array.reshape(1, -1)

    file_bytes = await audio.read()
    mfcc_features = process_audio(file_bytes)

    prediction = model.predict([age_array, chest_array, gender_array, mfcc_features])[0]
    top_indices = prediction.argsort()[-3:][::-1]
    result = {DISEASE_LABELS[i]: f"{round(prediction[i]*100, 2)}%" for i in top_indices}
    return {"Top-3 Predictions": result}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=7860)
