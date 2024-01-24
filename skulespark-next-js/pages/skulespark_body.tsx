import React, { useState, useEffect } from 'react';
import './style/skulespark_body.css';
import Notebook from './icons/notebook.png';
import Image from 'next/image';
import CourseList from './course_list';
import CourseNotes from './course_note';
import { Course } from './course_list';
import { fetchCourses } from './course_list';

const SkuleSparkBody = () => {
  const [showAdditionalColumns, setShowAdditionalColumns] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCreateCoursePopup, setShowCreateCoursePopup] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseListKey, setCourseListKey] = useState(0); // Add key state

  const handleButtonClick = () => {
    setShowAdditionalColumns(!showAdditionalColumns);
    setSelectedCourse(null); // Reset selected course when toggling columns
  };

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleCreateCourse = () => {
    setShowCreateCoursePopup(true);
  };

  const handleCancelCreateCourse = () => {
    setShowCreateCoursePopup(false);
    setNewCourseName(''); // Reset the input field
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

        // Increment the key to force re-render of CourseList
        setCourseListKey((prevKey) => prevKey + 1);

        setShowCreateCoursePopup(false);
        setNewCourseName(''); // Reset the input field
      }
    } catch (error) {
      console.error('Error during course creation:', error);
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
            <CourseNotes selectedCourse={selectedCourse} />
          </div>
        </>
      )}
      <div className={`column column2 ${showAdditionalColumns ? 'small' : ''}`}>
        Augmented Note would get shown here
      </div>
      <div className="column column3">
        {selectedCourse
          ? `Selected Course: ${selectedCourse.course}`
          : 'No course selected. Select a course to view notes!'}
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
    </div>
  );
};

export default SkuleSparkBody;
