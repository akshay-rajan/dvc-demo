import React from 'react';
import Stats from './Stats';

export default function Output(props) {
  return (
    <>
      <div className="mt-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-2">Reconstructed Frame</h2>
        <img src={props.reconstructed} alt="Reconstructed Frame" className="rounded shadow-md" />
      </div>

      <Stats {...props} />
    </>
  );
}
