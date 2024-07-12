import React from "react";
import ChatRESTSSE from "./ChatRESTSSE";
import "./App.css";

const App = () => {
    return (
        <div className="app-container">
            <div className="chat-components">
                <ChatRESTSSE/>
            </div>
        </div>
    );
};

export default App;
