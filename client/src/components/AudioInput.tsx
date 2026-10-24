import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface Props {
  onTranscriptChange: (transcript: string) => void;
  value: string;
}

export const AudioInput: React.FC<Props> = ({ onTranscriptChange, value }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Default to Indian English / bilingual

      interface SpeechRecognitionEventLike {
        resultIndex: number;
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }
      interface SpeechRecognitionErrorEventLike {
        error: string;
      }

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        onTranscriptChange(currentTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setErrorMessage(`Speech recognition notice: ${event.error}. You can also type directly.`);
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setSupported(false);
    }
  }, [onTranscriptChange]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    setErrorMessage('');

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="voice-transcript" className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <span>Voice Recording Transcript</span>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
              Recording Audio Live...
            </span>
          )}
        </label>

        {supported ? (
          <button
            type="button"
            onClick={toggleRecording}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400'
                : 'bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-300'
            }`}
            aria-pressed={isRecording}
            aria-label={isRecording ? 'Stop voice recording' : 'Start voice recording with microphone'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-brand-600" />}
            <span>{isRecording ? 'Stop Mic' : 'Record Voice'}</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Microphone API not supported on this browser (Text Fallback Active)
          </span>
        )}
      </div>

      <textarea
        id="voice-transcript"
        rows={3}
        value={value}
        onChange={(e) => onTranscriptChange(e.target.value)}
        placeholder={
          supported
            ? "Click 'Record Voice' to speak your report in English/Hindi, or type voice notes manually here..."
            : "Type bystander voice message details manually here..."
        }
        className="w-full text-sm rounded-lg border border-slate-300 bg-white p-2.5 focus:border-brand-500 focus:ring-brand-500 text-slate-800 placeholder-slate-400 shadow-sm transition"
      />

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
