import { useEffect, useState } from "react";

function App() {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");

    const API_URL = "http://0.0.0.0:3001"; // Replace with your Mac IP

    useEffect(() => {
        fetch(`${API_URL}/api/messages`)
            .then((res) => res.json())
            .then(setMessages);
    }, []);

    const sendMessage = async () => {
        await fetch(`${API_URL}/api/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        setText("");
        const res = await fetch(`${API_URL}/api/messages`);
        const data = await res.json();
        setMessages(data);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-xl mx-auto bg-white p-4 rounded-xl shadow-md">
                <h1 className="text-2xl font-bold mb-4">Simple Message Board</h1>
                <ul className="space-y-2 mb-4">
                    {messages.map((msg) => (
                        <li key={msg.id} className="bg-gray-200 p-2 rounded">
                            {msg.text}
                        </li>
                    ))}
                </ul>
                <div className="flex space-x-2">
                    <input
                        className="flex-1 border border-gray-300 rounded px-2 py-1"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button
                        onClick={sendMessage}
                        className="bg-blue-500 text-white px-4 py-1 rounded"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
