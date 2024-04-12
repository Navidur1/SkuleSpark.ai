import React, { useState, useEffect } from 'react';
import MarkdownRenderer from '../pages/MarkdownRenderer';
import { port } from '../pages/globalVars';

const Chatbot = ({ fileId, courseCode, updateHighlight, updatePDFLink, PDFLink, note}) => {

    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState([]);
    // Define a state to track the collapse/expand status for each message
    const [isSourcesCollapsed, setIsSourcesCollapsed] = useState({});
    const [chatType, setChatType] = useState('Current Note'); // State to store the selected chat type

    const handleRadioChange = (event) => {
      setChatType(event.target.value); // Update the state with the selected value
    };


    const handleUserInput = async () => {
        try {               
            // Extracting the last four messages and their sources
            // const history = messages.slice(-4, -1).map(([msg, sources]) => ({
              
            //     message: msg,
            //     sources: sources.map(source => source.text)
            // }));
            const history = messages.slice(-4).map(([msg]) => msg);
            //console.log("HISTORY", messages)
            //const history = messages.length >= 5 ? messages.slice(-4).map(([msg]) => msg) : messages.slice(0).map(([msg]) => msg);
            const response = await fetch(`http://127.0.0.1:${port}/chat-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ file_id: fileId, message: userInput, whole_course: chatType === 'Whole Course' ? true : false, course_code:  courseCode.course, history: history}),
            });
 

            if (response.ok) {
                const reader = response.body.getReader();

                // TODO: Add an empty message to the messages array
                // Messages is an array where each message is a ["text", "references"] array
                setMessages(prevMessages => [...prevMessages, ["", [{}]]]);

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    const decoder = new TextDecoder('utf-8');
                    const val = decoder.decode(value);
                    const jsonData = JSON.parse(val);

                    if (jsonData["type"] === "answer") {
                        // TODO: Update the last message's text field by appending jsonData["data"] to messages array
                        setMessages(prevMessages => [
                            ...prevMessages.slice(0, -1),
                            [prevMessages[prevMessages.length - 1][0]+jsonData["data"], prevMessages[prevMessages.length - 1][1]]
                        ]);
                    }

                    if (jsonData["type"] === "reference") {
                        // TODO: Update last message's 'reference' field by setting it to jsonData["reference"] in messages array
                        console.log(messages[messages.length-1], jsonData["data"])
                        setMessages(prevMessages => [
                            ...prevMessages.slice(0, -1),
                            [prevMessages[prevMessages.length - 1][0], jsonData["data"]]
                        ]);
                        console.log(messages[messages.length-1])
                    }

                    console.log(jsonData);
                }
            }
        } catch (error) {
            console.error('Error fetching stream:', error);
        }
        console.log(messages)
    };

    const handleInputChange = (event) => {
        setUserInput(event.target.value);
    };

    const handleUserSubmit = () => {
        // Do something with the user input if needed
        console.log('User Input:', userInput);
        setMessages(prevMessages => [...prevMessages, [userInput, [{}]]]);
        // Fetch data based on user input
        handleUserInput();
    };

    // Function to toggle the collapse/expand status for a specific message
    const handleToggleSources = (index) => {
        setIsSourcesCollapsed((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const linkToSource = (source) => {
        if (source["gcsLink"]!== PDFLink){
            //add gcs link to chat.py getrelevant sources
            updatePDFLink(source["gcsLink"]);
        }
        
        updateHighlight(source["elements"]);
    }
    // This effect will trigger whenever the documentUrl changes
    useEffect(() => {
        // Update key to force re-render of Document component when documentUrl changes
        setMessages([]);
        setUserInput("");
    }, [note]);
    return (
        <div style={{marginBottom: '20px'}}>
            <h2>Chat:</h2>
            <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Type your question"
                style={{marginBottom: '10px'}}
            />
            <button onClick={handleUserSubmit}>Submit</button>
            <div>
                <input
                    type="radio"
                    id="current-note"
                    name="chat-type"
                    value="Current Note"
                    checked={chatType === 'Current Note'} // Check if this radio button is selected
                    onChange={handleRadioChange}
                />
                <label htmlFor="Current Note">Current Note</label>

                <input
                    type="radio"
                    id="whole-course"
                    name="chat-type"
                    value="Whole Course"
                    checked={chatType === 'Whole Course'} // Check if this radio button is selected
                    onChange={handleRadioChange}
                />
                <label htmlFor="Whole Course">Whole Course</label>

                {/* <p>Selected Chat Type: {chatType}</p> Display the selected value */}
            </div>
            <div style={{maxHeight:"500px", overflowY:"auto"}}>
            {/* Your chatbot UI using messages state */}
            {messages.map((message, index) => {
                let prevFilename = null; // Variable to store the previous filenam
                return(
                
                <div style={{display: "flex", justifyContent: index % 2 === 0 ? 'right' : 'left'}}>
                    <div key={index} style={{
                        margin: '10px 0', // Adjust the value (10px) as needed for top and bottom margin
                        borderBottom: index % 2 === 0 ? 'none' : '2px solid'
                    }}>
                        <p style={{width: '80%', backgroundColor: index % 2 === 0 ? 'lightgreen' : 'lightblue', borderRadius: '10%', padding: '5px'}}> <MarkdownRenderer content={message[0]} /></p>
                        {index % 2 !== 0 && (
                            <button style = {{marginBottom: "15px"}} onClick={() => handleToggleSources(index)}>
                                {isSourcesCollapsed[index] ?  'Collapse Sources' : 'Expand Sources'}

                            </button>
                        )}
                        {isSourcesCollapsed[index] && index % 2 !== 0 && (
                            <>
                            <h3>Sources: </h3>
                            {message[1].map((source, sourceIndex) => {
                                // Check if the current filename is different from the previous one
                                const showFilename = sourceIndex === 0 || source["filename"] !== prevFilename;
                                prevFilename = source["filename"]; // Update prevFilename
                                
                                return (
                                    <>
                                    {showFilename && <h4>{"From: "+source["filename"]}</h4>}
                                    <div key={sourceIndex} className='sources'>
                                        {/* Conditionally render <h4> */}
                                        
                                        <p onClick={() => linkToSource(source)}>{source["text"]}</p>
                                    </div>
                                    </>
                                );
                            })}
                        </>
                        
                        )}
                    </div>
                </div>
            )})}
            </div>

        </div>
    );
};

export default Chatbot;
