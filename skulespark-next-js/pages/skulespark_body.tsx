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
                    <div className="column">New Column 1</div>
                    <div className="column">New Column 2</div>
                </>
                )}
            <div className={`column column2 ${showAdditionalColumns ? 'small' : ''}`}>Column 2</div>
            <div className = "column column3">Column 3</div>
        </div>
    );
};

export default SkuleSparkBody