import React from 'react';

export default function Output({ reconstructed }) {
  return (
    <div className="mt-8 w-full max-w-md">
      <h2 className="text-xl font-semibold mb-2">Reconstructed Frame</h2>
      <img src={reconstructed} alt="Reconstructed Frame" className="rounded shadow-md" />
    </div>
  );
}
