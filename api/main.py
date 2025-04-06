# app.py
import io
import torch
import pickle
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import base64
from neuralcompression.models.deep_video_compression import DVC

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and move to device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = DVC()
model.load_state_dict(torch.load("dvc_1_.pth", map_location=device))
model.to(device)
model.eval()
model.update(force=True)  # Update entropy models

# Helper to read and preprocess frame
def preprocess_frame(file: UploadFile):
    contents = file.file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_rgb = img_rgb.astype(np.float32) / 255.0
    tensor = torch.from_numpy(img_rgb).permute(2, 0, 1).unsqueeze(0).to(device)
    return tensor



# Compress Endpoint
@app.post("/compress")
async def compress_frame(
    frame1: UploadFile = File(...),
    frame2: UploadFile = File(...)
):
    try:
        img1 = preprocess_frame(frame1)
        img2 = preprocess_frame(frame2)

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
    compressed_blob: UploadFile = File(...)
):
    try:
        img1 = preprocess_frame(frame1)

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
        return JSONResponse(content={"reconstructed": base64.b64encode(jpeg_img.tobytes()).decode('utf-8')})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
