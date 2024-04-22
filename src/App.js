import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import "./App.css";

// const socket = io.connect("http://localhost:5000");
// const socket = io.connect("https://flight-assitant-test.azurewebsites.net/");
const socket = io.connect("https://projectscoutagent89.au.ngrok.io/");

function App() {
    const [message, setMessage] = useState("");
    const [displayedMessage, setDisplayedMessage] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const speechRecognition = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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

        return () => {
            socket.off("chat message chunk");
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [displayedMessage]);

    useEffect(() => {
        // Emit an event when the page/component loads
        console.log("page loaded");
        socket.emit("page_loaded", {
            message: "Page has been refreshed or loaded",
        });
    }, []);

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
        return () => {
            speechRecognition.current.stop();
        };
    }, [isListening]);

    useEffect(() => {
        console.log(`isListening: ${isListening}`);
        if (isListening) {
            speechRecognition.current.start();
        } else {
            speechRecognition.current.stop();
        }
    }, [isListening]);

    const toggleListen = () => {
        setIsListening(!isListening);
    };

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
