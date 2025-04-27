import cv2
import torch
import numpy as np
from fastapi import UploadFile
from collections import OrderedDict

# Helper to read and preprocess frame
def preprocess_frame(file: UploadFile, device: torch.device) -> torch.Tensor:
    """
    Preprocess the uploaded image file into a tensor.
    
    Args:
        file (UploadFile): The uploaded image file.
        device (torch.device): The device to which the tensor will be moved.
    Returns:
        torch.Tensor: The preprocessed image tensor.
    """
    contents = file.file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_rgb = img_rgb.astype(np.float32) / 255.0
    tensor = torch.from_numpy(img_rgb).permute(2, 0, 1).unsqueeze(0).to(device)
    return tensor


# Process the model state dict
def process_state_dict(state_dict: OrderedDict) -> OrderedDict:
    """
    Process the state dict to remove 'module.' prefix if present.
    This is useful for loading models that were saved with DataParallel.
    
    Args:
        state_dict (OrderedDict): The state dict to process.        
    Returns:
        OrderedDict: The processed state dict.
    """
    new_state_dict = OrderedDict()
    for k, v in state_dict.items():
        # Remove 'module.' prefix if present
        key = k.replace("module.", "")  
        new_state_dict[key] = v
    return new_state_dict
