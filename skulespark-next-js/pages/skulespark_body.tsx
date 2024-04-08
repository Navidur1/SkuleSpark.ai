import React, { useState, useEffect, useRef } from 'react';
import './style/skulespark_body.css';
import Notebook from './icons/notebook.png';
import Image from 'next/image';
import CourseList, { Course, fetchCourses } from './course_list';
import CourseNotes, { Note } from './course_note';
import AugmentedNote from '../pages/AugmentedNote';
import Chatbot from '../pages/ChatBot';
import Modal from 'react-modal';
import PdfViewer from '../pages/PdfViewer.tsx';
import YouTube from 'react-youtube';
import MarkdownRenderer from '../pages/MarkdownRenderer';

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
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfURL, setPdfURL] = useState('');
  const [ocrResult, setOCRResult] = useState([]);
  const [notesElements, setNotesElements] = useState([])
  const elementRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [noteType, setNoteType] = useState(null)
  const [fileId, setFileId] = useState(null);
  const [noteListKey, setNoteListKey] = useState(0);
  const [examData, setExamData] = useState({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [showUploadedNote, setShowUploadedNote] = useState(false);
  const [ocrComplete, setOCRComplete] = useState(false);
  const [summary, setSummary] = useState([]);
  const [links, setLinks] = useState([]);
  const [videos, setVideos] = useState([]);
  const [activeSection, setActiveSection] = useState([]);
  const [sourcesHighlight, setSourcesHighlight] = useState([])
  const onCloseModal = () => {
    setModalIsOpen(false);
  };

  const handleButtonClick = () => {
    setShowAdditionalColumns(!showAdditionalColumns);
    setSelectedCourse(null); // Reset selected course when toggling columns
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleSelectNote = (note: Note) => {
    setShowUploadedNote(false);
    const fetchNoteData = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5000/note_data/${note._id.$oid}`, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          // Update the file structure state
          setSummary(data.summary);
          setLinks(data.links);
          setVideos(data.videos);
          console.log("ajkhsdksa");
          console.log(data);
          setChatReady(data.chat_ready);
        } else {
          console.error('Failed to fetch note data');
        }
      } catch (error) {
        console.error('Error fetching note data:', error);
      }
    };

    fetchNoteData();
    setSourcesHighlight([])
    setSelectedNote(note);
    setPdfURL(note.gcs_link);
    getQuiz(note);
    setFileId(note._id.$oid)
  };
  const updatePdfURL = newValue => {
    setPdfURL(newValue);
  }
  const updateSourcesHighlight = newValue => {
    setSourcesHighlight(newValue);
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
    setModalIsOpen(true);
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
      setOCRComplete(false);

    } catch (error) {
      console.error('Error uploading PDF:', error);
    }
  };

  const handleCancelUploadNote = () => {
    setShowUploadNotePopup(false);
    setModalIsOpen(false);
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

  const featureDropDown = () => {
    
    const toggleSection = (sectionName) => {
      setActiveSection((prevSections) =>
        prevSections.includes(sectionName)
          ? prevSections.filter((name) => name !== sectionName)
          : [...prevSections, sectionName]
      );
    };
    
    const isSectionActive = (sectionName) => activeSection.includes(sectionName);

    const renderModule = (sectionName, content) => (
      <div key={sectionName} style={{ marginBottom: '5px', marginTop: '5px' }}>
        <button onClick={() => toggleSection(sectionName)} className={`aiFeatureModules ${isSectionActive(sectionName) ? '' : 'collapsed'}`}>{sectionName}</button>
        {isSectionActive(sectionName) && <div>{content}</div>}
      </div>
    );

    return (
      <div>
      {renderModule('Chat', displayChat())}
      {renderModule('Note Summary', displaySummary())}
      {renderModule('Relevant Links', displayLinks())}
      {renderModule('Relevant Videos', displayVideos())}
      {renderModule('Recommended Exam Questions', displayQuiz())}
      </div>
    );
  };

  const displayQuiz = () => {
    if (examData && Object.keys(examData).length > 0) {
      return (
        <div>
          {/* <div>
            <h2>Try These Questions</h2>
          </div> */}
          
          {Object.keys(examData).map((examId) => (
            <div key={examId} style={{ marginBottom: '20px' }}>
            <h3 style={{ marginLeft: '40px', marginTop: '10px', display: 'block' }}>Recommended Exam:</h3>
            <a
              href={examData[examId].exam_url}
              target="_blank"
              rel="noopener noreferrer"
              className='viewExamButton'
            >
              View Original Exam
          </a>

            <ul style={{ margin: '1px', listStyleType: 'disc' }}>
              {examData[examId].exam_questions.map((question, index) => (
                <li key={index} style={{ marginBottom: '30px' }} className="quizList">
                  <h3 style={{ borderBottom: '1px solid black', paddingBottom: '5px' }}>Extracted Question {index + 1}:</h3>
                  <div dangerouslySetInnerHTML={{ __html: question }} />
                </li>
              ))}
            </ul>

            </div>
          ))}
        </div>
      );
    }
  };

  const getQuiz = async (note: Note) => {

    try{
      const response = await fetch(`http://127.0.0.1:5000/get-quiz/${note?._id.$oid}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setExamData(data)
      }
    }
    catch (error) {
      console.error('Error during fetching augmented notes:', error);
    }

  }


  const displayChat = () => {
    if (!chatReady) {
      return <div></div>;
    }

    return( <Chatbot fileId = {fileId} courseCode={selectedCourse} updateHighlight = {updateSourcesHighlight} updatePDFLink={updatePdfURL} PDFLink={pdfURL}/>)
  };

  const displaySummary = () => {
    if(summary == null || summary.length == 0){
      return(<div></div>)
    }

    return(
      <div>
        <h2>Note Summary:</h2>
        {summary}
      </div>
    )
  }

  const displayLinks = () => {
    if(links == null || links.length == 0){
      return <div></div>
    }

    return (
      <div>
        <h2>Check out these links:</h2>
        <ul>
          {links.map((link, index) => (
            <li key={index}>
              <a href={link} target="_blank" rel="noopener noreferrer">
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const displayVideos = () => {
    if(videos == null || videos.length == 0){
      return <div></div>
    }

    const opts = {
      height: '300',
      width: '100%',
      playerVars: {
        autoplay: 0,
      },
    };

    const onReady = (event) => {
      event.target.pauseVideo();
    };

    return (
      <div>
        <h2>Check out these videos:</h2>
        <ul className="videoList">
          {videos.map((video_id, index) => (
            <li key={index}>
              <YouTube videoId={video_id} opts={opts} onReady={onReady}/>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setPdfFile(selectedFile);
  };

  const displayOCRResult = () => {
    if (ocrResult.length == 0) {
      return <div></div>;
    }

    if(ocrComplete == false)
    {
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
    }
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

        setSummary(data.summary);
        setLinks(data.links);
        setVideos(data.videos);
        setChatReady(true);
        getAugmentedNotes();
        setShowUploadNotePopup(false);
        setModalIsOpen(false);
        setSourcesHighlight([]);
        setShowUploadedNote(true);
        setOCRComplete(true);
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
                + Create Course
              </button>
            </div>
          </div>
          <div className={`column ${showAdditionalColumns ? 'small' : ''}`}>
            <CourseNotes key={noteListKey} selectedCourse={selectedCourse} onSelectNote={handleSelectNote} fileStructure={fileStructure} />
            <div>
              {selectedCourse != null && (
                <button onClick={handleUploadNote} className="uploadNoteButton">
                  + Upload Note
                </button>
              )}
            </div>
          </div>
        </>
      )}
      
      <div className={`column column2 ${showAdditionalColumns ? 'small' : ''}`}>
        {(selectedNote != null) ? (
          <>
            <PdfViewer pdfLink ={`${pdfURL}`} highlight = {sourcesHighlight} />
          </>
        ) : (
          <div></div>
        )}

        {(selectedNote == null && showUploadedNote == true) ? (
          <>
            <PdfViewer pdfLink ={`${pdfURL}`} highlight={sourcesHighlight} />
          <iframe
          src={`https://docs.google.com/viewer?url=${pdfURL}&embedded=true`}
          title="pdf-viewer"
          width="100%"
          height="100%"
        />
        </>
        ) : (
          <div></div>
        )}
      </div>
      <div className="column column3">
        {/*{displayAugmentedNotes()}*/}
        {/* {displayChat()}
        {displaySummary()}
        {displayLinks()}
        {displayVideos()}
        {displayQuiz()} */}
        {featureDropDown()}
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
        <Modal isOpen={modalIsOpen} onRequestClose={onCloseModal}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          },
          content: {
            width: '50%', // Set the width of the modal
            height: '50%', // Set the height of the modal
            margin: 'auto', // Center the modal horizontally
          }, 
        }}>
        <h2>Upload Note</h2>
        <input type="file" onChange={handleFileChange} accept=".pdf" />
        <div>
          <input
            type="radio"
            id="typed"
            name="note-type"
            value="typed"
            onChange={handleNoteTypeChange}
          />
          <label htmlFor="typed">Typed</label>
  
          <input
            type="radio"
            id="handwritten"
            name="note-type"
            value="handwritten"
            onChange={handleNoteTypeChange}
          />
          <label htmlFor="handwritten">Handwritten</label>
  
          <input
            type="radio"
            id="both"
            name="note-type"
            value="both"
            onChange={handleNoteTypeChange}
          />
          <label htmlFor="both">Typed + Handwritten</label>
        </div>
        <button onClick={handleUpload}>Upload</button>
        <button onClick={handleCancelUploadNote}>Cancel</button>
        {displayOCRResult()}
        </Modal>
        )}  
    </div>
  );
};

export default SkuleSparkBody;
