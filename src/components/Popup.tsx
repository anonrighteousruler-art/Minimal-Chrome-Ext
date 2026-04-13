import React, { useState } from 'react';
import { FileText, Database, Settings, ChevronRight, Wand2, ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
import { ai } from '../services/gemini';

export default function Popup() {
  const [view, setView] = useState<'menu' | 'optimizer' | 'result'>('menu');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resultTitle, setResultTitle] = useState('');
  const [resultContent, setResultContent] = useState('');

  const handleAction = async (actionType: 'summarize' | 'extract' | 'optimize', prompt: string, context: string = "Current browser page content") => {
    setIsProcessing(true);
    if (actionType !== 'optimize') {
      setView('result');
      setResultTitle(actionType === 'summarize' ? 'Page Summary' : 'Extracted Data');
      setResultContent('');
    }

    try {
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      // Using the structure from the backend reference
      const structuredPrompt = `Action: ${actionType}\nContext: ${context}\nPrompt: ${prompt}`;

      const result = await model.generateContent(structuredPrompt);
      const response = await result.response;
      const text = response.text();

      if (actionType === 'optimize') {
        setOptimizedPrompt(text);
      } else {
        setResultContent(text);
      }
    } catch (e) {
      console.error(e);
      const errorMsg = "Error processing request. Please try again.";
      if (actionType === 'optimize') setOptimizedPrompt(errorMsg);
      else setResultContent(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (view === 'optimizer') {
    return (
      <div className="w-[300px] h-[400px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 flex flex-col font-sans overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 bg-white flex items-center gap-3">
          <button onClick={() => setView('menu')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-[14px] font-medium text-gray-900">Prompt Optimizer</h2>
        </div>
        <div className="flex-1 p-4 bg-[#FCFCFC] flex flex-col gap-3 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Draft Prompt</label>
            <textarea
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              placeholder="Type your rough idea here..."
              className="w-full h-24 p-2.5 text-[13px] bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => handleAction('optimize', draftPrompt)}
            disabled={!draftPrompt.trim() || isProcessing}
            className="w-full py-2 bg-purple-500 text-white rounded-lg text-[13px] font-medium hover:bg-purple-600 disabled:opacity-50 disabled:hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {isProcessing ? 'Optimizing...' : 'Optimize Prompt'}
          </button>

          {optimizedPrompt && (
            <div className="flex flex-col gap-1.5 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-purple-600 uppercase tracking-wider">Optimized Result</label>
                <button onClick={() => copyToClipboard(optimizedPrompt)} className="text-gray-400 hover:text-gray-700 transition-colors">
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="w-full p-3 text-[13px] bg-purple-50/50 border border-purple-100 rounded-lg text-gray-800 leading-relaxed">
                {optimizedPrompt}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'result') {
    return (
      <div className="w-[300px] h-[400px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 flex flex-col font-sans overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('menu')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-[14px] font-medium text-gray-900">{resultTitle}</h2>
          </div>
          {resultContent && (
            <button onClick={() => copyToClipboard(resultContent)} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          )}
        </div>
        <div className="flex-1 p-4 bg-[#FCFCFC] overflow-y-auto">
          {isProcessing ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <span className="text-[13px]">Gemini is thinking...</span>
            </div>
          ) : (
            <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-500">
              {resultContent}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] h-[400px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">AI</span>
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-gray-900 leading-tight">Copilot</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Ready to assist</p>
          </div>
        </div>
      </div>

      {/* Actions List */}
      <div className="flex-1 p-2 bg-[#FCFCFC] overflow-y-auto">
        <div className="space-y-1">
          <button 
            onClick={() => setView('optimizer')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:border-gray-100 border border-transparent transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center text-purple-500 group-hover:bg-purple-100 transition-colors">
                <Wand2 size={14} />
              </div>
              <div>
                <span className="block text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Prompt Optimizer</span>
                <span className="block text-[11px] text-gray-400 mt-0.5">Enhance your AI prompts</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
          </button>

          <button 
            onClick={() => handleAction('summarize', 'Please provide a concise summary of the key points on this page.')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:border-gray-100 border border-transparent transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                <FileText size={14} />
              </div>
              <div>
                <span className="block text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Summarize Page</span>
                <span className="block text-[11px] text-gray-400 mt-0.5">Get key points instantly</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
          </button>

          <button 
            onClick={() => handleAction('extract', 'Identify and list all structured data, tables, or key entities found on this page.')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white hover:shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:border-gray-100 border border-transparent transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                <Database size={14} />
              </div>
              <div>
                <span className="block text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Extract Data</span>
                <span className="block text-[11px] text-gray-400 mt-0.5">Find tables and lists</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* Footer / Settings */}
      <div className="p-2 border-t border-gray-50 bg-white">
        <button className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left group">
          <Settings size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="text-[13px] font-medium text-gray-600 group-hover:text-gray-800 transition-colors">Settings</span>
        </button>
      </div>
    </div>
  );
}
