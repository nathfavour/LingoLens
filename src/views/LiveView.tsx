import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Button, 
  IconButton, 
  Avatar, 
  CircularProgress,
  Divider,
  LinearProgress,
  useTheme
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Mic, Square, Activity, Volume2, Sparkles, User as UserIcon, RefreshCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Persona {
  id: string;
  name: string;
  voice: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
  description: string;
  instruction: string;
}

const PERSONAS: Persona[] = [
  {
    id: 'steve',
    name: 'Standard Steve',
    voice: 'Zephyr',
    description: 'Neutral, standard General American. Clear and articulate.',
    instruction: "You are 'Standard Steve'. Speak in a perfectly neutral, clear General American accent. Your goal is to have a natural, engaging conversation about anything. Use the 'report_accent_score' tool frequently to rate the user's accent. Keep the conversation flowing naturally, span various topics to test the user's phonetic range."
  },
  {
    id: 'cassie',
    name: 'Casual Cassie',
    voice: 'Kore',
    description: 'Informal, West Coast vibe. Uses common American idioms.',
    instruction: "You are 'Casual Cassie'. Speak with a relaxed, informal West Coast American accent. Use slang and idioms naturally. Engage the user in casual banter. Use the 'report_accent_score' tool frequently to rate their accent. Mix up topics to cover regional nuances."
  },
  {
    id: 'paul',
    name: 'Professional Paul',
    voice: 'Charon',
    description: 'East Coast professional. Formal and structured speech.',
    instruction: "You are 'Professional Paul'. Speak with an articulate, professional East Coast/Mid-Atlantic American accent. Focus on formal conversation topics like business, technology, or science. Use the 'report_accent_score' tool frequently. Ensure the conversation uses complex vocabulary to test the user's precision."
  }
];

