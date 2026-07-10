import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import axios from '../axiosConfig';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Hello! I am your AI ERP Assistant. I can help you with insights on revenue, active clients, employees, and more. How can I assist you today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chatbot', { message: userMessage.text });
      if (res.data.success) {
        setChatHistory((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
      }
    } catch (err) {
      setChatHistory((prev) => [...prev, { sender: 'bot', text: 'I am having trouble connecting to my database right now. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Convert markdown bold to JSX
  const formatText = (text) => {
    const parts = text.split(/\\*\\*(.*?)\\*\\*/g);
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all z-[9999] flex items-center justify-center animate-bounce group"
          title="Open AI Assistant"
        >
          <MessageSquare size={24} />
          <span className="absolute right-full mr-3 whitespace-nowrap bg-white text-slate-800 text-xs px-3 py-1.5 rounded-lg shadow-md font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Chat with ERP Data
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[9999] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold">ERP AI Assistant</h3>
                <p className="text-xs text-indigo-100">Online & connected to Database</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${msg.sender === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-indigo-100 text-indigo-600'}`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm leading-relaxed'
                }`}>
                  {msg.sender === 'user' ? msg.text : formatText(msg.text)}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm bg-indigo-100 text-indigo-600">
                  <Bot size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                  <span className="text-xs text-slate-500 font-medium">Analyzing ERP Data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSend} className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about revenue, clients..."
                disabled={loading}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              />
              <button 
                type="submit"
                disabled={!message.trim() || loading}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[10px] text-slate-400">Powered by ERP Data Engine</span>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
