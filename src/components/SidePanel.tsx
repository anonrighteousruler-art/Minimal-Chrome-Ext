import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, MoreHorizontal, Mic, MicOff, Loader2, Headphones, Square } from 'lucide-react';
import { ai } from '../services/gemini';
import { useLiveAudio } from '../hooks/useLiveAudio';

type Message = { id: number; text: string; sender: 'user' | 'bot'; isStreaming?: boolean };

export default function SidePanel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! I am connected to Gemini. You can type, dictate, or start a live voice chat!', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Dictation state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, isConnecting, connect, disconnect } = useLiveAudio();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Dictation Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          try {
            setIsTranscribing(true);
            const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: [
                {
                  parts: [
                    { text: "Transcribe the following audio accurately. Only return the transcription, nothing else." },
                    { inlineData: { mimeType: "audio/webm", data: base64data } }
                  ]
                }
              ]
            });
            setInput(prev => prev + (prev ? ' ' : '') + (response.text || '').trim());
          } catch (e) {
            console.error("Transcription error:", e);
          } finally {
            setIsTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing mic for dictation:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  // -----------------------

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);
    setIsTyping(true);

    try {
      if (!chatRef.current) {
        chatRef.current = ai.chats.create({ model: 'gemini-3-flash-preview' });
      }

      const responseStream = await chatRef.current.sendMessageStream({ message: userText });
      
      const botMsgId = Date.now() + 1;
      setMessages(prev => [...prev, { id: botMsgId, text: '', sender: 'bot', isStreaming: true }]);

      let fullText = '';
      for await (const chunk of responseStream) {
        fullText += chunk.text;
        setMessages(prev => prev.map(msg => 
          msg.id === botMsgId ? { ...msg, text: fullText } : msg
        ));
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, isStreaming: false } : msg
      ));
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now(), text: "Sorry, I encountered an error connecting to Gemini.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleAudio = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-sm bg-white border-r border-gray-100 shadow-[2px_0_8px_rgba(0,0,0,0.02)] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
            <Bot size={14} className="text-blue-500" />
          </div>
          <h1 className="text-[13px] font-medium text-gray-800">Assistant</h1>
          {isConnected && (
            <span className="flex h-2 w-2 relative ml-1" title="Live Audio Connected">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </div>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAFA]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-2xl text-[13px] bg-white border border-gray-100 text-gray-700 rounded-bl-sm shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100/80">
        {isConnected ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <div className="text-[13px] text-emerald-600 font-medium animate-pulse">
              Live Audio Active. Speak now...
            </div>
            <button
              onClick={toggleAudio}
              className="p-4 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors shadow-sm"
              title="End Voice Chat"
            >
              <MicOff size={20} />
            </button>
          </div>
        ) : (
          <div className="relative flex items-center gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing || isConnecting}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                isRecording ? 'bg-red-50 text-red-500 animate-pulse' :
                isTranscribing ? 'bg-gray-100 text-gray-400' :
                'bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
              }`}
              title={isRecording ? "Stop Recording" : "Dictate (Speech to Text)"}
            >
              {isTranscribing ? <Loader2 size={18} className="animate-spin" /> :
               isRecording ? <Square size={14} className="fill-current" /> :
               <Mic size={18} />}
            </button>

            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? "Recording..." : isTranscribing ? "Transcribing..." : "Ask anything..."}
                disabled={isRecording || isTranscribing}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200/60 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-400 disabled:opacity-70"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isRecording || isTranscribing}
                className="absolute right-1.5 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors flex items-center justify-center"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </div>

            <button
              onClick={toggleAudio}
              disabled={isRecording || isTranscribing}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                isConnecting ? 'bg-gray-100 text-gray-400' :
                'bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
              title="Live Voice Chat"
            >
              {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Headphones size={18} />}
            </button>
          </div>
        )}
        <div className="text-center mt-2">
          <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Gemini 2.5 Flash</span>
        </div>
      </div>
    </div>
  );
}
