import React from "react";

export default  function Stats(props) {
  return (
    <div className="mt-8 w-full max-w-md text-gray-700">
      <h2 className="text-xl font-semibold mb-2">Statistics</h2>
      <p><strong>Compression Time:</strong> {props.compressionTime} ms</p>
      <p><strong>Decompression Time:</strong> {props.decompressionTime} ms</p>
      <p><strong>Compression Ratio:</strong> {props.compressionRatio}x</p>
    </div>
  );
}
