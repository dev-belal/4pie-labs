import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, User, Bot } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

const GREETING_MESSAGE: Message = {
    id: 'greeting',
    text: "Hi there! 👋 I'm the 4Pie Labs AI assistant. How can I help you scale your operations today?",
    sender: 'bot',
    timestamp: new Date()
};

const SUGGESTIONS = [
    "How does AI automation work?",
    "Book a discovery call",
    "View our services",
    "Pricing enquiry"
];

export const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate bot response
        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: getBotResponse(text),
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const getBotResponse = (input: string): string => {
        const text = input.toLowerCase();
        if (text.includes('booking') || text.includes('call') || text.includes('book')) {
            return "You can book a call directly with our team here: [Book a Discovery Call](https://calendly.com/4pielabs).";
        }
        if (text.includes('service') || text.includes('do you do')) {
            return "We specialize in AI Operating Systems, Autonomous Agents, and Digital Marketing Automation. Would you like to see our full list of services?";
        }
        if (text.includes('pricing') || text.includes('cost')) {
            return "Our pricing is custom tailored to your business needs and automation complexity. I recommend booking a discovery call for a precise quote!";
        }
        return "That's a great question! One of our human experts can assist you better with that. Would you like me to ping them or provide our booking link?";
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                        className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] flex flex-col glass-morphism rounded-[32px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-primary/20 to-transparent border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">4Pie AI Assistant</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-full text-white/40 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.sender === 'user' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'
                                            }`}>
                                            {msg.sender === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-white/50" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                            ? 'bg-primary text-white rounded-tr-none shadow-[0_10px_20px_rgba(168,85,247,0.2)]'
                                            : 'bg-white/5 text-white/80 rounded-tl-none border border-white/5'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 max-w-[85%]">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                            <Bot className="w-4 h-4 text-white/50" />
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 rounded-tl-none flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 border-t border-white/5 space-y-4">
                            {/* Suggestions */}
                            {messages.length === 1 && (
                                <div className="flex flex-wrap gap-2">
                                    {SUGGESTIONS.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => handleSendMessage(suggestion)}
                                            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60 hover:border-primary/50 hover:text-primary transition-all"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
                                className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-all px-4"
                            >
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent py-4 text-sm text-white focus:outline-none placeholder:text-white/20"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="p-2 text-primary hover:scale-110 disabled:grayscale disabled:opacity-30 disabled:hover:scale-100 transition-all"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                            <p className="text-[10px] text-center text-white/20 uppercase tracking-widest font-bold">
                                Powered by 4Pie AI
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-white/10 text-white' : 'bg-primary text-white shadow-[0_10px_30px_rgba(168,85,247,0.4)]'
                    }`}
            >
                <div className="absolute inset-0 rounded-full bg-primary/20 group-hover:blur-xl transition-all pointer-events-none" />
                {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}

                {/* Notification Badge */}
                {!isOpen && messages.length === 1 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#050505] rounded-full animate-bounce" />
                )}
            </motion.button>
        </div>
    );
};
