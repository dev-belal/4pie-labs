"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Send, User, X } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const GREETING_MESSAGE: Message = {
  id: "greeting",
  text: "Hi there! 👋 I'm Pie, your 4Pie Labs assistant. How can I help you scale your business today?",
  sender: "bot",
  timestamp: new Date(),
};

const SUGGESTIONS = [
  "How does AI automation work?",
  "Book a discovery call",
  "View our services",
];

const ASSISTANT_AVATAR =
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chatRef.current &&
        !chatRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error("Chat proxy failed");

      const data = await response.json();

      let botText = "";
      if (typeof data === "string") {
        botText = data;
      } else if (Array.isArray(data) && data[0]) {
        const item = data[0];
        botText =
          item.output ??
          item.text ??
          item.message ??
          item.response ??
          JSON.stringify(item);
      } else {
        botText =
          data.output ??
          data.text ??
          data.message ??
          data.response ??
          JSON.stringify(data);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text:
          botText ||
          "I'm sorry, I couldn't process that. Would you like to book a call instead?",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having a bit of trouble connecting right now. Please feel free to book a discovery call or try again in a moment!",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] font-sans"
      ref={chatRef}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
            className="absolute bottom-16 right-0 w-[90vw] md:w-[380px] h-[550px] max-h-[75vh] flex flex-col bg-[#0a0a0a] rounded-[24px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-5 bg-gradient-to-r from-primary/20 to-transparent border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden relative">
                  <Image
                    src={ASSISTANT_AVATAR}
                    alt="Pie Assistant"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Pie</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      Online
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close chat"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full text-white/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-6"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border overflow-hidden relative ${
                        msg.sender === "user"
                          ? "bg-primary/10 border-primary/20"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Image
                          src={ASSISTANT_AVATAR}
                          alt="Bot"
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-primary text-white rounded-tr-none shadow-[0_10px_20px_rgba(168,85,247,0.2)]"
                          : "bg-white/10 text-white/80 rounded-tl-none border border-white/5"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative">
                      <Image
                        src={ASSISTANT_AVATAR}
                        alt="Bot"
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
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

            <div className="p-5 border-t border-white/5 space-y-4">
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      type="button"
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
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-all px-4"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent py-3 text-sm text-white focus:outline-none placeholder:text-white/20"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!inputValue.trim()}
                  className="p-2 text-primary hover:scale-110 disabled:grayscale disabled:opacity-30 disabled:hover:scale-100 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex flex-col items-center pt-2">
                <p className="text-[9px] text-center text-white/20 uppercase tracking-[0.2em] font-bold">
                  Powered by 4Pie Labs
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-end gap-3">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              className="snake-border-container mb-2"
            >
              <div className="snake-border-content px-4 py-2 text-white text-xs font-medium shadow-2xl">
                Feels like need help?
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-label={isOpen ? "Close chat" : "Open chat"}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isOpen
              ? "bg-white/10 text-white"
              : "bg-primary text-white shadow-[0_10px_30px_rgba(168,85,247,0.4)]"
          }`}
        >
          <div className="absolute inset-0 rounded-full bg-primary/20 group-hover:blur-xl transition-all pointer-events-none" />
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}

          {!isOpen && messages.length === 1 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-[#050505] rounded-full" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
