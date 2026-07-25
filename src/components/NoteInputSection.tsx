import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Zap,
  Trash2,
  Calendar,
  User,
  Store,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Globe,
  Radio,
  Square,
  AlertCircle,
  Volume2
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { SAMPLE_PRESETS, SamplePreset } from '../data/sampleNotes';

interface NoteInputSectionProps {
  onAnalyze: (payload: {
    notes: string;
    currency: CurrencyCode;
    vendorName: string;
    businessType: string;
    date: string;
  }) => Promise<void>;
  isAnalyzing: boolean;
  selectedCurrency: CurrencyCode;
}

export const NoteInputSection: React.FC<NoteInputSectionProps> = ({
  onAnalyze,
  isAnalyzing,
  selectedCurrency,
}) => {
  const [notes, setNotes] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('Auntie Agnes');
  const [businessType, setBusinessType] = useState<string>('Market Vendor Stall');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Selected dictation language: 'twi' | 'hausa' | 'dagbani' | 'pidgin' | 'en'
  const [selectedLang, setSelectedLang] = useState<string>('twi');

  // Web Speech API browser dictation state
  const [isBrowserDictating, setIsBrowserDictating] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [dictationNotice, setDictationNotice] = useState<string | null>(null);
  const [isTranscribingAudio] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Audio Recording state (uses Web Speech API)
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const timerIntervalRef = useRef<any>(null);
  const audioRecognitionRef = useRef<any>(null);

  // Analysis Loading Steps
  const [analysisStep, setAnalysisStep] = useState<number>(0);

  // Initialize Web Speech API for Browser Dictation
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const instance = new SpeechRecognition();
      instance.continuous = true;
      instance.interimResults = false; // Set to false to avoid duplicate text

      instance.onresult = (event: any) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (newTranscript.trim()) {
          setNotes((prev) => (prev ? `${prev.trim()} ${newTranscript.trim()}` : newTranscript.trim()));
        }
      };

      instance.onerror = (event: any) => {
        setIsBrowserDictating(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setDictationNotice(
            "Live browser dictation is blocked by iframe/permission settings. Please use the 'Record Voice Note (Multilingual AI)' button for seamless Twi, Hausa, Dagbani, and English dictation!"
          );
        } else if (event.error === 'no-speech') {
          // Silent timeout, no disruptive alert
        } else {
          console.warn('Browser speech recognition notice:', event.error);
        }
      };

      instance.onend = () => {
        setIsBrowserDictating(false);
      };

      recognitionRef.current = instance;
    }
  }, []);

  // Update Web Speech language mapping when selectedLang changes
  useEffect(() => {
    if (recognitionRef.current) {
      let langCode = 'en-US';
      if (selectedLang === 'twi') langCode = 'ak-GH';
      else if (selectedLang === 'hausa') langCode = 'ha-NG';
      else if (selectedLang === 'pidgin') langCode = 'en-GH';
      else if (selectedLang === 'en') langCode = 'en-US';
      
      try {
        recognitionRef.current.lang = langCode;
      } catch (e) {
        // ignore
      }
    }
  }, [selectedLang]);

  // Animate parsing steps during analysis
  useEffect(() => {
    if (isAnalyzing) {
      setAnalysisStep(1);
      const t1 = setTimeout(() => setAnalysisStep(2), 1200);
      const t2 = setTimeout(() => setAnalysisStep(3), 2600);
      const t3 = setTimeout(() => setAnalysisStep(4), 4000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setAnalysisStep(0);
    }
  }, [isAnalyzing]);

  // Toggle Web Speech Browser Dictation
  const toggleBrowserDictation = () => {
    setDictationNotice(null);
    if (!speechSupported || !recognitionRef.current) return;
    if (isBrowserDictating) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsBrowserDictating(false);
    } else {
      try {
        if (isRecordingAudio) stopAudioRecording();
        recognitionRef.current.start();
        setIsBrowserDictating(true);
      } catch (err: any) {
        setIsBrowserDictating(false);
        setDictationNotice("Browser dictation unavailable in this frame. Use 'Record Voice Note (Multilingual AI)' below.");
      }
    }
  };

  // Start Multilingual Audio Recording via Web Speech API
  const startAudioRecording = () => {
    setDictationNotice(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDictationNotice('Voice recording is not supported in this browser. Please use Chrome or Edge, or type your notes directly.');
      return;
    }

    if (isBrowserDictating && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsBrowserDictating(false);
    }

    const recognition = new SpeechRecognition();
    audioRecognitionRef.current = recognition;

    let langCode = 'en-US';
    if (selectedLang === 'twi') langCode = 'ak-GH';
    else if (selectedLang === 'hausa') langCode = 'ha-NG';
    else if (selectedLang === 'pidgin') langCode = 'en-GH';
    recognition.lang = langCode;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + ' ';
        }
      }
      if (transcript.trim()) {
        setNotes((prev) => (prev ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
      }
    };

    recognition.onerror = (event: any) => {
      clearInterval(timerIntervalRef.current);
      setIsRecordingAudio(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setDictationNotice('Microphone access was blocked. Please allow microphone permissions in your browser and try again.');
      } else if (event.error !== 'no-speech') {
        setDictationNotice(`Voice recognition error: ${event.error}. Please try again.`);
      }
    };

    recognition.onend = () => {
      clearInterval(timerIntervalRef.current);
      setIsRecordingAudio(false);
    };

    try {
      recognition.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setDictationNotice('Could not start voice recording. Please try again.');
    }
  };

  // Stop Audio Recording
  const stopAudioRecording = () => {
    if (audioRecognitionRef.current && isRecordingAudio) {
      try { audioRecognitionRef.current.stop(); } catch (e) {}
      clearInterval(timerIntervalRef.current);
      setIsRecordingAudio(false);
    }
  };

  const handleLoadPreset = (preset: SamplePreset) => {
    setNotes(preset.notes);
    setVendorName(preset.vendorName);
    setBusinessType(preset.businessType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || isAnalyzing) return;
    onAnalyze({
      notes,
      currency: selectedCurrency,
      vendorName,
      businessType,
      date,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden p-6 mb-8 transition-all">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 mb-5 border-b border-stone-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
              <Zap className="w-5 h-5 text-amber-700" />
            </span>
            Enter Raw End-of-Day Vendor Notes
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Dictate in native <strong>Twi, Hausa, Dagbani, Ghanaian Pidgin, or English</strong>. Gemma 4 AI structures your notes into neat sales, inventory, and profit reports.
          </p>
        </div>

        {/* Profile Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700">
            <User className="w-3.5 h-3.5 text-stone-500" />
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Vendor Name"
              className="bg-transparent font-medium text-stone-800 focus:outline-none w-28"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700">
            <Store className="w-3.5 h-3.5 text-stone-500" />
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="Stall / Business Type"
              className="bg-transparent font-medium text-stone-800 focus:outline-none w-32"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-700">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent font-medium text-stone-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Dictation Notice Banner */}
      {dictationNotice && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>{dictationNotice}</span>
          </div>
          <button
            onClick={() => setDictationNotice(null)}
            className="text-amber-800 font-bold ml-2 hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Multilingual Voice Dictation Toolbar */}
      <div className="mb-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Language Selector */}
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-amber-800 shrink-0" />
          <span className="text-xs font-bold text-amber-950">Dictation Language:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-bold text-amber-900 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="twi">🇬🇭 Twi (Akan)</option>
            <option value="hausa">🇳🇬/🇬🇭 Hausa</option>
            <option value="dagbani">🇬🇭 Dagbani</option>
            <option value="pidgin">🇬🇭 Ghanaian Pidgin</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </div>

        {/* Dictation Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* AI Audio Recorder (Primary, works everywhere with microphone) */}
          {!isRecordingAudio ? (
            <button
              type="button"
              onClick={startAudioRecording}
              disabled={isTranscribingAudio || isAnalyzing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs cursor-pointer transition-all disabled:opacity-50"
            >
              <Mic className="w-4 h-4 text-white" />
              <span>Record Voice Note (Multilingual AI)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopAudioRecording}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md animate-pulse cursor-pointer transition-all"
            >
              <Square className="w-4 h-4 fill-white text-white" />
              <span>Stop Recording ({recordingSeconds}s) • Tap to Transcribe</span>
            </button>
          )}

          {/* Quick Web Speech Dictation (Secondary) */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleBrowserDictation}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isBrowserDictating
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-white border border-stone-200 text-stone-800 hover:bg-stone-50'
              }`}
            >
              {isBrowserDictating ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-amber-700" />}
              <span>{isBrowserDictating ? 'Listening...' : 'Browser Dictate'}</span>
            </button>
          )}

        </div>
      </div>

      {/* Audio Transcription Spinner Status */}
      {isTranscribingAudio && (
        <div className="mb-4 p-3 bg-amber-100/90 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 flex items-center space-x-2 animate-pulse">
          <Loader2 className="w-4 h-4 text-amber-800 animate-spin" />
          <span>
            Transcribing & translating your spoken <strong>{selectedLang.toUpperCase()}</strong> recording into clear English vendor notes...
          </span>
        </div>
      )}

      {/* Preset Notes Shortcut Pills */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
          Or load a sample market vendor scenario:
        </label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
              <span><strong>{preset.vendorName}</strong> ({preset.businessType})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isAnalyzing}
            rows={5}
            placeholder={`e.g. "Sold 10 bags of rice at 480 GHC each, customer complained tomatoes were too soft, made 5,120 GHC, paid 80 GHC for transport, need to restock 15 bags rice and oil..." (or dictate in Twi / Hausa / Dagbani above)`}
            className="w-full rounded-xl border border-stone-300 bg-stone-50/50 p-4 text-stone-900 placeholder-stone-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none text-base leading-relaxed transition-all resize-y"
          />

          {notes && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-stone-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setNotes('')}
                className="p-1 text-stone-400 hover:text-stone-600 rounded"
                title="Clear text"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Progress Indicator when analyzing */}
        {isAnalyzing && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />
                Gemma 4 is structuring your daily notes...
              </span>
              <span className="text-xs font-semibold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                Step {analysisStep} of 4
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${analysisStep >= 1 ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${analysisStep >= 1 ? 'text-amber-700' : 'text-stone-300'}`} />
                <span>1. Parsing Sales & Costs</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${analysisStep >= 2 ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${analysisStep >= 2 ? 'text-amber-700' : 'text-stone-300'}`} />
                <span>2. Inventory & Restock</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${analysisStep >= 3 ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${analysisStep >= 3 ? 'text-amber-700' : 'text-stone-300'}`} />
                <span>3. Customer Intelligence</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${analysisStep >= 4 ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-stone-100 text-stone-400 border-stone-200'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${analysisStep >= 4 ? 'text-amber-700' : 'text-stone-300'}`} />
                <span>4. Business Insights</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Action */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-stone-500">
            * Multilingual voice dictation powered by Gemma 4 local AI.
          </p>

          <button
            type="submit"
            disabled={!notes.trim() || isAnalyzing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Notes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Daily Ledger Report</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
