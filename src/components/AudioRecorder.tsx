import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  isLoading: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, isLoading }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordedBlob(blob);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // We don't use window.alert as per guidelines
      console.error("Please allow microphone access to use this feature.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordedBlob(null);
    setRecordingTime(0);
  };

  const handleApply = () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      onRecordingComplete(file);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className={cn(
        "relative rounded-3xl p-12 text-center border-2 transition-all duration-300 min-h-[300px] flex flex-col justify-center",
        isRecording ? "border-red-500 bg-red-500/5 shadow-[0_0_30px_rgba(239,68,68,0.2)]" : "border-muted-foreground/20 bg-card/30",
        "backdrop-blur-sm shadow-xl"
      )}>
        <AnimatePresence mode="wait">
          {!audioUrl && !isRecording && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-6"
            >
              <button
                onClick={startRecording}
                disabled={isLoading}
                className="w-24 h-24 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] disabled:opacity-50 active:scale-95 group"
              >
                <Mic className="w-10 h-10 text-primary-foreground group-hover:scale-110 transition-transform" />
              </button>
              <div className="space-y-1">
                <h3 className="text-2xl font-semibold tracking-tight">Record Live Audio</h3>
                <p className="text-muted-foreground">Highest-quality capture for accurate detection</p>
              </div>
            </motion.div>
          )}

          {isRecording && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-red-500/20 flex items-center justify-center">
                   <motion.div 
                     animate={{ scale: [1, 1.2, 1] }} 
                     transition={{ repeat: Infinity, duration: 1.5 }}
                     className="w-24 h-24 rounded-full bg-red-500/10 absolute" 
                   />
                   <div className="text-3xl font-mono font-bold text-red-500 tabular-nums">
                    {formatTime(recordingTime)}
                  </div>
                </div>
              </div>
              <div className="space-y-6 w-full">
                <div className="space-y-1 text-center">
                   <h3 className="text-2xl font-semibold tracking-tight text-red-500">Recording in progress</h3>
                   <p className="text-muted-foreground">Speak clearly at your natural pace</p>
                </div>
                <button
                  onClick={stopRecording}
                  className="px-10 py-4 rounded-full bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors mx-auto shadow-2xl"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Finish Recording
                </button>
              </div>
            </motion.div>
          )}

          {audioUrl && !isRecording && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="w-full max-w-sm bg-white/5 p-4 rounded-2xl border border-white/10">
                <audio src={audioUrl} controls className="w-full h-10" />
              </div>
              
              <div className="space-y-8 w-full">
                <div className="space-y-2 text-center">
                  <h3 className="text-2xl font-semibold tracking-tight">Got it!</h3>
                  <p className="text-muted-foreground">You can preview the recording before sending</p>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={resetRecording}
                    disabled={isLoading}
                    className="px-8 py-3 rounded-full border border-muted hover:bg-white/10 transition-colors flex items-center gap-2 font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Discard
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={isLoading}
                    className="px-10 py-3 rounded-full bg-primary text-primary-foreground font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    Analyze my accent
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
