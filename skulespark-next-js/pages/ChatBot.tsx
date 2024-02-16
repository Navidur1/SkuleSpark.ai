import React, { useState, useEffect } from 'react';
import MarkdownRenderer from '../pages/MarkdownRenderer';
const Chatbot = ({ fileId }) => {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState([]);
    // Define a state to track the collapse/expand status for each message
    const [isSourcesCollapsed, setIsSourcesCollapsed] = useState({});

    const handleUserInput = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/chat-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ file_id: fileId, message: userInput }),
            });

            if (response.ok) {
                const reader = response.body.getReader();

                // TODO: Add an empty message to the messages array
                // Messages is an array where each message is a ["text", "references"] array
                setMessages(prevMessages => [...prevMessages, ["", [""]]]);

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
        setMessages(prevMessages => [...prevMessages, [userInput, [""]]]);
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
    return (
        <div>
            <input
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Type your question"
                style={{marginBottom: '10px'}}
            />
            <button onClick={handleUserSubmit}>Submit</button>

            {/* Your chatbot UI using messages state */}
            {messages.map((message, index) => (
                <div key={index} style={{
                    float: index % 2 === 0 ? 'right' : 'left',
                    clear: 'both',
                    margin: '10px 0', // Adjust the value (10px) as needed for top and bottom margin
                    borderBottom: index % 2 === 0 ? 'none' : '2px solid',
                }}>
                    <p style={{width: index%2 === 0 ? 'auto' : '80%'}}> <MarkdownRenderer content={message[0]} /></p>
                    {index % 2 !== 0 && (
                        <button style = {{marginBottom: "15px"}} onClick={() => handleToggleSources(index)}>
                            {isSourcesCollapsed[index] ? 'Expand Sources' : 'Collapse Sources'}

                        </button>
                    )}
                    {!isSourcesCollapsed[index] && index % 2 !== 0 && (
                        <>
                            <h3>Sources: </h3>
                            {message[1].map((source, sourceIndex) => (
                                <div key={sourceIndex}>
                                    <p>{source}</p>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            ))}

        </div>
    );
};

export default Chatbot;
