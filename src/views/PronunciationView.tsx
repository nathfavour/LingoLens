import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  IconButton,
  Grid,
  LinearProgress,
  Tooltip,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  useTheme
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  RotateCcw, 
  ChevronRight, 
  Volume2, 
  Play, 
  Pause, 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { generateTrainingSentence, getPronunciationFeedback } from '../services/geminiService';
import { PronunciationFeedback, WordFeedback } from '../types';

type Complexity = 'word' | 'sentence' | 'paragraph';
type Tab = 'auto' | 'custom';

export const PronunciationView: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('auto');
  const [complexity, setComplexity] = useState<Complexity>('sentence');
  const [targetText, setTargetText] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const fetchSentence = useCallback(async () => {
    setIsAnalyzing(true);
    setFeedback(null);
    try {
      const sentence = await generateTrainingSentence(complexity);
      setTargetText(sentence);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [complexity]);

  useEffect(() => {
    if (activeTab === 'auto' && !targetText) {
      fetchSentence();
    }
  }, [activeTab, targetText, fetchSentence]);

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
        analyzeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err: any) {
      setError("Microphone access denied or error: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const analyzeAudio = async (blob: Blob) => {
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await getPronunciationFeedback(base64, blob.type, targetText);
        setFeedback(result);
      };
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playCorrectPronunciation = (fromIndex: number = 0) => {
    window.speechSynthesis.cancel();
    
    const words = targetText.split(/\s+/);
    const textToSpeak = words.slice(fromIndex).join(' ');
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utteranceRef.current = utterance;

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        let currentLen = 0;
        const subWords = textToSpeak.split(/\s+/);
        for (let i = 0; i < subWords.length; i++) {
          if (charIndex >= currentLen && charIndex < currentLen + subWords[i].length + 1) {
            setCurrentWordIndex(fromIndex + i);
            break;
          }
          currentLen += subWords[i].length + 1;
        }
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentWordIndex(null);
    };

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCustomTextSubmit = () => {
    if (customText.trim()) {
      setTargetText(customText);
      setFeedback(null);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, letterSpacing: -1 }}>
          Pronunciation <Box component="span" sx={{ fontStyle: 'italic', color: 'primary.main' }}>Forge.</Box>
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto' }}>
          Real-time phonetic sculpting. Record, iterate, and master the resonance of every syllable with pinpoint AI corrections.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Configuration Side */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, bgcolor: '#161412', border: '1px solid #1C1A18', mb: 3 }}>
            <Typography variant="overline" sx={{ fontWeight: 900, opacity: 0.5, mb: 3, display: 'block' }}>Input Method</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', bgcolor: '#0D0C0B', p: 0.5, borderRadius: 4 }}>
                <Button 
                  fullWidth 
                  variant={activeTab === 'auto' ? 'contained' : 'text'}
                  onClick={() => setActiveTab('auto')}
                  startIcon={<Sparkles size={16} />}
                  sx={{ borderRadius: 3 }}
                >
                  Auto
                </Button>
                <Button 
                  fullWidth 
                  variant={activeTab === 'custom' ? 'contained' : 'text'}
                  onClick={() => setActiveTab('custom')}
                  startIcon={<Edit3 size={16} />}
                  sx={{ borderRadius: 3 }}
                >
                  Custom
                </Button>
              </Box>

              {activeTab === 'auto' && (
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, mb: 2, color: 'text.secondary' }}>Complexity Level</Typography>
                  <ToggleButtonGroup
                    value={complexity}
                    exclusive
                    onChange={(_, val) => val && setComplexity(val)}
                    fullWidth
                    sx={{ bgcolor: '#0D0C0B', p: 0.5, borderRadius: 3, '& .MuiToggleButton-root': { border: 'none', borderRadius: 2, py: 1 } }}
                  >
                    <ToggleButton value="word">Word</ToggleButton>
                    <ToggleButton value="sentence">Sentence</ToggleButton>
                    <ToggleButton value="paragraph">Full</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              {activeTab === 'custom' && (
                <Box>
                  <TextField 
                    multiline 
                    rows={4} 
                    fullWidth 
                    placeholder="Paste your speech, script, or phrases here..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        bgcolor: '#0D0C0B', 
                        borderRadius: 3,
                        fontSize: '0.875rem'
                      } 
                    }}
                  />
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={handleCustomTextSubmit}
                    sx={{ mt: 2, borderRadius: 3 }}
                    disabled={!customText.trim()}
                  >
                    Apply To Forge
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>

          {feedback && (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 6, bgcolor: '#161412', border: '1px solid #1C1A18' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="overline" sx={{ fontWeight: 900, opacity: 0.5 }}>Scoreboard</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                  <CheckCircle2 size={16} />
                  <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{feedback.overallScore}%</Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.6 }}>
                "{feedback.generalAdvice}"
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Forge Area */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 8,
              bgcolor: '#0D0C0B',
              border: '1px solid #1C1A18',
              position: 'relative',
              minHeight: 500,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Target Text Display */}
            <Box sx={{ flexGrow: 1, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'primary.main' }}>
                  <BookOpen size={18} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Target Articulation</Typography>
                </Box>
                <IconButton 
                  onClick={() => isPlaying ? window.speechSynthesis.cancel() : playCorrectPronunciation(0)} 
                  color={isPlaying ? "primary" : "default"}
                >
                  {isPlaying ? <Pause size={20} /> : <Volume2 size={20} />}
                </IconButton>
              </Box>

              {isAnalyzing && !targetText ? (
                <Box sx={{ display: 'flex', py: 10, justifyContent: 'center' }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1.5, 
                  lineHeight: 1.8,
                  fontSize: { xs: '1.25rem', md: '1.75rem' },
                  fontWeight: 700
                }}>
                  {targetText.split(/\s+/).map((word, idx) => {
                    // Check if feedback exists for this word
                    const wordFeedback = feedback?.words.find(w => w.word.toLowerCase().replace(/[^\w]/g, '') === word.toLowerCase().replace(/[^\w]/g, ''));
                    const isError = wordFeedback && wordFeedback.score < 80;
                    const isGreat = wordFeedback && wordFeedback.score >= 95;
                    const isPlayingWord = currentWordIndex === idx;

                    return (
                      <Tooltip key={idx} title={wordFeedback?.tip || ""} arrow>
                        <Box
                          component="span"
                          onClick={() => playCorrectPronunciation(idx)}
                          sx={{
                            color: isPlayingWord ? 'primary.main' : isError ? '#FF5252' : isGreat ? '#4CAF50' : '#F5F2ED',
                            borderBottom: '2px solid',
                            borderColor: isPlayingWord ? 'primary.main' : isError ? 'rgba(255, 82, 82, 0.3)' : isGreat ? 'rgba(76, 175, 80, 0.3)' : 'transparent',
                            px: 0.5,
                            borderRadius: 1,
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            position: 'relative',
                            '&:hover': {
                              bgcolor: 'rgba(255,255,255,0.05)'
                            }
                          }}
                        >
                          {word}
                          {isPlayingWord && (
                            <motion.div 
                              layoutId="pointer"
                              style={{ 
                                position: 'absolute', 
                                bottom: -12, 
                                left: '50%', 
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderBottom: `8px solid ${theme.palette.primary.main}`
                              }}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Controls */}
            <Box sx={{ position: 'relative', pt: 4, borderTop: '1px solid #1C1A18', display: 'flex', alignItems: 'center', gap: 4 }}>
               {isRecording ? (
                 <Button
                   variant="contained"
                   color="error"
                   size="large"
                   onClick={stopRecording}
                   startIcon={<Square size={20} fill="currentColor" />}
                   sx={{ height: 64, px: 6, borderRadius: 99, fontWeight: 900 }}
                 >
                   Capture Segment
                 </Button>
               ) : (
                 <Button
                    variant="contained"
                    size="large"
                    onClick={startRecording}
                    disabled={isAnalyzing || !targetText}
                    startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <Mic size={20} />}
                    sx={{ height: 64, px: 6, borderRadius: 99, fontWeight: 900 }}
                  >
                    {isAnalyzing ? "Analyzing Resonance..." : "Start Recording"}
                  </Button>
               )}

               {feedback && (
                 <Box sx={{ display: 'flex', gap: 2 }}>
                   <Button 
                    variant="outlined" 
                    startIcon={<RotateCcw size={16} />}
                    onClick={() => setFeedback(null)}
                    sx={{ borderRadius: 99 }}
                   >
                     Retry
                   </Button>
                   {activeTab === 'auto' && (
                     <Button 
                      variant="outlined" 
                      endIcon={<ChevronRight size={16} />}
                      onClick={fetchSentence}
                      sx={{ borderRadius: 99 }}
                     >
                       Next
                     </Button>
                   )}
                 </Box>
               )}

               {error && (
                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                   <AlertCircle size={16} />
                   <Typography variant="caption">{error}</Typography>
                 </Box>
               )}
            </Box>

            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'absolute', top: 20, right: 20 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(255, 82, 82, 0.1)', px: 3, py: 1, borderRadius: 99, color: '#FF5252' }}>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ repeat: Infinity, duration: 1 }}
                      style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'currentColor' }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1 }}>RECORDING LIVE</Typography>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Paper>

          {/* Feedback Legend */}
          <Box sx={{ mt: 4, display: 'flex', gap: 4, justifyContent: 'center', opacity: 0.5 }}>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Excellent Mastery</Typography>
             </Box>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF5252' }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Action Required</Typography>
             </Box>
             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Real-time Playback</Typography>
             </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};
