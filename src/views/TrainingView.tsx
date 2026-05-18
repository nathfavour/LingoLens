import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Grid, 
  CircularProgress,
  Divider,
  LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import { AudioRecorder } from '../components/AudioRecorder';
import { getTrainingFeedback } from '../services/geminiService';
import { TrainingFeedback } from '../types';
import { Play, Sparkles, Trophy, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, increment, serverTimestamp } from 'firebase/firestore';

const TRAINING_PHRASES = [
  "Water under the bridge.",
  "Better late than never.",
  "The quick brown fox jumps over the lazy dog.",
  "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",
  "A penny for your thoughts."
];

export const TrainingView: React.FC = () => {
  const { user, signIn } = useAuth();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [feedback, setFeedback] = useState<TrainingFeedback | null>(null);
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPhrase = TRAINING_PHRASES[currentPhraseIndex];

  const handleRecordingComplete = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setLoadingState("Finalizing recording...");
    setError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve((reader.result as string).split(',')[1]);
          } else reject(new Error("Invalid audio data"));
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setLoadingState("Comparing against target accent...");
      const mimeType = (file.type || 'audio/webm').split(';')[0];
      const result = await getTrainingFeedback(base64, mimeType, currentPhrase, "General American (standard)");
      
      setLoadingState("Calculating mastery score...");
      await new Promise(r => setTimeout(r, 600));
      
      setFeedback(result);

      if (user) {
        const progressRef = doc(db, 'users', user.uid, 'progress', 'gen-american');
        const progressDoc = await getDoc(progressRef);
        
        if (!progressDoc.exists()) {
          await setDoc(progressRef, {
            userId: user.uid,
            accentId: 'gen-american',
            level: 1,
            score: result.score,
            lastUpdated: serverTimestamp()
          });
        } else {
          await setDoc(progressRef, {
            score: increment(result.score),
            level: increment(result.score > 80 ? 1 : 0),
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyze training recording.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentPhrase, user]);

  const nextPhrase = () => {
    setFeedback(null);
    setCurrentPhraseIndex((prev) => (prev + 1) % TRAINING_PHRASES.length);
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Box sx={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          bgcolor: 'rgba(255,179,0,0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mx: 'auto',
          mb: 4,
          color: 'primary.main'
        }}>
          <Star size={40} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Training Matrix</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 6 }}>
          Authenticated sessions allow for progress tracking, algorithmic feedback, and pattern mastery history.
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          onClick={signIn}
          sx={{ px: 6 }}
        >
          Initialize Practice
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: 2, bgcolor: 'rgba(255,179,0,0.1)', color: 'primary.main', mb: 2 }}>
          <Trophy size={14} />
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>General American Practice</Typography>
        </Box>
        <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: -1 }}>Daily Training</Typography>
      </Box>

      <AnimatePresence mode="wait">
        {!feedback ? (
          <motion.div
            key="practice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Paper elevation={0} sx={{ p: { xs: 4, md: 8 }, borderRadius: 8, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
               <Play size={160} style={{ position: 'absolute', top: -40, right: -40, opacity: 0.02, pointerEvents: 'none' }} />
               
               <Box sx={{ mb: 6 }}>
                 <Typography variant="overline" sx={{ fontWeight: 800, opacity: 0.4, letterSpacing: 2 }}>Repeat Phrase</Typography>
                 <Typography variant="h3" sx={{ fontWeight: 500, fontStyle: 'italic', maxWidth: 600, mx: 'auto', mt: 2, lineHeight: 1.3 }}>
                   "{currentPhrase}"
                 </Typography>
               </Box>

               <AudioRecorder onRecordingComplete={handleRecordingComplete} isLoading={isAnalyzing} loadingStatus={loadingState || undefined} />
            </Paper>
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Grid container spacing={4} sx={{ mb: 6 }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper elevation={0} sx={{ p: 5, borderRadius: 6, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Box sx={{ position: 'relative', mb: 3 }}>
                    <CircularProgress 
                      variant="determinate" 
                      value={100} 
                      size={140} 
                      thickness={3} 
                      sx={{ color: 'rgba(255,255,255,0.05)' }} 
                    />
                    <CircularProgress 
                      variant="determinate" 
                      value={feedback.score} 
                      size={140} 
                      thickness={3} 
                      sx={{ color: 'primary.main', position: 'absolute', left: 0 }} 
                    />
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{feedback.score}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Score Analysis</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{feedback.feedback}</Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Paper elevation={0} sx={{ p: 5, borderRadius: 6, height: '100%' }}>
                  <Typography variant="overline" sx={{ fontWeight: 900, letterSpacing: 2, opacity: 0.4, mb: 4, display: 'block' }}>Precision Breakdown</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 4 }}>
                    {Object.entries(feedback.accuracyBreakdown).map(([key, value]) => (
                      <Box key={key}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{key}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>{value}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={value} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
                      </Box>
                    ))}
                  </Box>
                  
                  <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.05)' }} />
                  
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', mb: 2 }}>
                      <Sparkles size={16} />
                      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5 }}>Optimization Tips</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {feedback.tips.map((tip, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 900 }}>•</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{tip}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={nextPhrase}
                endIcon={<ArrowRight />}
                sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
              >
                Next Exercise
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};
