import React, { useState } from "react";
import ChatSocket from "./ChatSocket";
import ChatHTTP from "./ChatHTTP";
import ChatSSE from "./ChatSSE";
import "./App.css";

const App = () => {
    const [currentChat, setCurrentChat] = useState("ChatSocket");

    return (
        <div className="app-container">
            <div className="button-container">
                <button
                    className={`chat-button ${
                        currentChat === "ChatSocket" ? "active" : ""
                    }`}
                    onClick={() => setCurrentChat("ChatSocket")}
                >
                    ChatSocket
                </button>
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
            </div>
            <div className="chat-components">
                {currentChat === "ChatSocket" && <ChatSocket />}
                {currentChat === "ChatHTTP" && <ChatHTTP />}
                {currentChat === "ChatSSE" && <ChatSSE />}
            </div>
        </div>
    );
};

export default App;
