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
import OCRViewer from '../pages/OCRViewer.tsx';
import Backdrop from '@mui/material/Backdrop';
import StarIcon from '@mui/icons-material/Star';
import CircularProgress from '@mui/material/CircularProgress';
import { port } from '../pages/globalVars';


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
  const [hideOCROptions, setHideOCROptions] = useState(true)
  const [pageNumber, setPageNumber] = useState(1); // Initialize page number state
  const [confirmedResults, setConfirmedResults] = useState([]);
  const [coordOCR, setCoordOCR] = useState([]);
  const [OCRW, setOCRW] = useState(0);
  const [loading, setLoading] = useState(false);

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
        const response = await fetch(`http://127.0.0.1:${port}/note_data/${note._id.$oid}`, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          // Update the file structure state
          setSummary(data.summary);
          setLinks(data.links);
          setVideos(data.videos);
          setExamData(data.questions);
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
    setHideOCROptions(false);
    // handleUpload();
  }

  const handleNoteTypeChange = (e) => {
    setNoteType(e.target.value)
  }

  const handleUpload = async () => {
    try {
      if(noteType == null){
        window.alert('Please select a note type');
        return; // Should indicate some sort of alert to the user
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('note_type', noteType);
      console.log(selectedCourse?.course)
      formData.append('course', selectedCourse?.course);

      const response = await fetch(`http://127.0.0.1:${port}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      // Update the courses state with the new note data
      const updatedCourses = courses.map((course) => {
        if (course.course === selectedCourse?.course) {
          return {
            ...course,
            notes: [...course.notes, {
              _id: { $oid: data.file_id }, // Assuming data.file_id contains the new note's ID
              file_name: data.file_name, // Assuming data.file_name contains the new note's file name
              gcs_link: data.gcs_pdf_url, // Assuming data.gcs_pdf_url contains the new note's GCS link
            }]
          };
        }
        return course;
      });

      // Set the updatedCourses state
      setCourses(updatedCourses);

      setPdfURL(data.gcs_pdf_url);
      setOCRResult(data.ocr_result);
      setFileId(data.file_id);
      setOCRComplete(false);
      setHideOCROptions(true);
      setPageNumber(1);

      //iterate over data results and store in confirmedResults
      const results = data.ocr_result.map(page => page.map(element => ({"id": element["id"], "text": element["text"]})));
      setConfirmedResults(results);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error uploading PDF:', error);
    }
  };

  const handleCancelUploadNote = () => {
    setShowUploadNotePopup(false);
    setModalIsOpen(false);
  };
  

  const handleConfirmCreateCourse = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/course`, {
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
            <ul style={{ margin: '1px', listStyleType: 'disc' }}>
              {examData[examId].exam_questions.map((question, index) => (
                <li key={index} style={{ marginBottom: '30px' }} className="quizList">
                  <h3 style={{ borderBottom: '1px solid black', paddingBottom: '5px' }}>Extracted Question {index + 1}:</h3>
                  <div dangerouslySetInnerHTML={{ __html: question }} />
                </li>
              ))}
            </ul>
            <a
              href={examData[examId].exam_url}
              target="_blank"
              rel="noopener noreferrer"
              className='viewExamButton'
            >
              View Original Exam
            </a>

            </div>
          ))}
        </div>
      );
    }
  };


  const displayChat = () => {
    if (!chatReady) {
      return <div></div>;
    }

    return( <Chatbot fileId = {fileId} courseCode={selectedCourse} note= {selectedNote} updateHighlight = {updateSourcesHighlight} updatePDFLink={updatePdfURL} PDFLink={pdfURL}/>)
  };

  const displaySummary = () => {
    if(summary == null || summary.length == 0){
      return(<div></div>)
    }

    return(
      <div style={{marginBottom: '20px'}}>
        <h2>Note Summary:</h2>
        {summary}
      </div>
    )
  }

  const displayLinks = () => {
    if (links == null || Object.keys(links).length === 0) {
      return <div></div>;
    }
  
    return (
      <div className="link_master_wrapper">
        <h2>Check out these links:</h2>
        {Object.keys(links).map((term, index) => (
          <div key={index} className="link_wrapper" onClick={() => window.open(links[term].link, "_blank")}>
            <div className="link_favicon_wrapper">
              <img src={links[term].favicon_url || "https://www.google.com/favicon.ico"} alt="Favicon" />
            </div>
            <div className="link_title_wrapper">
              <a href={links[term].link} target="_blank" rel="noopener noreferrer">
                {links[term].title}
              </a>
            </div>
          </div>
        ))}
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
      <div style={{marginBottom: '10px'}}>
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
  // Function to handle next page button click
  const handleNextPage = () => {
    if(pageNumber<ocrResult.length){
      //updateCurrentPage(pageNumber);
      setCoordOCR([])
      setPageNumber(prevPageNumber => prevPageNumber + 1);
    }
    
  };
  // Function to handle previous page button click
  const handlePreviousPage = () => {
    if (pageNumber > 1) {
      //updateCurrentPage(pageNumber);
      setCoordOCR([]);
      setPageNumber(prevPageNumber => prevPageNumber - 1);
    }
  };
  const updateCurrentPage = (currPage) => {
    const updatedElements = elementRefs.current.map((ref) => {
      if (ref) {
        return {
          id: ref.dataset.id,
          text: ref.innerText,
        };
      }
    });
    setConfirmedResults(prevResults => {
      const newResults = [...prevResults]; // Create a copy of the current state
      newResults[currPage-1] = updatedElements; // Replace the array at the specified page number
      return newResults; // Update the state with the new array
    });
    console.log("UPDATED", confirmedResults);
  }

  // Function to handle text edit
  const handleTextChange = (index, text) => {
    setConfirmedResults(prevResults => {
      const newResults = [...prevResults]; // Create a copy of the current state
      newResults[pageNumber-1][index]["text"] = text; // Replace the array at the specified page number
      return newResults; // Update the state with the new array
    });
    console.log("UPDATED", confirmedResults);
    };
    const handleMouseEnter = (index) => {
      setCoordOCR(ocrResult[pageNumber-1][index]["coordinates"]);
      setOCRW(ocrResult[pageNumber-1][index]["width"]);
    };
  const displayOCRResult = () => {
    if (ocrResult.length == 0) {
      return <div></div>;
    }
    console.log("OCR", ocrResult);
    if(ocrComplete == false)
    {
      return (
        <>
        <h2 style={{textAlign: "center", marginTop:"0px"}}>OCR Results</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between'}}>
          <div style={{ flex: '1', marginRight: '20px' }}> 
          <h3 style = {{textAlign: "center"}}>Edit OCR</h3>
            <div style={{ overflowY: 'auto', maxHeight: "700px",width:"100%"}}>
            {/* {confirmedResults[pageNumber-1].map((result, index) => (
              <div style={{border: '1px solid', padding: "5px 5px"}}
                key={index}
                contentEditable="true"
                ref={(element) => (elementRefs.current[index] = element)}
                data-id={result['id']}
              >
                <p>{result['text']}</p>
              </div>
            ))} */}
            {confirmedResults[pageNumber - 1]?.map((result, index) => (
              <div style={{border: '1px solid', padding: "5px 5px"}} key={index} onClick={() => handleMouseEnter(index)}>
                <p contentEditable="true" onBlur={(e) => handleTextChange(index, e.target.innerText)}>{result["text"]}</p>
              </div>
            ))}
            </div>
            <button style={{
              marginTop: '10px',
              width: '100%',
              height: '40px',
              marginRight: '20px',
              background: 'green',
              borderRadius: '5px',
              cursor: 'pointer',
              color: 'white',
              transition: 'background-color 0.3s ease',
              fontWeight: 'bold',
              fontSize: 'large'
              }} onClick={handleOCRConfirm}>Confirm OCR Results</button>
          </div>
          <div style={{height:"700px", width:"50%"}}>
          <h3 style = {{textAlign: "center"}}>Original PDF</h3>
            <OCRViewer pdfLink={pdfURL} highlight = {coordOCR} pageNumber = {pageNumber} actualW={OCRW} /> 
            <div style={{ 
              display: 'flex',
              flex: '1',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '5px'
              }}>
              <button onClick={handlePreviousPage} style={{
                width: '200px',
                height: '40px',
                marginRight: '20px',
                background: 'white',
                borderRadius: '5px',
                cursor: 'pointer',
                color: 'blue',
                borderColor: '#112a9a',
                transition: 'background-color 0.3s ease',
                fontWeight: 'bold',
                fontSize: 'large'
              }}>Previous</button>
              <span style={{ margin: '0 10px' }}>{pageNumber}</span> {/* Display current page number */}
              <button onClick={handleNextPage} style={{
                width: '200px',
                height: '40px',
                marginLeft: '20px',
                background: 'blue',
                borderRadius: '5px',
                cursor: 'pointer',
                color: 'white',
                borderColor: '#112a9a',
                transition: 'background-color 0.3s ease',
                fontWeight: 'bold',
                fontSize: 'large'}}
                >Next</button>
            </div>
          </div>
        </div>
       
        </>
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
      const response = await fetch(`http://127.0.0.1:${port}/augmented-note/${fileId}`, {
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
      //updateCurrentPage(pageNumber);
      setLoading(true);
      console.log("CONFIRMED", confirmedResults);
      const response = await fetch(`http://127.0.0.1:${port}/confirm_results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Set the content type to JSON
        },
        body: JSON.stringify({file_id: fileId , confirmed_elements: [].concat(...confirmedResults)}),
      });
      if (response.ok) {
        // Request was successful
        const data = await response.json();

        setLoading(false);
        setSummary(data.summary);
        setLinks(data.links);
        setVideos(data.videos);
        setExamData(data.questions);
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
      setLoading(false);
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
            <CourseList key={courseListKey} onSelectCourse={handleSelectCourse} selectedCourse={selectedCourse} courses={courses} />
            <div>
              <button onClick={handleCreateCourse} className="createCourseButton">
                + Add Course
              </button>
            </div>
          </div>
          <div className={`column ${showAdditionalColumns ? 'small' : ''} noteColumn`}>
            <CourseNotes key={noteListKey} selectedCourse={selectedCourse} onSelectNote={handleSelectNote} fileStructure={courses} selectedNote={selectedNote}/>
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
          {/* <iframe
          src={`https://docs.google.com/viewer?url=${pdfURL}&embedded=true`}
          title="pdf-viewer"
          width="100%"
          height="100%"
        /> */}
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

      {/* Modal for creating a new course */}
      {showCreateCoursePopup && (
        <Modal isOpen={true} onRequestClose={() => {}} backdrop="static"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          },
          content: {
            width: '50%',
            height: '40%',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          },
        }}>
          <h2>Create Course</h2>
          <div style={{marginBottom: '1rem', display: 'flex', justifyContent: 'center'}}>
            <div style=
              {{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
              }}>
                <input
                  type="text"
                  placeholder="Course Name (Ex: ECE568)"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    margin: 'auto',
                    fontSize: 'medium',
                    flex: '1',
                    borderRadius: '20px',
                  }}
                />
                {newCourseName && (
                <button
                  onClick={() => setNewCourseName('')}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    border: 'none',
                  }}
                  >X</button>
              )}
            </div>
          </div>
          <div>
            <h3>Current List of Courses with Available Skule Exams</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon style={{marginRight: '5px' }} />
                    <span style={{ color: 'black' }}>ECE568</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon style={{marginRight: '5px'}} />
                    <span style={{ color: 'black' }}>JRE420</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center' }}>
                    <StarIcon style={{marginRight: '5px'}} />
                    <span style={{ color: 'black' }}>CHANGE ME</span>
                </li>
            </ul>
          </div>
          <div style={{display: 'flex',justifyContent: 'right'}}>
            <button onClick={() => setShowCreateCoursePopup(false)} onMouseEnter={(e) => e.target.style.backgroundColor = 'lightgray'} onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            style=
            {{
              width: '100px',
              height: '40px',
              marginRight: '20px',
              background: 'white',
              borderRadius: '5px',
              cursor: 'pointer',
              color: 'blue',
              borderColor: '#112a9a',
              transition: 'background-color 0.3s ease',
              fontWeight: 'bold',
              fontSize: 'large'
            }}>Cancel</button>
            <button onClick={handleConfirmCreateCourse} onMouseEnter={(e) => e.target.style.backgroundColor = '#112a9a'} onMouseLeave={(e) => e.target.style.backgroundColor = 'blue'}
            style=
            {{
              width: '200px',
              height: '40px',
              marginRight: '20px',
              background: 'blue',
              borderRadius: '5px',
              cursor: 'pointer',
              color: 'white',
              borderColor: '#112a9a',
              transition: 'background-color 0.3s ease',
              fontWeight: 'bold',
              fontSize: 'large'
            }}>Create</button>
          </div>
        </Modal>
      )}

      {/* Popup for uploading a new note */}
      {showUploadNotePopup && selectedCourse != null && (
        <Modal isOpen={modalIsOpen} onRequestClose={() => {}} backdrop="static"
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          },
          content: {
            width: '80%', // Set the width of the modal
            height: '90%', // Set the height of the modal
            margin: 'auto', // Center the modal horizontally
          }, 
        }}>
          <Backdrop open={loading} style={{ zIndex: 1000 }}>
                <CircularProgress sx={{ color: 'white' }} />
          </Backdrop>
          {!hideOCROptions && (
        <div>
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
          <button onClick={handleCancelUploadNote}
          style={{
            width: '100px',
            height: '40px',
            marginRight: '20px',
            background: 'white',
            borderRadius: '5px',
            cursor: 'pointer',
            color: 'blue',
            borderColor: '#112a9a',
            transition: 'background-color 0.3s ease',
            fontWeight: 'bold',
            fontSize: 'large'
          }}>Cancel</button>
          <button onClick={handleUpload}
          style={{
            width: '200px',
              height: '40px',
              marginRight: '20px',
              background: 'blue',
              borderRadius: '5px',
              cursor: 'pointer',
              color: 'white',
              borderColor: '#112a9a',
              transition: 'background-color 0.3s ease',
              fontWeight: 'bold',
              fontSize: 'large'
          }}
          >Upload</button>
        </div> )}
        {displayOCRResult()}
        </Modal>
        )}  
    </div>
  );
};

export default SkuleSparkBody;
