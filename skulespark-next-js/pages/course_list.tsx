import React, { useState, useEffect } from 'react';
import { Note } from './course_note';
import './style/courseList.css';
import { port } from '../pages/globalVars';

interface CourseListProps {
  onSelectCourse: (course: Course) => void;
}

export interface Course {
  course: string;
  notes: Note[];
}

export const fetchCourses = async (): Promise<Course[]> => {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/file_structure/69420`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }

    const data = await response.json();
    return data; // Assuming data is an array of courses directly
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

const CourseList: React.FC<CourseListProps> = ({ onSelectCourse, selectedCourse }) => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchCourses();
      setCourses(data);
    };

    fetchData();
  }, []);

  return (
    <div className="courseListWrapper">
      <h2>Course List</h2>
      <ul className="courseList">
        {courses.map((course) => (
          <li key={course.course}>
            <button
              onClick={() => onSelectCourse(course)}
              className={selectedCourse?.course === course.course ? 'selectedCourseButton' : 'courseButton'}
            >
              {course.course}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseList;
