import React, { useState, useRef, useEffect, useCallback } from "react";
import { useProfile } from "@/context/ProfileContext";
import { getSmartAssistantReply } from "@/lib/carbonLogic";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { PREDEFINED_ACTIONS } from "@/lib/metrics";

type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
};

const CHAT_STORAGE_KEY = "carbon_chat_history";

export default function SmartAssistant() {
  const { profile, actions, logAction } = useProfile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<string>("");
  const [toasts, setToasts] = useState<string[]>([]);

  // Load chat history from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") {
      return [{ id: "msg-init", sender: "bot", text: "Hi! I'm your Smart Carbon Assistant. I've analyzed your profile. How can I help you reduce your footprint today?" }];
    }
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Corrupted — ignore
    }
    return [{ id: "msg-init", sender: "bot", text: "Hi! I'm your Smart Carbon Assistant. I've analyzed your profile. How can I help you reduce your footprint today?" }];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist chat to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      // Storage full — ignore
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  const showToast = useCallback((message: string) => {
    setToasts(prev => [...prev, message]);
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 3000);
  }, []);

  const handleSend = useCallback(async (retryMessage?: string) => {
    const msgToSend = retryMessage || input.trim();
    if (!msgToSend || isTyping) return;

    if (!retryMessage) {
      setMessages(prev => [...prev, { id: `msg-user-${Date.now()}`, sender: "user", text: msgToSend }]);
      setInput("");
    }
    lastUserMsgRef.current = msgToSend;
    setIsTyping(true);
    setError(null);

    try {
      const chatHistory = messages.map(m => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgToSend,
          profile,
          actions,
          history: chatHistory
        })
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      const botMsgId = `msg-bot-${Date.now()}`;
      setMessages(prev => [...prev, { id: botMsgId, sender: "bot", text: "" }]);
      let botText = "";
      let streamBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        streamBuffer += chunk;
        
        if (streamBuffer.includes("--END_TOOL_CALL--")) {
          const parts = streamBuffer.split("--END_TOOL_CALL--");
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i].trim();
            if (part.includes('"type":"tool_call"')) {
               try {
                 // Find JSON object boundaries properly
                 const jsonStart = part.indexOf('{');
                 const jsonEnd = part.lastIndexOf('}');
                 if (jsonStart !== -1 && jsonEnd !== -1) {
                   const toolData = JSON.parse(part.substring(jsonStart, jsonEnd + 1));
                   if (toolData.actionId) {
                     const action = PREDEFINED_ACTIONS.find(a => a.id === toolData.actionId);
                     if (action) {
                       logAction({ name: action.name, category: action.category, co2Saved: action.co2Saved });
                       showToast(`✓ Logged: ${action.name} (-${action.co2Saved}kg CO₂)`);
                     }
                   }
                   
                   // Extract any text that came with the tool call
                   const textBefore = part.substring(0, jsonStart).trim();
                   const textAfter = part.substring(jsonEnd + 1).trim();
                   if (textBefore) botText += textBefore + "\n\n";
                   if (textAfter) botText += textAfter + "\n\n";
                 }
               } catch (e) {
                 console.error("Failed to parse tool call", e);
               }
            } else if (part) {
               botText += part;
            }
          }
          streamBuffer = parts[parts.length - 1];
        } 
        
        if (!streamBuffer.includes('"type":"tool_call"')) {
           botText += streamBuffer;
           streamBuffer = "";
        }

        setMessages(prev => {
          const newMsg = [...prev];
          const lastMsg = newMsg[newMsg.length - 1];
          if (lastMsg.id === botMsgId) {
            newMsg[newMsg.length - 1] = { ...lastMsg, text: botText };
          }
          return newMsg;
        });
      }
    } catch {
      // Fallback to local rule engine when API is unavailable
      const fallbackReply = getSmartAssistantReply(msgToSend, profile, actions);
      setMessages(prev => [...prev, { id: `msg-fallback-${Date.now()}`, sender: "bot", text: fallbackReply }]);
      setError("Using offline mode — AI assistant is currently unavailable.");
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, profile, actions, logAction, showToast]);

  const handleRetry = useCallback(() => {
    if (lastUserMsgRef.current) {
      handleSend(lastUserMsgRef.current);
    }
  }, [handleSend]);

  return (
    <div className="glass-panel chat-container">
      <h3 className="chat-header">Smart Assistant</h3>
      
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.sender === "user" ? "chat-user" : "chat-bot markdown-content"}`}
            aria-label={msg.sender === "user" ? "You said" : "Assistant said"}
          >
            {msg.sender === "bot" ? (
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{msg.text}</ReactMarkdown>
            ) : (
              msg.text
            )}
          </div>
        ))}
        {isTyping && (
          <div className="chat-typing-indicator" aria-live="assertive">
            Thinking...
          </div>
        )}
        {error && (
          <div className="chat-error" role="alert" id="chat-error">
            {error}
            <button className="chat-retry-btn" onClick={handleRetry} aria-label="Retry last message">
              Retry
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <input 
          type="text" 
          className="input-field" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me for tips..." 
          aria-label="Chat input"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "chat-error" : undefined}
        />
        <button className="btn-primary chat-send-btn" onClick={() => handleSend()} disabled={isTyping} aria-label="Send message">
          <Send size={18} />
        </button>
      </div>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite">
          {toasts.map((toast, i) => (
            <div key={i} className="toast">{toast}</div>
          ))}
        </div>
      )}
    </div>
  );
}
