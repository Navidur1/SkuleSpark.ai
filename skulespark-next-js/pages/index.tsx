import React, { useState } from 'react';
import MarkdownRenderer from '../pages/MarkdownRenderer';

const PDFViewer = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfURL, setPdfURL] = useState('');
  const [ocrResult, setOCRResult] = useState([]);
  const [fileId, setFileId] = useState(null);
  const [chatReady, setChatReady] = useState(false);
  const [userInput, setUserInput] = useState('')
  const [chatOutput, setChatOutput] = useState('')
  const [sources, setSources] = useState([])
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
      setFileId(data.file_id);
    } catch (error) {
      console.error('Error uploading PDF:', error);
    }
  };

  const displayPDF = () => {
    if (!pdfURL) {
      return <div>No PDF uploaded</div>;
    }

    return (
      <div style={{width: '45%'}}>
        <h2>Uploaded PDF:</h2>
        <iframe src={`https://docs.google.com/viewer?url=${pdfURL}&embedded=true`} title="pdf-viewer" width="100%" height="600px" />
      </div>
    );
  };

  const handleOCRConfirm = async () => {
    // Add your logic here to handle the click event
    //console.log('Button clicked!');
    //send to embed
    try{
  
      const response = await fetch('http://127.0.0.1:5000/create_embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Set the content type to JSON
        },
        body: JSON.stringify({ file_id: fileId }), // Stringify the body if it's JSON data
      });
      if (response.ok) {
        // Request was successful
        const data = await response.json();
        // Update your state variable based on the response data or set it to true
        setChatReady(true);
      
      }
    }
    catch (error) {
      console.error('Error during OCR:', error);
    }
    //if ok


    // For example, if you want to perform an action when the button is clicked, you can add your code here.
    // For now, let's just display an alert as an example.
    //alert('Button clicked!');
  };
  const displayOCRResult = () => {
    if (ocrResult.length == 0) {
      return <div></div>;
    }

    return (
      <div style={{width: '45%'}}>
        <h2>OCR Results:</h2>
        <div style={{ overflowY: 'auto', maxHeight: '600px' /* Define your desired height here */ }}>
        {ocrResult.map((result, index) => (
          <div style={{border: '1px solid', padding: "5px 5px"}}key={index}
          contentEditable="true"
          >
            {/* Assuming each element in the ocrResult array is a string */}
            <p>{result['text']}</p>
          </div>
        ))}
        </div>
         <button onClick={handleOCRConfirm}>Confirm OCR Results</button>
      </div>
    );
  };


  const updateChat = async () => {
    // TODO: Add logic to generate new chat output based on the user input
    // For now, let's echo the user input
    try{
  
      const response = await fetch('http://127.0.0.1:5000/chat-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Set the content type to JSON
        },
        body: JSON.stringify({ file_id: fileId, message: userInput }), // Stringify the body if it's JSON data
      });
      if (response.ok) {
        // Request was successful
        const data = await response.json();
        // Update your state variable based on the response data or set it to true
        setChatOutput(`SkuleSpark: ${data.answer}`);
        setSources(data.sources)
        setUserInput('');
      
      }
    }
    catch (error) {
      console.error('Error during chat:', error);
    }
    
  };

  const displayChat = () => {
    if (!chatReady) {
      return <div></div>;
    }

    return (
      <div>
        <h2>Chat with your recently updated Note:</h2>
        <div style={{ display: 'flex' }}>
          {/* Chat Input */}
          <div style={{ flex: 1 }}>
            <h2>Question</h2>
            <input
              type="text"
              placeholder="Type your question..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <button onClick={updateChat}>Ask</button>
          </div>

          {/* Chat Output */}
          <div style={{ flex: 1, textAlign: 'left' }}>
            <h2>Answer</h2>
            <MarkdownRenderer content={chatOutput} />
            <h3>Sources: </h3>
            {sources.map((source, index) => (
              <div key={index}>
                {/* Assuming each element in the ocrResult array is a string */}
                <p>{source}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept=".pdf" />
      <button onClick={handleUpload}>Upload PDF</button>
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px'}}>
        {displayPDF()}
        {displayOCRResult()}
      </div>

      {displayChat()}
    </div>
  );
};

export default PDFViewer;
