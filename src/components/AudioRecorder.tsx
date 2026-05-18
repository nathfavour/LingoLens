import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Button, 
  CircularProgress,
  useTheme
} from '@mui/material';
import { Mic, Square, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  isLoading: boolean;
  loadingStatus?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, isLoading, loadingStatus }) => {
  const theme = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; 
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        setIsFinalizing(true);
        setTimeout(() => {
          const finalMimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: finalMimeType });
          setRecordedBlob(blob);
          
          const extension = finalMimeType.includes('mp4') ? 'm4a' : 
                            finalMimeType.includes('ogg') ? 'ogg' : 'webm';
          const file = new File([blob], `recording-${Date.now()}.${extension}`, { type: finalMimeType });
          
          onRecordingComplete(file);
          setIsFinalizing(false);
        }, 800);
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
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
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
    };
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: 700, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          borderRadius: 8,
          p: 6,
          textAlign: 'center',
          bgcolor: isRecording ? 'rgba(239, 68, 68, 0.05)' : '#161412',
          border: '2px solid',
          borderColor: isRecording ? 'error.main' : '#1C1A18',
          transition: 'all 0.3s ease',
          minHeight: 320,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <AnimatePresence mode="wait">
          {!isRecording && !isFinalizing && !isLoading && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <IconButton
                  onClick={startRecording}
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    color: '#0A0908',
                    '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
                    boxShadow: '0 0 20px rgba(255,179,0,0.3)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Mic size={40} />
                </IconButton>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Live Capture</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>High-fidelity recording for linguistic deconstruction</Typography>
                </Box>
              </Box>
            </motion.div>
          )}

          {isRecording && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: '50%', 
                    border: '4px solid', 
                    borderColor: 'error.main', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: 0.2,
                    position: 'absolute'
                  }} />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(239,68,68,0.5)', position: 'absolute' }}
                  />
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontWeight: 800, 
                      color: 'error.main',
                      zIndex: 1
                    }}
                  >
                    {formatTime(recordingTime)}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                   <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: -1, color: 'error.main', mb: 1 }}>Recording Active</Typography>
                   <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>Speak naturally. Engine is processing markers in real-time.</Typography>
                   <Button
                    variant="contained"
                    onClick={stopRecording}
                    startIcon={<Square size={18} />}
                    sx={{
                      bgcolor: 'white',
                      color: 'black',
                      px: 6,
                      py: 1.5,
                      fontWeight: 800,
                      '&:hover': { bgcolor: '#e0e0e0' }
                    }}
                  >
                    Stop & Analyze
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}

          {(isFinalizing || isLoading) && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <CircularProgress size={60} thickness={2} sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {isFinalizing ? "Finalizing audio..." : (loadingStatus || "Processing...")}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic' }}>
                    {isFinalizing ? "Wrapping up capture" : "AI is analyzing linguistic markers"}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>
    </Box>
  );
};
