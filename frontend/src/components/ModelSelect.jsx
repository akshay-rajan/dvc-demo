import React, { useState } from 'react';

const MODELS = [
  { path: 'dvc_1.pth', label: 'DVC 1' },
  { path: 'dvc_6.pth', label: 'DVC 6' },
  { path: 'dvc_7.pth', label: 'DVC 7' },
  { path: 'dvc_10.pth', label: 'DVC 10' },
];

export default function ModelSelect({ modelPath, setModelPath }) {
  return  <select 
    value={modelPath} 
    onChange={
      (e) => {
        setModelPath(e.target.value)
        console.log(modelPath);
      }
    } 
    className="border border-gray-300 rounded p-2 text-gray-600 w-full"
  >
    <option value="dvc_1.pth" disabled>Select a model</option>
    {MODELS.map((model) => (
      <option key={model.path} value={model.path}>
        {model.label}
      </option>
    ))}
  </select>
  ;
}