export const LiveView: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [activePersona, setActivePersona] = useState<Persona>(PERSONAS[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [liveNotes, setLiveNotes] = useState<string>('');
  const [transcription, setTranscription] = useState<string>('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopConversation = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioCtxRef.current) {
        audioCtxRef.current.close();
    }
    setIsConnected(false);
    setIsRecording(false);
  }, []);

  const startConversation = async () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);
      wsRef.current = ws;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'setup',
          persona: activePersona.voice,
          instruction: activePersona.instruction
        }));
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ready') {
          setIsConnected(true);
          startStreaming();
        } else if (msg.type === 'audio') {
          playAudio(msg.data);
        } else if (msg.type === 'score_update') {
          setLiveScore(msg.score);
          setLiveNotes(msg.notes || '');
        } else if (msg.type === 'text') {
          setTranscription(prev => (prev + ' ' + msg.data).slice(-200));
        } else if (msg.type === 'interrupted') {
           nextStartTimeRef.current = audioCtx.currentTime;
        }
      };

      ws.onclose = () => stopConversation();
    } catch (err) {
      console.error("Live start error:", err);
    }
  };

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = audioCtxRef.current!.createMediaStreamSource(stream);
      const processor = audioCtxRef.current!.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
        }
      };

      source.connect(processor);
      processor.connect(audioCtxRef.current!.destination);
      processorRef.current = processor;
      setIsRecording(true);
    } catch (err) {
      console.error("Streaming error:", err);
    }
  };

  const playAudio = (base64: string) => {
    if (!audioCtxRef.current) return;
    const binary = atob(base64);
    const bytes = new Int16Array(new Uint8Array([...binary].map(c => c.charCodeAt(0))).buffer);
    const float32 = new Float32Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) float32[i] = bytes[i] / 32768;

    const buffer = audioCtxRef.current.createBuffer(1, float32.length, 16000);
    buffer.getChannelData(0).set(float32);

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);

    const startTime = Math.max(audioCtxRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  };

  useEffect(() => {
    return () => stopConversation();
  }, [stopConversation]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, letterSpacing: -1 }}>
          Live <Box component="span" sx={{ fontStyle: 'italic', color: 'primary.main' }}>Immersion.</Box>
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto' }}>
          Engage in real-time dialogue with neural personas. AI evaluates phonetic markers mid-speech, providing live feedback on resonance and rhythm.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Personas Side */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
            <UserIcon size={14} />
            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>Select Persona</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {PERSONAS.map((p) => (
              <Paper
                key={p.id}
                component="button"
                elevation={0}
                onClick={() => !isConnected && setActivePersona(p)}
                disabled={isConnected}
                sx={{
                  textAlign: 'left',
                  p: 3,
                  borderRadius: 5,
                  bgcolor: activePersona.id === p.id ? 'primary.main' : '#161412',
                  border: '1px solid',
                  borderColor: activePersona.id === p.id ? 'primary.main' : '#1C1A18',
                  color: activePersona.id === p.id ? '#0A0908' : 'text.primary',
                  transition: 'all 0.2s ease',
                  cursor: isConnected ? 'default' : 'pointer',
                  opacity: isConnected && activePersona.id !== p.id ? 0.4 : 1,
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: activePersona.id === p.id ? 'primary.main' : 'rgba(255,179,0,0.05)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{p.name}</Typography>
                  {activePersona.id === p.id && <Sparkles size={16} />}
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 500, lineHeight: 1.4 }}>
                  {p.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Grid>

        {/* Live Interface */}
        <Grid size={{ xs: 12, lg: 9 }}>
          <Paper
            elevation={0}
            sx={{
              aspectRatio: { xs: 'auto', md: '21/9' },
              minHeight: { xs: 400, md: 'auto' },
              borderRadius: 10,
              bgcolor: '#0D0C0B',
              border: '1px solid #1C1A18',
              p: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              mb: 4
            }}
          >
            {/* Visual background element */}
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none' }}>
              <motion.div 
                animate={{ 
                  scale: isConnected ? [1, 1.2, 1] : 1,
                  rotate: isConnected ? [0, 90, 180, 270, 360] : 0
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ 
                  width: '150%', 
                  height: '150%', 
                  background: `radial-gradient(circle, ${theme.palette.primary.main} 0%, transparent 70%)`,
                  position: 'absolute',
                  top: '-25%',
                  left: '-25%'
                }}
              />
            </Box>

            <AnimatePresence mode="wait">
              {!isConnected ? (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', zIndex: 1 }}
                >
                  <Box sx={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(255,255,255,0.03)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 4,
                    color: 'text.secondary',
                    border: '1px solid #1C1A18'
                  }}>
                    <Radio size={40} />
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={startConversation}
                    sx={{ px: 8, py: 2, fontSize: '1.2rem', fontWeight: 900 }}
                  >
                    Establish Link
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ width: '100%', zIndex: 1 }}
                >
                   <Grid container spacing={6} sx={{ alignItems: 'center' }}>
                     <Grid size={{ xs: 12, md: 5 }}>
                       <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                         <Box sx={{ position: 'relative' }}>
                            <Box sx={{ 
                              width: 180, 
                              height: 180, 
                              borderRadius: '50%', 
                              bgcolor: 'rgba(255,179,0,0.1)',
                              border: '4px solid',
                              borderColor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden'
                            }}>
                               <motion.div 
                                 animate={{ 
                                   height: [20, 60, 40, 90, 30],
                                   opacity: [0.5, 1, 0.5]
                                 }}
                                 transition={{ duration: 0.5, repeat: Infinity }}
                                 style={{ width: 8, backgroundColor: theme.palette.primary.main, borderRadius: 4, margin: 4 }}
                               />
                               <motion.div 
                                 animate={{ 
                                   height: [40, 20, 70, 40, 80],
                                   opacity: [0.5, 1, 0.5]
                                 }}
                                 transition={{ duration: 0.6, repeat: Infinity }}
                                 style={{ width: 8, backgroundColor: theme.palette.primary.main, borderRadius: 4, margin: 4 }}
                               />
                               <motion.div 
                                 animate={{ 
                                   height: [80, 40, 20, 60, 40],
                                   opacity: [0.5, 1, 0.5]
                                 }}
                                 transition={{ duration: 0.4, repeat: Infinity }}
                                 style={{ width: 8, backgroundColor: theme.palette.primary.main, borderRadius: 4, margin: 4 }}
                               />
                            </Box>
                            <Box sx={{ 
                              position: 'absolute', 
                              top: '100%', 
                              left: '50%', 
                              transform: 'translate(-50%, -50%)',
                              bgcolor: 'primary.main',
                              color: '#0A0908',
                              px: 2,
                              py: 0.5,
                              borderRadius: 2,
                              fontWeight: 900,
                              fontSize: '0.65rem',
                              letterSpacing: 1,
                              textTransform: 'uppercase'
                            }}>
                              Live: {activePersona.name}
                            </Box>
                         </Box>
                       </Box>
                     </Grid>

                     <Grid size={{ xs: 12, md: 7 }}>
                        <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                           <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Neural Link Established</Typography>
                           <Box sx={{ display: 'flex', gap: 3, justifyContent: { xs: 'center', md: 'flex-start' }, mb: 4 }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                               <Mic size={14} /> <Typography variant="caption" sx={{ fontWeight: 800 }}>Listening</Typography>
                             </Box>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                               <Volume2 size={14} /> <Typography variant="caption" sx={{ fontWeight: 800 }}>Model Ready</Typography>
                             </Box>
                           </Box>

                           <Box sx={{ 
                             bgcolor: 'rgba(0,0,0,0.4)', 
                             p: 2, 
                             borderRadius: 3, 
                             border: '1px solid #1C1A18', 
                             fontFamily: 'monospace',
                             fontSize: '0.75rem',
                             color: 'primary.main',
                             opacity: 0.8,
                             height: 60,
                             overflow: 'hidden',
                             mb: 4,
                             position: 'relative'
                           }}>
                             {transcription || "Capturing conversation buffer..."}
                             <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0D0C0B, transparent)', pointerEvents: 'none' }} />
                           </Box>

                           <Button
                            variant="outlined"
                            color="error"
                            onClick={stopConversation}
                            startIcon={<Square size={16} />}
                            sx={{ borderRadius: 99, px: 4 }}
                          >
                            Terminate Session
                          </Button>
                        </Box>
                     </Grid>
                   </Grid>
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>

          {/* Stats Bar */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="overline" sx={{ fontWeight: 900, opacity: 0.5 }}>Live Precision Index</Typography>
                  <Activity size={14} color={theme.palette.primary.main} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{liveScore ?? '--'}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>% accuracy matched</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={liveScore || 0} 
                  sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} 
                />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 6, height: '100%', bgcolor: '#1C1A18' }}>
                <Typography variant="overline" sx={{ fontWeight: 900, opacity: 0.5, mb: 1, display: 'block' }}>Neural Feedback</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.6 }}>
                  {liveNotes || "System awaiting user input to trigger accent evaluation matrix..."}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};
