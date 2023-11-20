import React, { useState } from 'react';

const PDFViewer = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfURL, setPdfURL] = useState('');
  const [ocrResult, setOCRResult] = useState([]);
  const [fileId, setFileId] = useState(null);

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
      setPdfURL(data.gcs_pdf_url);
      setOCRResult(data.ocr_result);
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

  const displayOCRResult = () => {
    if (ocrResult.length == 0) {
      return <div></div>;
    }

    return (
      <div>
        <h2>OCR Results:</h2>
        {ocrResult.map((result, index) => (
          <div key={index}
          contentEditable="true"
          >
            {/* Assuming each element in the ocrResult array is a string */}
            <p>{result['text']}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept=".pdf" />
      <button onClick={handleUpload}>Upload PDF</button>
      {displayPDF()}
      {displayOCRResult()}
    </div>
  );
};

export default PDFViewer;
