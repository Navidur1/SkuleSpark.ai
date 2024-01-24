import React, { useState, useEffect } from 'react';

interface CourseListProps {
  onSelectCourse: (courseId: string) => void;
  courses: Course[];
}

export interface Course {
  course: string;
  notes: any[];
}

export const fetchCourses = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5000/get_courses/69420', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }

    const data = await response.json();
    return data; // Assuming data is an array of courses directly
  } catch (error) {
    console.error('Error fetching courses:', error);
    return null;
  }
};

const CourseList: React.FC<CourseListProps> = ({ onSelectCourse, courses: initialCourses }) => {
  const [courses, setCourses] = useState<Course[]>(initialCourses);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchCourses();
      if (data) {
        setCourses(data);
      }
    };

    fetchData();
  }, []); // Empty dependency array to run the effect only once

  return (
    <div>
      <h2>Course List</h2>
      <ul>
        {courses.map(course => (
          <li key={course.course}>
            <button onClick={() => onSelectCourse(course.course)}>
              {course.course}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseList;
