import React, { useState, useEffect } from 'react';

interface CourseNotesProps {
  selectedCourse: Course | null;
  onSelectNote: (note: Note) => void;
  fileStructure: Course[];
}

export interface Course {
  selectedCourse: Course | null;
  onSelectNote: (note: Note) => void;
  notes: Note[];
}

export interface Note {
  note_id: string;
  gcs_link: string;
  file_name: string;
  summary: string;
  links: string[];
  videos: string[];
}

const CourseNotes: React.FC<CourseNotesProps> = ({ selectedCourse, onSelectNote, fileStructure }) => {
  return (
    <div className="courseListWrapper">
      <h2>Notes for {selectedCourse ? selectedCourse.course : 'No course selected'}</h2>
      <ul className="courseList">
        {selectedCourse &&
          fileStructure
            .filter((course) => course.course === selectedCourse.course)
            .map((course) =>
              course.notes.map((note) => (
                <li key={note.note_id}>
                  <button onClick={() => onSelectNote(note)} className="courseButton">{note.file_name}</button>
                </li>
              ))
            )}
      </ul>
    </div>
  );
};

export default CourseNotes;
