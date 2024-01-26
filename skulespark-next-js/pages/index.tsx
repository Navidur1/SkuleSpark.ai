import React, { useState, useRef, useEffect } from 'react';
import SkuleSparkHeader from './skulespark_header';
import SkuleSparkBody from './skulespark_body';

const App = () => {

  const [fileStructure, setFileStructure] = useState([]);

  const createCourse = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Set the content type to JSON
        },
        body: JSON.stringify({course_code: "ECE334"}), /*TODO: Change this to dynamic*/
      });
      if (response.ok) {
        // Request was successful
        const data = await response.json();
      }
    } catch (error) {
      console.error('Error during OCR:', error);
    }
  };

  useEffect(() => {
    const fetchFileStructure = async () => {
      try {
        //TODO: change this to actual user id in the future
        const response = await fetch('http://127.0.0.1:5000/file_structure/69420', {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          // Update the file structure state
          setFileStructure(data);
        } else {
          console.error('Failed to fetch file structure');
        }
      } catch (error) {
        console.error('Error fetching file structure:', error);
      }
    };

    fetchFileStructure();
  }, []);

  return (
    <div>
      <SkuleSparkHeader/>
      <SkuleSparkBody fileStructure={fileStructure}/>
    </div>
  );
};

export default App;
