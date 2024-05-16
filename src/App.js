import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import "./App.css";

// Establish a WebSocket connection to the backend
const socket = io.connect("http://localhost:5000");
// const socket = io.connect("scout-flask-backend.azurewebsites.net");
// const socket = io.connect("https://projectscoutagent89.au.ngrok.io/");

function App() {
    // State for the current message input by the user
    const [message, setMessage] = useState("");
    // State for storing and displaying chat messages in Scout tab
    const [scoutMessages, setScoutMessages] = useState([]);
    // State for storing and displaying chat messages in Consultant tab
    const [consultantMessages, setConsultantMessages] = useState([]);
    // State to manage if the app is listening for speech input
    const [isListening, setIsListening] = useState(false);
    // State to track the active tab (Scout or Consultant)
    const [activeTab, setActiveTab] = useState("Scout");
    // State to store the chat URL for the Consultant tab
    const [chatUrl, setChatUrl] = useState("");
    // Ref to keep track of the end of messages for scrolling
    const messagesEndRef = useRef(null);
    // Ref to keep track of the speech recognition instance
    const speechRecognition = useRef(null);

    // Function to scroll to the bottom of the chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Function to toggle the listening state
    const toggleListen = () => {
        setIsListening(!isListening);
    };

    // Function to handle sending chat messages
    const sendChat = (e) => {
        e.preventDefault();

        if (activeTab === "Scout") {
            // Send message to the WebSocket for Scout tab
            socket.emit("chat message", message);
            setScoutMessages((prev) => [
                ...prev,
                { text: message, sender: "user" },
            ]);
        } else if (activeTab === "Consultant") {
            // Send the message to the consultant chat server for Consultant tab
            fetch(chatUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: message }),
            })
                .then((response) => {
                    setConsultantMessages((prev) => [
                        ...prev,
                        { text: message, sender: "user" },
                    ]);
                })
                .catch((error) => console.error("Error:", error));
        }

        setMessage("");

        // Stop and restart speech recognition to clear the transcript
        if (isListening) {
            speechRecognition.current.stop();
        }
    };

    // Scroll to bottom whenever displayedMessage updates
    useEffect(() => {
        scrollToBottom();
    }, [scoutMessages, consultantMessages]);

    // Setup WebSocket connection and session metadata
    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to the server");
            // Send metadata after establishing the connection
            socket.emit("session_start", {
                debtorId: "EDIZZZZZZZ",
                email: "ben.saul@downergroup.com",
                externalReference: 65668,
                firstName: "Yuguang",
                lastName: "Dang",
                name: "Yuguang Dang",
                roleName: "traveller",
            });
        });

        // Cleanup on component unmount
        return () => {
            socket.off("connect");
            socket.close();
        };
    }, []);

    // Listen for incoming chat message chunks and update displayedMessage state
    useEffect(() => {
        socket.on("chat message chunk", ({ data }) => {
            setScoutMessages((prev) => {
                const lastMsg = prev.length > 0 ? prev[prev.length - 1] : null;
                if (lastMsg && lastMsg.sender === "bot") {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, text: lastMsg.text + data },
                    ];
                }
                return [...prev, { text: data, sender: "bot" }];
            });
        });

        // Cleanup event listener on component unmount
        return () => {
            socket.off("chat message chunk");
        };
    }, []);

    // Listen for the chat_with_consultant event and handle SSE connection and acknowledgment
    useEffect(() => {
        socket.on("chat_with_consultant", (data) => {
            console.log(data);
            // Establish SSE connection
            const eventSource = new EventSource(
                data.get_url + "/" + data.chatId
            );

            eventSource.onopen = () => {
                console.log("SSE connection established");

                // Acknowledge the connection
                fetch(data.acknowledge_url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                })
                    .then((response) => response.text()) // Handle string response
                    .then((ackData) => {
                        console.log("Connection acknowledged:", ackData);

                        // Set chat URL for Consultant tab and switch to Consultant tab
                        setChatUrl(data.post_url);
                        setActiveTab("Consultant");

                        // Send the default waiting message to the Consultant tab
                        setConsultantMessages((prev) => [
                            ...prev,
                            {
                                text: "One of our consultant will talk to you soon, please wait...",
                                sender: "bot",
                            },
                        ]);
                    })
                    .catch((error) =>
                        console.error("Error acknowledging connection:", error)
                    );
            };

            eventSource.addEventListener("new_message", async (event) => {
                console.log("Received message:", event.data);
                const message = JSON.parse(event.data);

                if (message.message === "/END") {
                    // End the chat session and switch back to Scout tab
                    setActiveTab("Scout");
                    setChatUrl("");
                } else {
                    setConsultantMessages((prev) => [
                        ...prev,
                        { text: message.message, sender: "bot" },
                    ]);
                }
            });

            eventSource.onerror = (error) => {
                console.error("Error establishing SSE connection:", error);
            };
            // Cleanup event listener on component unmount
            return () => {
                eventSource.close();
                socket.off("chat_with_consultant");
            };
        });
    }, []);

    // Setup speech recognition
    useEffect(() => {
        speechRecognition.current = new (window.SpeechRecognition ||
            window.webkitSpeechRecognition)();
        speechRecognition.current.continuous = true;
        speechRecognition.current.interimResults = true;
        speechRecognition.current.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map((result) => result[0])
                .map((result) => result.transcript)
                .join("");
            setMessage(transcript);
        };
        speechRecognition.current.onend = () => {
            if (isListening) {
                speechRecognition.current.start();
            }
        };
        // Cleanup speech recognition on component unmount
        return () => {
            speechRecognition.current.stop();
        };
    }, [isListening]);

    // Toggle speech recognition
    useEffect(() => {
        console.log(`isListening: ${isListening}`);
        if (isListening) {
            speechRecognition.current.start();
        } else {
            speechRecognition.current.stop();
        }
    }, [isListening]);

    // Render chat messages based on active tab
    const renderMessages = () => {
        const messages =
            activeTab === "Scout" ? scoutMessages : consultantMessages;
        return messages.map((msg, index) => (
            <p
                key={index}
                className={
                    msg.sender === "user" ? "user-message" : "bot-message"
                }
            >
                {msg.text}
            </p>
        ));
    };

    return (
        <div className="chat-container">
            {/* Tab buttons for switching between Scout and Consultant */}
            <div className="chat-tabs-container">
                <div className="chat-tabs">
                    <button
                        onClick={() => setActiveTab("Scout")}
                        className={activeTab === "Scout" ? "active" : ""}
                    >
                        Scout
                    </button>
                    {chatUrl && (
                        <button
                            onClick={() => setActiveTab("Consultant")}
                            className={
                                activeTab === "Consultant" ? "active" : ""
                            }
                        >
                            Consultant
                        </button>
                    )}
                </div>
            </div>
            {/* Chat messages for the active tab */}
            <div className="chat-messages">
                {renderMessages()}
                <div ref={messagesEndRef} />
            </div>
            {/* Chat input form */}
            <form onSubmit={sendChat} className="chat-form">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                        isListening ? "I am listening..." : "Type a message..."
                    }
                    className="chat-input"
                />
                <button
                    onClick={toggleListen}
                    type="button"
                    className={`mic-button ${isListening ? "listening" : ""}`}
                >
                    <FontAwesomeIcon icon={faMicrophone} />
                </button>
                <button type="submit" className="send-button">
                    Send
                </button>
            </form>
        </div>
    );
}

export default App;
