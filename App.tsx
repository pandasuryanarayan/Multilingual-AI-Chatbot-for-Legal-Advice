import React, { useState } from 'react';
import { Scale, MessageSquare, Mic, AlertTriangle, BookOpen, Info } from 'lucide-react';
import TextMode from './components/TextMode';
import VoiceMode from './components/VoiceMode';
import { AppMode, Language, LegalTopic } from './types';
import { TOPICS, LANGUAGES } from './constants';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.TEXT);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  // Use environment variable strictly
  const apiKey = process.env.API_KEY || '';

  if (!apiKey) {
      return (
          <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-800 p-4">
              <div className="text-center max-w-md">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h1 className="text-xl font-bold mb-2">Configuration Error</h1>
                  <p>API Key not found. Please ensure <code>process.env.API_KEY</code> is set in your environment.</p>
              </div>
          </div>
      )
  }

  if (showDisclaimer) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-[fadeIn_0.3s_ease-out]">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Scale className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-4">Legal Disclaimer</h2>
          <div className="space-y-4 text-slate-600 text-sm leading-relaxed mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p><strong>NyayaSetu is an AI information tool, not a lawyer.</strong></p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Information provided is for educational purposes only.</li>
              <li>It does not constitute legal advice or client-attorney privilege.</li>
              <li>Laws vary by jurisdiction and situation.</li>
              <li>Always consult a qualified advocate or your local District Legal Services Authority (DLSA) for actual legal action.</li>
            </ul>
          </div>
          <button
            onClick={() => setShowDisclaimer(false)}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">NyayaSetu</h1>
            <p className="text-xs text-slate-500 font-medium">AI Legal Companion India</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="hidden sm:block text-sm border-slate-200 rounded-lg py-1.5 px-3 bg-slate-50 focus:ring-orange-500 focus:border-orange-500"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
          
          <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
            <button
              onClick={() => setMode(AppMode.TEXT)}
              className={`p-2 rounded-md transition-all ${mode === AppMode.TEXT ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Text Chat"
            >
              <MessageSquare size={20} />
            </button>
            <button
              onClick={() => setMode(AppMode.VOICE)}
              className={`p-2 rounded-md transition-all ${mode === AppMode.VOICE ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Voice Call"
            >
              <Mic size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col md:flex-row">
        
        {/* Sidebar / Topic Suggestions (Hidden on mobile when chat active, or visible as drawer) */}
        <div className={`w-full md:w-80 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto hidden md:block`}>
          <div className="mb-4">
             <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Common Topics</h3>
             <div className="space-y-2">
               {TOPICS.map((topic: LegalTopic) => (
                 <button
                   key={topic.id}
                   // Note: In a real app, clicking this would pre-fill the chat.
                   // For this demo, we just show them as static helper cards or you could wire them to context.
                   className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group"
                 >
                   <div className="flex items-start gap-3">
                     <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors">
                        {/* We render icons dynamically based on topic.icon string, simplistic mapping here */}
                        <TopicIcon name={topic.icon} />
                     </div>
                     <div>
                       <h4 className="font-medium text-slate-800 text-sm">{topic.title}</h4>
                       <p className="text-xs text-slate-500 mt-1 line-clamp-2">{topic.description}</p>
                     </div>
                   </div>
                 </button>
               ))}
             </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex gap-2 items-start mb-2">
              <Info size={16} className="text-blue-600 mt-0.5" />
              <h4 className="text-sm font-semibold text-blue-800">Did you know?</h4>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Article 39A of the Indian Constitution directs the State to ensure that the operation of the legal system promotes justice on a basis of equal opportunity.
            </p>
          </div>
        </div>

        {/* Active View */}
        <div className="flex-1 h-full p-0 md:p-6 bg-slate-100">
          <div className="h-full w-full max-w-4xl mx-auto">
            {mode === AppMode.TEXT ? (
              <TextMode apiKey={apiKey} selectedLanguage={language} />
            ) : (
              <VoiceMode apiKey={apiKey} selectedLanguage={language} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper component for dynamic icons
const TopicIcon = ({ name }: { name: string }) => {
  // Simple icon mapping or dynamic import
  // Using lucide-react names passed as strings
  // In a strict setup, we'd import specific icons.
  // For brevity in this file format, I'll return a generic icon if match fails, 
  // but since we are inside the file, I'll rely on the parent imports or just simple SVGs if needed.
  // Ideally, pass the component itself in the constant, but let's just map manually for safety.
  
  if (name === 'FileText') return <BookOpen size={18} />;
  return <Info size={18} />;
};

export default App;