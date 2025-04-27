import React, { useState } from "react";
import axios from "axios";
import ModelSelect from "./components/ModelSelect";
import { FrameInput } from "./components/FrameInput";
import Output from "./components/Output";

const API_URL = "http://localhost:8000";
const MODEL_PLACEHOLDER = "dvc_1.pth";

export default function App() {
  const [frame1, setFrame1] = useState(null);
  const [frame2, setFrame2] = useState(null);
  const [reconstructed, setReconstructed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelPath, setModelPath] = useState(MODEL_PLACEHOLDER);

  const [compressionTime, setCompressionTime] = useState(null);
  const [decompressionTime, setDecompressionTime] = useState(null);
  const [compressionRatio, setCompressionRatio] = useState(null);

  const handleCompressAndDecompress = async () => {
    if (!frame1 || !frame2) {
      alert("Please upload both frames.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("frame1", frame1);
      formData.append("frame2", frame2);

      const startCompress = performance.now();
      const compressResp = await axios.post(`${API_URL}/compress?model_path=${modelPath}`, formData, {
        responseType: 'blob'
      });

      const compressedBlob = compressResp.data;
      
      const endCompress = performance.now();
      setCompressionTime((endCompress - startCompress).toFixed(2)); // in milliseconds

      // Compression ratio calculation
      const originalSize = frame1.size + frame2.size; // in bytes
      const compressedSize = compressedBlob.size; // in bytes
      const ratio = originalSize / compressedSize;
      setCompressionRatio(ratio.toFixed(2)); // 2 decimal places

      const decompressForm = new FormData();
      decompressForm.append("frame1", frame1);
      decompressForm.append("compressed_blob", new Blob([compressedBlob], { type: 'application/octet-stream' }), 'compressed_blob.pkl');
      
      const startDecompress = performance.now();
      const decompressResp = await axios.post(`${API_URL}/decompress?model_path=${modelPath}`, decompressForm);
      const endDecompress = performance.now();
      setDecompressionTime((endDecompress - startDecompress).toFixed(2));

      setReconstructed("data:image/jpeg;base64," + decompressResp.data.reconstructed);

    } catch (err) {
      console.error("Compression/Decompression failed", err);
      alert("An error occurred during processing.");
    }
    setLoading(false);
  };

  let outputProps = {
    reconstructed: reconstructed,
    compressionTime: compressionTime,
    decompressionTime: decompressionTime,
    compressionRatio: compressionRatio
  };

  return (
    <div className="min-h-screen min-w-screen p-8 bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-black">Deep Video Compression</h1>
      <div className="space-y-4 ">        
        <FrameInput setFrame1={setFrame1} setFrame2={setFrame2} />
        <ModelSelect modelPath={modelPath} setModelPath={setModelPath} />        

        <button onClick={handleCompressAndDecompress} className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 w-full" disabled={loading ? true : false}>
          {loading ? "Processing..." : "Compress & Decompress"}
        </button>
      </div>
      {reconstructed && 
        <Output {...outputProps} />
      }
    </div>
  );
}
