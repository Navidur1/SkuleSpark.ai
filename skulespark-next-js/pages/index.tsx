import React, { useState } from 'react';

const PDFViewer = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfURL, setPdfURL] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setPdfFile(selectedFile);
  };

  const handleUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);

      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setPdfURL(data.gcs_pdf_url); // Assuming the backend returns the GCS URL
    } catch (error) {
      console.error('Error uploading PDF:', error);
    }
  };

  const displayPDF = () => {
    if (!pdfURL) {
      return <div>No PDF uploaded</div>;
    }

    return (
      <div>
        <h2>Uploaded PDF:</h2>
        <iframe src={`https://docs.google.com/viewer?url=${pdfURL}&embedded=true`} title="pdf-viewer" width="100%" height="600px" />
      </div>
    );
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept=".pdf" />
      <button onClick={handleUpload}>Upload PDF</button>
      {displayPDF()}
    </div>
  );
};

export default PDFViewer;
