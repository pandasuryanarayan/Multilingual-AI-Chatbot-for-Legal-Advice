import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Chat } from '@google/genai';
import { Send, User, Bot, Loader2, AlertCircle } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { SYSTEM_INSTRUCTION_TEXT } from '../constants';

interface TextModeProps {
  apiKey: string;
  selectedLanguage: Language;
}

const TextMode: React.FC<TextModeProps> = ({ apiKey, selectedLanguage }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Namaste! I am NyayaSetu. I can help you understand Indian laws, legal procedures, and your rights in ${selectedLanguage}. How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset chat when language changes
  useEffect(() => {
    chatSessionRef.current = null;
    setMessages([{
        id: 'welcome-' + Date.now(),
        role: 'model',
        text: `Namaste! I am NyayaSetu. I can help you understand Indian laws, legal procedures, and your rights in ${selectedLanguage}. How can I assist you today?`,
        timestamp: new Date()
    }]);
  }, [selectedLanguage]);

  const getChatSession = () => {
    if (!chatSessionRef.current) {
      const ai = new GoogleGenAI({ apiKey });
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_TEXT + `\n\nCurrent Language Context: ${selectedLanguage}`,
        },
      });
    }
    return chatSessionRef.current;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const chat = getChatSession();
      const result = await chat.sendMessageStream({ message: input });
      
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      let fullText = '';
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        fullText += text;
        
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId ? { ...msg, text: fullText } : msg
        ));
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I apologize, but I encountered an error connecting to the service. Please try again.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-orange-500 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 rounded-tl-none'
            } ${msg.isError ? 'bg-red-50 text-red-600 border border-red-200' : ''}`}>
              {msg.isError && <AlertCircle size={16} className="inline mr-2 -mt-1" />}
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex gap-2 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a legal question in ${selectedLanguage}...`}
            className="flex-1 resize-none rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 min-h-[50px] max-h-[120px] p-3 pr-12 text-sm shadow-sm"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:hover:bg-orange-600 transition-colors"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          NyayaSetu can make mistakes. Please consult a qualified lawyer for serious legal matters.
        </p>
      </div>
    </div>
  );
};

export default TextMode;