import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import "./chat.css";


function ChatHTTP({ token, backendUrl }) {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const speechRecognition = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const toggleListen = () => {
        setIsListening(!isListening);
    };

    const sendChat = async (e) => {
        e.preventDefault();
        try {
            setMessage("");
            setMessages((prev) => [...prev, { text: message, sender: "user" }]);
            const response = await axios.post(`${backendUrl}/chat`, {
                platform: "web",
                token,
                message,
            });
            setMessages((prev) => [
                ...prev,
                { text: response.data.reply, sender: "bot" },
            ]);

            if (isListening) {
                speechRecognition.current.stop();
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
        if (isListening) {
            speechRecognition.current.start();
        } else {
            speechRecognition.current.stop();
        }
    }, [isListening]);

    // Initial render useEffect
    useEffect(() => {
        const initializeChat = async () => {
            try {
                const response = await axios.post(`${backendUrl}/init`, {
                    platform: "web",
                    token,
                    message: "init",
                });
                setMessages((prev) => [
                    ...prev,
                    { text: response.data.reply, sender: "bot" },
                ]);
            } catch (error) {
                console.error("Error initializing chat:", error);
            }
        };
        initializeChat();
    }, [token, backendUrl]);

    return (
        <div className="chat-container">
            <h2>ChatHTTP</h2>
            <div className="chat-messages">
                {messages.map((msg, index) => (
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

export default ChatHTTP;
