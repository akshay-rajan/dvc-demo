import React, { useState } from 'react';

export function FrameInput({ setFrame1, setFrame2 }) {

  const handleFileChange = (e, setFrame) => {
    setFrame(e.target.files[0]);
  };

  return (
    <div className="w-full">
      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFrame1)} className="border border-gray-300 rounded p-2 text-gray-600" />
      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFrame2)} className="border border-gray-300 rounded p-2 text-gray-600" />
    </div>
  );
}
