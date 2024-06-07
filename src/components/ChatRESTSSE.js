import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import "./chat.css";

// JWT token for demo
const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZWJ0b3JJZCI6IkVESVpaWlpaWloiLCJlbWFpbCI6ImJlbi5zYXVsQGRvd25lcmdyb3VwLmNvbSIsImV4dGVybmFsUmVmZXJlbmNlIjo2NTY2OCwiZmlyc3ROYW1lIjoiWXVndWFuZyIsImxhc3ROYW1lIjoiRGFuZyIsIm5hbWUiOiJZdWd1YW5nIERhbmciLCJyb2xlTmFtZSI6InRyYXZlbGxlciIsInN1YiI6InRlc3QifQ.4ujBBKDLnnFxxCpJsrwd4OOSnFDqgkajOdV4BAKFxy8";
// Backend URL
const backend_url = "http://localhost:8000";

function ChatREST() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const speechRecognition = useRef(null);
    const eventSourceRef = useRef(null);

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

            await axios.post(`${backend_url}/chat_sse`, {
                platform: "web",
                token,
                message,
            });

            eventSourceRef.current = new EventSource(
                `${backend_url}/chat_sse_stream?token=${token}&platform=web`
            );
            eventSourceRef.current.onmessage = (event) => {
                if (event.data === "end of stream") {
                    eventSourceRef.current.close();
                } else {
                    const decodedData = decodeURIComponent(event.data);

                    setMessages((prev) => {
                        const lastMsg =
                            prev.length > 0 ? prev[prev.length - 1] : null;
                        if (lastMsg && lastMsg.sender === "bot") {
                            return [
                                ...prev.slice(0, -1),
                                { ...lastMsg, text: lastMsg.text + decodedData },
                            ];
                        }
                        return [...prev, { text: decodedData, sender: "bot" }];
                    });
                }
            };

            eventSourceRef.current.onerror = (err) => {
                console.error("EventSource failed:", err);
                eventSourceRef.current.close();
            };

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

    // // Initial render useEffect
    // useEffect(() => {
    //     const initializeChat = async () => {
    //         try {
    //             const response = await axios.post(`${backend_url}/init`, {
    //                 platform: "web",
    //                 token,
    //                 message: "init",
    //             });
    //             setMessages((prev) => [
    //                 ...prev,
    //                 { text: response.data.reply, sender: "bot" },
    //             ]);
    //         } catch (error) {
    //             console.error("Error initializing chat:", error);
    //         }
    //     };
    //     initializeChat();
    // }, []);

    return (
        <div className="chat-container">
            <h2>ChatREST</h2>
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <pre
                        key={index}
                        className={
                            msg.sender === "user"
                                ? "user-message"
                                : "bot-message"
                        }
                    >
                        {msg.text}
                    </pre>
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

export default ChatREST;
