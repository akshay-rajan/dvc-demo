import io
import cv2
import torch
import pickle
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import base64

from src.utils import preprocess_frame, process_state_dict
from neuralcompression.models.deep_video_compression import DVC

app = FastAPI()

MODEL_PATHS = [
    "dvc_1.pth",
    "dvc_6.pth",
    "dvc_7.pth",
    "dvc_10.pth",
]

models = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Load the models on startup
@app.on_event("startup")
async def startup_event():
    try:
        for model_path in MODEL_PATHS:
            # Load model and move to device
            model = DVC()
            state_dict = torch.load(model_path, map_location=device)
            model.load_state_dict(process_state_dict(state_dict))
            model.to(device)
            model.eval()
            model.update(force=True)  # Update entropy models
            models[model_path] = model # Store the model in a dictionary
            print(f"Model {model_path} loaded.")
    except Exception as e:
        print(f"Error loading model: {e}")

# Health Check
@app.get("/")
def read_root():
    return {"message": "Deep Video Compression API is running!"}

# Compress Endpoint
@app.post("/compress")
async def compress_frame(
    frame1: UploadFile = File(...),
    frame2: UploadFile = File(...),
    model_path: str = "dvc_1_.pth"
):
    try:
        # Convert the frames to tensors
        img1 = preprocess_frame(frame1, device)
        img2 = preprocess_frame(frame2, device)

        # Check if the model is loaded        
        model = models.get(model_path)
        if model is None:
            return JSONResponse(
                content={"error": "Model not found"}, 
                status_code=404
            )

        compressed = model.compress(img1, img2)

        # Pickle the entire object
        blob = pickle.dumps(compressed)

        return Response(content=blob, media_type="application/octet-stream")
    
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

# Decompress Endpoint
@app.post("/decompress")
async def decompress_frame(
    frame1: UploadFile = File(...),
    compressed_blob: UploadFile = File(...),
    model_path: str = "dvc_1_.pth"
):
    try:
        img1 = preprocess_frame(frame1, device)
        
        # Check if the model is loaded
        model = models.get(model_path)
        if model is None:
            return JSONResponse(
                content={"error": "Model not found"}, 
                status_code=404
            )

        # Read and unpickle blob
        blob_bytes = await compressed_blob.read()
        compressed_input = pickle.loads(blob_bytes)

        # Decompress
        image2_reconstructed = model.decompress(img1, compressed_input)

         # Detach the tensor and convert to NumPy
        recon_np = image2_reconstructed.squeeze(0).permute(1, 2, 0).detach().cpu().numpy()
        recon_np = (recon_np * 255).astype(np.uint8)
        recon_bgr = cv2.cvtColor(recon_np, cv2.COLOR_RGB2BGR)

        _, jpeg_img = cv2.imencode('.jpg', recon_bgr)
        return JSONResponse(
            content={
                "reconstructed": base64.b64encode(jpeg_img.tobytes()).decode('utf-8')
            }
        )

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
