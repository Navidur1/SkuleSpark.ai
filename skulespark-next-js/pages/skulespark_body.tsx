import React, { useState, useEffect, useRef } from 'react';
import './style/skulespark_body.css';
import Notebook from './icons/notebook.png';
import Image from 'next/image';
import CourseList, { Course, fetchCourses } from './course_list';
import CourseNotes, { Note } from './course_note';
import MarkdownRenderer from '../pages/MarkdownRenderer';
import AugmentedNote from '../pages/AugmentedNote';
import Chatbot from '../pages/ChatBot';
interface SkuleSparkBodyProps{
  fileStructure: Course[];
}

const SkuleSparkBody = ({fileStructure}) => {
  const [showAdditionalColumns, setShowAdditionalColumns] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCreateCoursePopup, setShowCreateCoursePopup] = useState(false);
  const [showUploadNotePopup, setShowUploadNotePopup] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseListKey, setCourseListKey] = useState(0); // Add key state
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [chatReady, setChatReady] = useState(false);
  const [userInput, setUserInput] = useState('')
  const [chatOutput, setChatOutput] = useState('')
  const [sources, setSources] = useState([])
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfURL, setPdfURL] = useState('');
  const [ocrResult, setOCRResult] = useState([]);
  const [notesElements, setNotesElements] = useState([])
  const elementRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [noteType, setNoteType] = useState(null)
  const [fileId, setFileId] = useState(null);
  const [noteListKey, setNoteListKey] = useState(0);
  

  const handleButtonClick = () => {
    setShowAdditionalColumns(!showAdditionalColumns);
    setSelectedCourse(null); // Reset selected course when toggling columns
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setFileId(note._id.$oid)
    setChatReady(true)
  };

  const handleCreateCourse = () => {
    setShowCreateCoursePopup(true);
  };

  const handleCancelCreateCourse = () => {
    setShowCreateCoursePopup(false);
    setNewCourseName(''); // Reset the input field
  };

  const handleUploadNote = () => {
    setShowUploadNotePopup(true);
    handleUpload();
  }

  const handleNoteTypeChange = (e) => {
    setNoteType(e.target.value)
  }

  const handleUpload = async () => {
    try {
      if(noteType == null){
        return // Should indicate some sort of alert to the user
      }
      
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('note_type', noteType);
      console.log(selectedCourse?.course)
      formData.append('course', selectedCourse?.course);

      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setPdfURL(data.gcs_pdf_url);
      setOCRResult(data.ocr_result);
      setFileId(data.file_id);

      // Increment the key to force re-render of CourseNotes
      setNoteListKey((prevKey) => prevKey + 1);

    } catch (error) {
      console.error('Error uploading PDF:', error);
    }
  };

  const handleCancelUploadNote = () => {
    setShowUploadNotePopup(false);
  };
  

  const handleConfirmCreateCourse = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_code: newCourseName }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Course created:', data);

        const newCourse: Course = {
          course: newCourseName,
          notes: []
        };

        setCourses((courses) => [...courses, newCourse]);

        // Increment the key to force re-render of CourseList
        setCourseListKey((prevKey) => prevKey + 1);

        setShowCreateCoursePopup(false);
        setNewCourseName(''); // Reset the input field
      }
    } catch (error) {
      console.error('Error during course creation:', error);
    }
  };

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
    return( <Chatbot fileId = {fileId}/>)
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setPdfFile(selectedFile);
  };

  const displayOCRResult = () => {
    if (ocrResult.length == 0) {
      return <div></div>;
    }

    return (
      <div>
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

  const displayAugmentedNotes = () => {
    if (notesElements.length<=0){
      return <div></div>;
    }
    
    return <div className='augmented-notes-wrapper'> <AugmentedNote elements={notesElements} /> </div>
  }

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
        body: JSON.stringify({file_id: fileId , confirmed_elements: updatedElements}),
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

  useEffect(() => {
    // Fetch courses when the key changes
    const fetchData = async () => {
      const data = await fetchCourses();
      if (data) {
        setCourses(data);
      }
    };

    fetchData();
  }, [courseListKey]); // Update the effect dependency

  return (
    <div className="bodyWrapper">
      <div className="column column1">
        <button className="sidebarButton" onClick={handleButtonClick}>
          <Image src={Notebook} alt="" className="sidebarButtonImage" />
        </button>
      </div>
      {showAdditionalColumns && (
        <>
          <div className={`column ${showAdditionalColumns ? 'small' : ''}`}>
            {/* Use key attribute to force re-render of CourseList */}
            <CourseList key={courseListKey} onSelectCourse={handleSelectCourse} courses={courses} />
            <div>
              <button onClick={handleCreateCourse} className="createCourseButton">
                Create Course
              </button>
            </div>
          </div>
          <div className={`column ${showAdditionalColumns ? 'small' : ''}`}>
            <CourseNotes key={noteListKey} selectedCourse={selectedCourse} onSelectNote={handleSelectNote} fileStructure={fileStructure} />
            <div>
              {selectedCourse != null && (
                <button onClick={handleUploadNote} className="uploadNoteButton">
                  Upload Note
                </button>
              )}
            </div>
          </div>
        </>
      )}
      <div className={`column column2 ${showAdditionalColumns ? 'small' : ''}`}>
        {selectedNote ? (
          <iframe
            src={`https://docs.google.com/viewer?url=${selectedNote.gcs_link}&embedded=true`}
            title="pdf-viewer"
            width="100%"
            height="100%"
          />
        ) : (
          'No note selected. Select a note to view PDF!'
        )}
      </div>
      <div className="column column3">
        {/*{displayAugmentedNotes()}*/}
        {displayChat()}
      </div>

      {/* Popup for creating a new course */}
      {showCreateCoursePopup && (
        <div className="popup">
          <input
            type="text"
            placeholder="Enter course name"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
          />
          <button onClick={handleCancelCreateCourse}>Cancel</button>
          <button onClick={handleConfirmCreateCourse}>Confirm</button>
        </div>
      )}

      {/* Popup for uploading a new note */}
      {showUploadNotePopup && selectedCourse != null && (
        <div className="popup">
          <input type="file" onChange={handleFileChange} accept=".pdf" />
          <button onClick={handleCancelUploadNote}>Cancel</button>
          <button onClick={handleUploadNote}>Confirm</button>
          <div>
            <input type="radio" id="typed" name="note-type" value="typed" onChange={handleNoteTypeChange}/>
            <label for="typed">Typed</label>

            <input type="radio" id="handwritten" name="note-type" value="handwritten" onChange={handleNoteTypeChange}/>
            <label for="handwritten">Handwritten</label>

            <input type="radio" id="both" name="note-type" value="both" onChange={handleNoteTypeChange}/>
            <label for="both">Typed + Handwritten</label>
          </div>
          {displayOCRResult()}
        </div>
      )}
    </div>
  );
};

export default SkuleSparkBody;
