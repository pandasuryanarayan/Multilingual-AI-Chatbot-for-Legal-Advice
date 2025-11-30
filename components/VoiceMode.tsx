import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2, XCircle, Activity } from 'lucide-react';
import { float32To16BitPCM, decodeBase64, decodeAudioData } from '../utils/audio';
import { Language } from '../types';
import { SYSTEM_INSTRUCTION_TEXT } from '../constants';

// Fix for Safari Web Audio API support
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface VoiceModeProps {
  apiKey: string;
  selectedLanguage: Language;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ apiKey, selectedLanguage }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
  const [volumeLevel, setVolumeLevel] = useState(0);
  
  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Playback Refs
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Animation frame for visualizer
  const requestRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    // Stop all playing audio
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    setIsActive(false);
    setStatus('idle');
    setVolumeLevel(0);
  };

  const startSession = async () => {
    try {
      setStatus('connecting');
      setIsActive(true);

      const ai = new GoogleGenAI({ apiKey });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Connect to Gemini Live
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Session Opened");
            setStatus('listening');
            
            // Setup Audio Processing Pipeline
            const ctx = inputAudioContextRef.current!;
            sourceRef.current = ctx.createMediaStreamSource(stream);
            analyserRef.current = ctx.createAnalyser();
            processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
            
            // Connect for Visualization
            sourceRef.current.connect(analyserRef.current);
            // Connect for Processing
            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(ctx.destination);

            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = float32To16BitPCM(inputData);
              
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: pcmData });
              });
            };
            
            startVisualizer();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('speaking');
              const ctx = outputAudioContextRef.current!;
              
              // Sync time
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decodeBase64(base64Audio),
                ctx,
                24000
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) {
                    setStatus('listening');
                }
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onclose: () => {
            console.log("Session Closed");
            cleanup();
          },
          onerror: (err) => {
            console.error("Session Error", err);
            setStatus('error');
            setTimeout(cleanup, 2000); // cleanup after showing error for a bit
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION_TEXT + `\n\nSpeak in ${selectedLanguage}. Keep answers concise and spoken-friendly.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });
      
    } catch (error) {
      console.error("Failed to start session:", error);
      setStatus('error');
      cleanup();
    }
  };

  const startVisualizer = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const animate = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setVolumeLevel(average);
      
      requestRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Cleanup on unmount

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-lg relative overflow-hidden">
        {/* Background Ambient Effect */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${status === 'speaking' ? 'opacity-30' : 'opacity-10'}`}>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        <div className="z-10 text-center space-y-8">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Voice Mode</h2>
                <p className="text-slate-400">Speak naturally in {selectedLanguage}</p>
            </div>

            {/* Visualizer Circle */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                {/* Rings */}
                {status === 'listening' && (
                    <>
                    <div className="absolute inset-0 rounded-full border border-orange-500/30 animate-[ping_2s_linear_infinite]"></div>
                    <div className="absolute inset-4 rounded-full border border-orange-500/50 animate-[ping_2s_linear_infinite_0.5s]"></div>
                    </>
                )}
                
                {/* Main Button Area */}
                <div 
                    className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                        status === 'error' ? 'bg-red-500' :
                        status === 'speaking' ? 'bg-orange-500 scale-110' :
                        status === 'listening' ? 'bg-slate-800 border-2 border-orange-500' :
                        'bg-slate-800 hover:bg-slate-700'
                    }`}
                    style={{
                        transform: status === 'speaking' ? `scale(${1 + (volumeLevel / 255) * 0.5})` : 'scale(1)'
                    }}
                >
                    {status === 'idle' && <Mic size={48} className="text-white" />}
                    {status === 'connecting' && <Activity size={48} className="text-orange-400 animate-spin" />}
                    {status === 'listening' && <Mic size={48} className="text-orange-500" />}
                    {status === 'speaking' && <Volume2 size={48} className="text-white" />}
                    {status === 'error' && <XCircle size={48} className="text-white" />}
                </div>
            </div>

            <div className="h-8">
                <p className="text-sm font-medium tracking-wide uppercase text-orange-400">
                    {status === 'idle' && "Tap Start to begin"}
                    {status === 'connecting' && "Connecting..."}
                    {status === 'listening' && "Listening..."}
                    {status === 'speaking' && "Speaking..."}
                    {status === 'error' && "Connection Error"}
                </p>
            </div>

            {/* Controls */}
            <div className="flex gap-4 justify-center">
                {!isActive ? (
                    <button 
                        onClick={startSession}
                        className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold shadow-lg transition-transform active:scale-95"
                    >
                        Start Conversation
                    </button>
                ) : (
                    <button 
                        onClick={cleanup}
                        className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-semibold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                    >
                        <MicOff size={18} /> End Call
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default VoiceMode;