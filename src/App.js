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
    // State for storing and displaying chat messages
    const [displayedMessage, setDisplayedMessage] = useState([]);
    // State to manage if the app is listening for speech input
    const [isListening, setIsListening] = useState(false);
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
        socket.emit("chat message", message);
        setDisplayedMessage((prev) => [
            ...prev,
            { text: message, sender: "user" },
        ]);
        setMessage("");

        // Stop and restart speech recognition to clear the transcript
        if (isListening) {
            speechRecognition.current.stop();
        }
    };

    // Scroll to bottom whenever displayedMessage updates
    useEffect(() => {
        scrollToBottom();
    }, [displayedMessage]);

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
            setDisplayedMessage((prev) => {
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

    // Listen for the chat_with_consultant event and open a new tab with the provided URL
    useEffect(() => {
        socket.on("chat_with_consultant", (data) => {
            // Open consultant chat in a new tab with the provided URL
            console.log(data);
            const chatUrl = data.get_url;
            window.open(chatUrl, "_blank");
        });

        // Cleanup event listener on component unmount
        return () => {
            socket.off("chat_with_consultant");
        };
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

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {displayedMessage.map((msg, index) => (
                    <p
                        key={index}
                        className={
                            msg.sender === "user"
                                ? "user-message"
                                : "bot-message"
                        }
                    >
                        {msg.text}
                    </p>
                ))}
                <div ref={messagesEndRef} />
            </div>
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
