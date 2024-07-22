import React from "react";
import ChatREST from "./ChatREST";
import "./App.css";

const App = () => {
    return (
        <div className="app-container">
            <div className="chat-components">
                <ChatREST/>
            </div>
        </div>
    );
};

export default App;
