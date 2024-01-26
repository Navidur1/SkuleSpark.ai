import React, { useState, useRef, useEffect } from 'react';
import SkuleSparkHeader from './skulespark_header';
import SkuleSparkBody from './skulespark_body';

const App = () => {

  const [fileStructure, setFileStructure] = useState([]);

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
