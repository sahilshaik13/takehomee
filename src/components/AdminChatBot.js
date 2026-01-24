import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Send, Bot, Clock, Plus, 
  Sparkles, Loader2 
} from 'lucide-react';

const AdminChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  
  const messagesEndRef = useRef(null);
  const HOT_QUESTIONS = [
    "📉 What items are low on stock?",
    "💰 What is the revenue today?",
    "🎫 Are there any active coupons?",
    "📊 Summarize total orders"
  ];

  // --- HELPER: FORMAT TIME ---
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- 1. EFFECTS ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isHistoryOpen) fetchHistory();
  }, [isHistoryOpen]);

  // --- 2. API ACTIONS ---
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/history`);
      const data = await res.json();
      setHistoryList(data);
    } catch (err) {
      console.error("Failed to load history");
    }
  };

  const loadSession = async (id) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/${id}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setSessionId(data.session_id);
      setIsHistoryOpen(false);
    } catch (err) {
      console.error("Failed to load session");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setIsHistoryOpen(false);
  };

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || inputValue;
    if (!msg.trim() || isLoading) return;

    // Add user message with current time
    const userMsg = { 
      sender: 'user', 
      text: msg, 
      timestamp: new Date().toISOString() 
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sessionId, 
          message: msg 
        }),
      });
      const data = await res.json();
      
      if (!sessionId) setSessionId(data.session_id);

      const botMsg = { 
        sender: 'bot', 
        text: data.response, 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (err) {
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: "⚠️ Connection Error. Please try again.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-zinc-200 z-50 flex flex-col overflow-hidden h-[600px]"
          >
            {/* --- HEADER --- */}
            <div className="bg-zinc-900 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-brand-blue/20 p-1.5 rounded-lg">
                  <Bot className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">home.ai</h3>
                  <p className="text-zinc-400 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> 
                    {sessionId ? "Connected" : "Ready"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <button 
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="History"
                >
                  <Clock className="w-4 h-4" />
                </button>
                <button 
                  onClick={startNewChat}
                  className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="New Chat"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 overflow-hidden relative flex">
              
              {/* HISTORY SIDEBAR */}
              <AnimatePresence>
                {isHistoryOpen && (
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-y-0 left-0 w-64 bg-zinc-100 z-20 border-r border-zinc-200 shadow-xl overflow-y-auto"
                  >
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Chat History</h4>
                      <div className="space-y-2">
                        {historyList.length === 0 && <p className="text-xs text-zinc-400 italic">No history yet.</p>}
                        {historyList.map(session => (
                          <button
                            key={session.session_id}
                            onClick={() => loadSession(session.session_id)}
                            className="w-full text-left p-3 bg-white rounded-lg border border-zinc-200 hover:border-brand-blue hover:shadow-sm transition-all group"
                          >
                            <p className="text-sm font-medium text-zinc-800 truncate group-hover:text-brand-blue">
                              {session.title}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-1">
                              {new Date(session.date).toLocaleDateString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MESSAGES LIST */}
              <div className="flex-1 bg-zinc-50 p-4 overflow-y-auto space-y-4 w-full">
                {messages.length === 0 && !isLoading && (
                  <div className="mt-8 text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-zinc-100">
                      <Sparkles className="w-6 h-6 text-brand-blue" />
                    </div>
                    <p className="text-sm text-zinc-600 font-medium mb-6">
                      What would you like to know about your store?
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {HOT_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(q)}
                          className="text-xs text-zinc-600 bg-white border border-zinc-200 py-2.5 px-4 rounded-xl hover:border-brand-blue hover:text-brand-blue hover:shadow-sm transition-all text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'user' 
                          ? 'bg-brand-blue text-white rounded-tr-sm' 
                          : 'bg-white border border-zinc-200 text-zinc-700 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {/* TIMESTAMP DISPLAY */}
                    <span className="text-[10px] text-zinc-400 mt-1 px-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-white border border-zinc-200 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
                      <span className="text-xs text-zinc-400 font-medium">Thinking...</span>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* --- INPUT --- */}
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-white border-t border-zinc-100 flex gap-2 shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-zinc-100 text-zinc-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-zinc-400"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-zinc-900 hover:bg-brand-blue text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-zinc-900 hover:bg-brand-blue text-white w-14 h-14 rounded-full shadow-lg shadow-brand-blue/20 flex items-center justify-center z-50 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
};

export default AdminChatBot;