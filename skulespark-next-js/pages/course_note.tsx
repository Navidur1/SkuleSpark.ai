// CourseNotes.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {Course} from './course_list'

export interface Note {
  _id: string;
  title: string;
}

interface CourseNotesProps {
  selectedCourse: Course | null;
}

const CourseNotes: React.FC<CourseNotesProps> = ({ selectedCourse }) => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Fetch the notes for the selected course from the server
    if (selectedCourse) {
      axios.get<{ notes: Note[] }>(`http://localhost:5000/get_notes`)
        .then(response => setNotes(response.data.notes))
        .catch(error => console.error('Error fetching notes:', error));
    }
  }, [selectedCourse]);

  return (
    <div>
      <h2>Course Notes</h2>
      {selectedCourse ? (
        <ul>
          {notes.map(note => (
            <li key={note._id}>{note.title}</li>
          ))}
        </ul>
      ) : (
        <p>Select a course to view notes.</p>
      )}
    </div>
  );
};

export default CourseNotes;
