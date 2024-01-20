import React, {useState} from 'react';
import './style/skulespark_body.css';
import Notebook from './icons/notebook.png';
import Image from "next/image"

const SkuleSparkBody = () => {
    const [showAdditionalColumns, setShowAdditionalColumns] = useState(false);

    const handleButtonClick = () => {
        setShowAdditionalColumns(!showAdditionalColumns);
    };

    return(
        <div className = "bodyWrapper">
            <div className = "column column1">
                <button className="sidebarButton" onClick={handleButtonClick}>
                    <Image src={Notebook} alt="" className = "sidebarButtonImage"/>
                </button>
            </div>
            {showAdditionalColumns && (
                <>
                    <div className="column courseColumn">Classes go here</div>
                    <div className="column noteColumn">Note name goes here</div>
                </>
                )}
            <div className={`column column2 ${showAdditionalColumns ? 'small' : ''}`}> Augmented Note would get shown here</div>
            <div className = "column column3">No note selected. Select a Note to access AI features!</div>
        </div>
    );
};

export default SkuleSparkBody