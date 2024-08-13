import React, { useState } from "react";
import ChatSocket from "./ChatSocket";
import ChatHTTP from "./ChatHTTP";
import ChatSSE from "./ChatSSE";
import "./App.css";

const App = () => {
    // const backendUrl = "http://localhost:5000";
    const backendUrl = "https://flask-rest.azurewebsites.net";

    const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkZWJ0b3JJZCI6IkVESVpaWlpaWloiLCJlbWFpbCI6ImJlbi5zYXVsQGRvd25lcmdyb3VwLmNvbSIsImV4dGVybmFsUmVmZXJlbmNlIjo2NTY2OCwiZmlyc3ROYW1lIjoiWXVndWFuZyIsImxhc3ROYW1lIjoiRGFuZyIsIm5hbWUiOiJZdWd1YW5nIERhbmciLCJyb2xlTmFtZSI6InRyYXZlbGxlciIsInN1YiI6InRlc3QifQ.4ujBBKDLnnFxxCpJsrwd4OOSnFDqgkajOdV4BAKFxy8";

    const [currentChat, setCurrentChat] = useState("ChatHTTP");

    const handleCleartSession = async () => {
        try {
            const response = await fetch(`${backendUrl}/delete_session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Session cleared successfully");
                window.location.reload();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Error clearing session:", error);
            alert("Internal Server Error");
        }
    };

    return (
        <div className="app-container">
            <div className="button-container">
                <button
                    className={`chat-button ${
                        currentChat === "ChatHTTP" ? "active" : ""
                    }`}
                    onClick={() => setCurrentChat("ChatHTTP")}
                >
                    ChatHTTP
                </button>
                <button
                    className={`chat-button ${
                        currentChat === "ChatSSE" ? "active" : ""
                    }`}
                    onClick={() => setCurrentChat("ChatSSE")}
                >
                    ChatSSE
                </button>
                <button
                    className={`chat-button ${
                        currentChat === "ChatSocket" ? "active" : ""
                    }`}
                    onClick={() => setCurrentChat("ChatSocket")}
                >
                    ChatSocket
                </button>
                <button
                    className="clear-session-button"
                    onClick={handleCleartSession}
                >
                    Clear session
                </button>
            </div>
            <div className="chat-components">
                {currentChat === "ChatHTTP" && (
                    <ChatHTTP token={token} backendUrl={backendUrl} />
                )}
                {currentChat === "ChatSSE" && (
                    <ChatSSE token={token} backendUrl={backendUrl} />
                )}
                {currentChat === "ChatSocket" && (
                    <ChatSocket token={token} />
                )}
            </div>
        </div>
    );
};

export default App;
