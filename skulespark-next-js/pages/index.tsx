import React, { useState, useRef } from 'react';
import MarkdownRenderer from '../pages/MarkdownRenderer';
import AugmentedNote from '../pages/AugmentedNote';
const PDFViewer = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfURL, setPdfURL] = useState('');
  const [ocrResult, setOCRResult] = useState([]);
  const [fileId, setFileId] = useState(null);
  const [chatReady, setChatReady] = useState(false);
  const [userInput, setUserInput] = useState('')
  const [chatOutput, setChatOutput] = useState('')
  const [sources, setSources] = useState([])
  const [notesElements, setNotesElements] = useState([])
  const [noteType, setNoteType] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setPdfFile(selectedFile);
  };

  const handleNoteTypeChange = (e) => {
    setNoteType(e.target.value)
  }

  const elementRefs = useRef<Array<HTMLDivElement | null>>([]);

  const handleUpload = async () => {
    try {
      if(noteType == null){
        return // Should indicate some sort of alert to the user
      }
      
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('note_type', noteType);

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
    // Send confirmation to embedding service
    try{
      const updatedElements = elementRefs.current.map((ref) => {
        if (ref) {
          return {
            id: ref.dataset.id,
            text: ref.innerText,
          };
        }
      });

      const response = await fetch('http://127.0.0.1:5000/confirm_results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Set the content type to JSON
        },
        body: JSON.stringify({ file_id: fileId , confirmed_elements: updatedElements}),
      });
      if (response.ok) {
        // Request was successful
        const data = await response.json();
        setChatReady(true);
        getAugmentedNotes();
      }
    }
    catch (error) {
      console.error('Error during OCR:', error);
    }
  };

  const displayOCRResult = () => {
    if (ocrResult.length == 0) {
      return <div></div>;
    }

    return (
      <div style={{width: '45%'}}>
        <h2>OCR Results:</h2>
        <div style={{ overflowY: 'auto', maxHeight: '600px'}}>
        {ocrResult.map((result, index) => (
          <div style={{border: '1px solid', padding: "5px 5px"}}
            key={index}
            contentEditable="true"
            ref={(element) => (elementRefs.current[index] = element)}
            data-id={result['id']}
          >
            <p>{result['text']}</p>
          </div>
        ))}
        </div>
        <button onClick={handleOCRConfirm}>Confirm OCR Results</button>
      </div>
    );
  };
  const getAugmentedNotes = async () =>{
    try{
      const response = await fetch(`http://127.0.0.1:5000/augmented-note/${fileId}`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data)
        setNotesElements(data)
      
      }
    }
    catch (error) {
      console.error('Error during fetching augmented notes:', error);
    }
  }
  const displayAugmentedNotes = () => {
    if (notesElements.length<=0){
      return <div></div>;
    }
    
    return <div className='augmented-notes-wrapper'> <AugmentedNote elements={notesElements} /> </div>
  }

  const updateChat = async () => {
    // TODO: Add logic to generate new chat output based on the user input
    // For now, let's echo the user input
    try{
      const response = await fetch('http://127.0.0.1:5000/chat-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_id: fileId, message: userInput }),
      });
      if (response.ok) {
        const data = await response.json();
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
      <input type="file" onChange={handleFileChange} accept=".pdf"/>
      <div>
        <input type="radio" id="typed" name="note-type" value="typed" onChange={handleNoteTypeChange}/>
        <label for="typed">Typed</label>

        <input type="radio" id="handwritten" name="note-type" value="handwritten" onChange={handleNoteTypeChange}/>
        <label for="handwritten">Handwritten</label>

        <input type="radio" id="both" name="note-type" value="both" onChange={handleNoteTypeChange}/>
        <label for="both">Typed + Handwritten</label>
      </div>
      <button onClick={handleUpload}>Upload PDF</button>
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '10px'}}>
        {displayPDF()}
        {displayOCRResult()}
      </div>
      {displayAugmentedNotes()}
      {displayChat()}
    </div>
  );
};

export default PDFViewer;
