import React, { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000";

export default function App() {
  const [frame1, setFrame1] = useState(null);
  const [frame2, setFrame2] = useState(null);
  const [reconstructed, setReconstructed] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, setFrame) => {
    setFrame(e.target.files[0]);
  };

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

      const compressResp = await axios.post(`${API_URL}/compress`, formData, {
        responseType: 'blob'
      });

      const compressedBlob = compressResp.data;

      const decompressForm = new FormData();
      decompressForm.append("frame1", frame1);
      decompressForm.append("compressed_blob", new Blob([compressedBlob], { type: 'application/octet-stream' }), 'compressed_blob.pkl');

      const decompressResp = await axios.post("http://localhost:8000/decompress", decompressForm);
      setReconstructed("data:image/jpeg;base64," + decompressResp.data.reconstructed);
    } catch (err) {
      console.error("Compression/Decompression failed", err);
      alert("An error occurred during processing.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen min-w-screen p-8 bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-black">Deep Video Compression</h1>

      <div className="space-y-4 ">
        
        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFrame1)} className="border border-gray-300 rounded p-2 text-gray-600" />
        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFrame2)} className="border border-gray-300 rounded p-2 text-gray-600" />

        <p className="text-gray-600">Upload two frames to compress and decompress.</p>

        <button onClick={handleCompressAndDecompress} className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800 w-full">
          {loading ? "Processing..." : "Compress & Decompress"}
        </button>
      </div>

      {reconstructed && (
        <div className="mt-8 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-2">Reconstructed Frame</h2>
          <img src={reconstructed} alt="Reconstructed Frame" className="rounded shadow-md" />
        </div>
      )}
    </div>
  );
}
