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

function ChatRESTSSE() {
    const [message, setMessage] = useState("");
    const [scoutMessages, setScoutMessages] = useState([]);
    const [consultantMessages, setConsultantMessages] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [activeTab, setActiveTab] = useState("Scout");
    const [chatUrl, setChatUrl] = useState("");
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
            if (activeTab === "Consultant") {
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
            } else if (activeTab === "Scout") {
                setScoutMessages((prev) => [
                    ...prev,
                    { text: message, sender: "user" },
                ]);

                await axios.post(`${backend_url}/chat_sse`, {
                    platform: "web",
                    token,
                    message,
                });

                eventSourceRef.current = new EventSource(
                    `${backend_url}/chat_sse_stream?token=${token}&platform=web`
                );

                eventSourceRef.current.addEventListener("message", (event) => {
                    const decodedData = decodeURIComponent(event.data);

                    if (activeTab === "Scout") {
                        setScoutMessages((prev) => {
                            const lastMsg =
                                prev.length > 0 ? prev[prev.length - 1] : null;
                            if (lastMsg && lastMsg.sender === "bot") {
                                return [
                                    ...prev.slice(0, -1),
                                    {
                                        ...lastMsg,
                                        text: lastMsg.text + decodedData,
                                    },
                                ];
                            }
                            return [
                                ...prev,
                                { text: decodedData, sender: "bot" },
                            ];
                        });
                    } else {
                        setConsultantMessages((prev) => {
                            const lastMsg =
                                prev.length > 0 ? prev[prev.length - 1] : null;
                            if (lastMsg && lastMsg.sender === "bot") {
                                return [
                                    ...prev.slice(0, -1),
                                    {
                                        ...lastMsg,
                                        text: lastMsg.text + decodedData,
                                    },
                                ];
                            }
                            return [
                                ...prev,
                                { text: decodedData, sender: "bot" },
                            ];
                        });
                    }
                });

                eventSourceRef.current.addEventListener(
                    "tool_outputs",
                    (event) => {
                        const toolOutputs = JSON.parse(event.data);
                        console.log("Tool outputs:", toolOutputs);
                        if (toolOutputs[0].output.includes("get_url")) {
                            const data = JSON.parse(toolOutputs[0].output);
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
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                })
                                    .then((response) => response.text()) // Handle string response
                                    .then((ackData) => {
                                        console.log(
                                            "Connection acknowledged:",
                                            ackData
                                        );

                                        // Set chat URL for Consultant tab and switch to Consultant tab
                                        setChatUrl(data.post_url);
                                        setActiveTab("Consultant");

                                        // Send the default waiting message to the Consultant tab
                                        setConsultantMessages((prev) => [
                                            ...prev,
                                            {
                                                text: "One of our consultants will talk to you soon, please wait...",
                                                sender: "bot",
                                            },
                                        ]);
                                    })
                                    .catch((error) =>
                                        console.error(
                                            "Error acknowledging connection:",
                                            error
                                        )
                                    );
                            };

                            eventSource.addEventListener(
                                "new_message",
                                async (event) => {
                                    console.log(
                                        "Received message:",
                                        event.data
                                    );
                                    const message = JSON.parse(event.data);

                                    if (message.message === "/END") {
                                        // End the chat session and switch back to Scout tab
                                        setActiveTab("Scout");
                                        setChatUrl("");
                                    } else {
                                        setConsultantMessages((prev) => [
                                            ...prev,
                                            {
                                                text: message.message,
                                                sender: "bot",
                                            },
                                        ]);
                                    }
                                }
                            );

                            eventSource.onerror = (error) => {
                                console.error(
                                    "Error establishing SSE connection:",
                                    error
                                );
                            };
                        }
                    }
                );

                eventSourceRef.current.addEventListener("end_of_stream", () => {
                    console.log("Stream ended");
                    eventSourceRef.current.close();
                });

                eventSourceRef.current.onerror = (err) => {
                    console.error("EventSource failed:", err);
                    eventSourceRef.current.close();
                };
            }

            if (isListening) {
                speechRecognition.current.stop();
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [scoutMessages, consultantMessages]);

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
                const response = await axios.post(`${backend_url}/init`, {
                    platform: "web",
                    token,
                    message: "init",
                });
                setScoutMessages((prev) => [
                    ...prev,
                    { text: response.data.reply, sender: "bot" },
                ]);
            } catch (error) {
                console.error("Error initializing chat:", error);
            }
        };
        initializeChat();
    }, []);

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
            <h2>ChatREST-SSE</h2>
            <div className="chat-tabs-container">
                <div className="chat-tabs">
                    <button
                        onClick={() => setActiveTab("Scout")}
                        className={activeTab === "Scout" ? "active" : ""}
                    >
                        AI Assistant
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
            <div className="chat-messages">
                {renderMessages()}
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

export default ChatRESTSSE;
