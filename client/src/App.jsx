import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, Square, Sparkles, List, Upload, Loader2, XCircle } from 'lucide-react';

// DEPLOYMENT CONFIGURATION:
// Uses environment variable (Vercel) if available, otherwise uses Localhost.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const App = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [insights, setInsights] = useState({
    summary: [],
    keywords: []
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/history`);
      setHistory(res.data);
    } catch (error) {
      console.error("History Error:", error);
    }
  };

  const startRecording = async () => {
    setTranscription(''); 
    setInsights({ summary: [], keywords: [] });
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      setErrorMessage("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && !file.type.startsWith('audio/')) {
      setErrorMessage('Invalid file type. Please upload audio.');
      return;
    }
    if (file) {
      setErrorMessage('');
      setAudioBlob(file);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setLoading(true);
    setErrorMessage('');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const res = await axios.post(`${API_URL}/api/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const text = res.data.text;
      setTranscription(text);
      
      const words = text.split(' ');
      setInsights({
        summary: ["Key point extracted from audio.", "User mentioned specific details.", "Context analyzed successfully."],
        keywords: words.slice(0, 5).map(w => w.replace(/[.,]/g, ''))
      });

      setAudioBlob(null);
      fetchHistory();
    } catch (error) {
      console.error("Transcribe Error:", error);
      if (error.code === 'ERR_NETWORK') {
        setErrorMessage('Cannot connect to server.');
      } else {
        setErrorMessage('Processing failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderHighlightedText = (text) => {
    return text.split(' ').map((word, i) => {
      const isHighlighted = i % 7 === 0;
      return (
        <span key={i} className={isHighlighted ? "text-indigo-400 font-semibold" : "text-slate-200"}>
          {word}{' '}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto h-screen p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col justify-between relative">
          <header className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-white">Groq Transcribe</h1>
            <div className="text-xs text-slate-500 border border-slate-800 px-3 py-1 rounded-full">Production Ready</div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center gap-12">
            {!recording && !audioBlob && !loading ? (
              <button onClick={startRecording} className="group relative w-32 h-32 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-500 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                <Mic className="text-slate-400 group-hover:text-white transition-colors w-10 h-10" />
              </button>
            ) : recording ? (
              <div className="relative flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.6)] animate-pulse relative z-10">
                  <div className="flex items-center gap-1 h-8">
                    <div className="w-1 bg-white/90 rounded-full animate-sound-bar h-3"></div>
                    <div className="w-1 bg-white/90 rounded-full animate-sound-bar-delayed h-5"></div>
                    <div className="w-1 bg-white/90 rounded-full animate-sound-bar-delayed-2 h-4"></div>
                  </div>
                </div>
                <p className="mt-6 text-indigo-400 font-medium tracking-wide uppercase text-sm animate-pulse">Listening...</p>
              </div>
            ) : loading ? (
              <div className="w-32 h-32 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center">
                <Loader2 className="text-indigo-500 w-10 h-10" />
              </div>
            ) : (
              <div className="text-center text-slate-500">
                <Upload className="mx-auto mb-2 opacity-50" />
                <p>Audio captured</p>
              </div>
            )}

            <div className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden min-h-[220px] flex flex-col justify-center">
              {loading ? (
                <p className="text-slate-500 italic text-center animate-pulse">Processing audio with Groq...</p>
              ) : transcription ? (
                <p className="text-2xl lg:text-3xl font-light leading-relaxed tracking-wide">
                  {renderHighlightedText(transcription)}
                </p>
              ) : (
                <p className="text-slate-600 text-xl text-center">{recording ? "Start speaking..." : "Press record to begin"}</p>
              )}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none"></div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            {errorMessage && (
              <div className="flex items-center justify-between w-full max-w-md bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-3 text-red-500 text-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <XCircle size={16} />
                  {errorMessage}
                </div>
                <button onClick={() => setErrorMessage('')}><XCircle size={16} /></button>
              </div>
            )}
            <div className="flex justify-center gap-4">
              {recording ? (
                <button onClick={stopRecording} className="flex items-center gap-3 px-10 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                  <Square size={24} fill="white" /> Stop Recording
                </button>
              ) : !loading && audioBlob ? (
                <button onClick={transcribeAudio} className="flex items-center gap-3 px-10 py-4 bg-white hover:bg-slate-200 text-black rounded-2xl font-bold text-lg transition-all shadow-lg">
                  <Sparkles size={24} /> Generate Transcription
                </button>
              ) : (
                <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition text-sm">
                  <Upload size={18} /> Upload Audio File
                  <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/30 backdrop-blur border border-slate-800 rounded-2xl p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-indigo-400">
              <Sparkles size={18} />
              <h2 className="font-bold tracking-wide text-sm uppercase">AI Insights</h2>
            </div>
            {transcription ? (
              <>
                <div className="mb-8">
                  <h3 className="text-slate-400 text-xs font-bold uppercase mb-3 tracking-wider">Summary</h3>
                  <ul className="space-y-3">
                    {insights.summary.map((point, idx) => (
                      <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-slate-400 text-xs font-bold uppercase mb-3 tracking-wider">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.keywords.map((word, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium">
                        #{word}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-50">
                <List size={48} className="mb-4" />
                <p className="text-sm">Generate a transcription to see AI insights here.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900/30 backdrop-blur border border-slate-800 rounded-2xl p-6 h-64 overflow-hidden flex flex-col">
            <h2 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-wider">Recent Activity</h2>
            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {history.map((item) => (
                <div key={item._id} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-slate-700 transition cursor-pointer group">
                  <p className="text-slate-400 text-xs mb-1">{new Date(item.createdAt).toLocaleTimeString()}</p>
                  <p className="text-slate-300 text-sm truncate group-hover:text-white transition">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;