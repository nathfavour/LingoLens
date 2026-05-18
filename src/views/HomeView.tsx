import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  ToggleButtonGroup, 
  ToggleButton, 
  Paper, 
  Fade,
  CircularProgress,
  Button,
  useTheme
} from '@mui/material';
import { Upload, Mic, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioUploaderContent } from '../components/AudioUploader';
import { AudioRecorder } from '../components/AudioRecorder';
import { AnalysisDisplay } from '../components/AnalysisDisplay';
import { analyzeAccent } from '../services/geminiService';
import { AccentAnalysis } from '../types';

export const HomeView: React.FC = () => {
  const theme = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AccentAnalysis | null>(null);
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'record'>('upload');

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsLoading(true);
    setLoadingState("Capturing acoustic patterns...");
    setError(null);
    setAnalysis(null);

    try {
      setLoadingState("Finalizing audio stream...");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const result = reader.result.split(',')[1];
            if (result) resolve(result);
            else reject(new Error("Failed to extract base64 from file"));
          } else reject(new Error("File reading resulted in non-string output"));
        };
        reader.onerror = () => reject(new Error("Error reading binary data"));
        reader.readAsDataURL(selectedFile);
      });

      setLoadingState("Analyzing phonetic markers...");
      const mimeType = (selectedFile.type || 'audio/webm').split(';')[0];
      const result = await analyzeAccent(base64, mimeType);
      
      setLoadingState("Deconstructing regional dialects...");
      await new Promise(r => setTimeout(r, 600));
      
      setAnalysis(result);
    } catch (err: any) {
      console.error("Analysis process error:", err);
      setError(err?.message || 'The linguistic analysis failed. Please try a clearer sample.');
    } finally {
      setIsLoading(false);
      setLoadingState(null);
    }
  }, []);

  const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'upload' | 'record') => {
    if (newMode !== null) setMode(newMode);
  };

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <Container maxWidth="lg">
      {!analysis && !isLoading && !error && (
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography 
            variant="h1" 
            sx={{ 
              fontSize: { xs: '3rem', md: '5rem' }, 
              mb: 2, 
              letterSpacing: -2,
              color: 'text.primary',
              fontWeight: 900
            }}
          >
            Identify Any <Box component="span" sx={{ fontStyle: 'italic', color: 'primary.main' }}>Accent.</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}>
            Upload a recording or capture audio live to deconstruct regional dialects and linguistic markers.
          </Typography>
        </Box>
      )}

      <AnimatePresence mode="wait">
        {!analysis && !isLoading && !error && (
          <motion.div
            key="input-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Box sx={{ maxWidth: 700, mx: 'auto', mb: 10 }}>
              <Box sx={{ display: 'flex', borderBottom: '1px solid #1C1A18', mb: 6, pb: 1 }}>
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={handleModeChange}
                  sx={{
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      borderRadius: 0,
                      px: 4,
                      py: 1,
                      color: 'text.secondary',
                      borderBottom: '2px solid transparent',
                      '&.Mui-selected': {
                        bgcolor: 'transparent',
                        color: 'primary.main',
                        borderBottomColor: 'primary.main',
                        '&:hover': { bgcolor: 'rgba(255,179,0,0.05)' }
                      },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                    }
                  }}
                >
                  <ToggleButton value="upload">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, letterSpacing: 1 }}>
                      <Upload size={16} /> Upload
                    </Box>
                  </ToggleButton>
                  <ToggleButton value="record">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800, letterSpacing: 1 }}>
                      <Mic size={16} /> Record
                    </Box>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {mode === 'upload' ? (
                <AudioUploaderContent onFileSelect={handleFileSelect} isLoading={isLoading} />
              ) : (
                <AudioRecorder onRecordingComplete={handleFileSelect} isLoading={isLoading} loadingStatus={loadingState || undefined} />
              )}
            </Box>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box sx={{ 
              py: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}>
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                <CircularProgress size={80} thickness={2} sx={{ color: 'primary.main' }} />
                <Box sx={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                }}>
                  <Mic size={32} color={theme.palette.primary.main} style={{ opacity: 0.5 }} />
                </Box>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{loadingState || "Processing..."}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 2, fontStyle: 'italic' }}>
                  Linguistic engine is active
                </Typography>
              </Box>
            </Box>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Box sx={{ py: 10, textAlign: 'center', maxWidth: 500, mx: 'auto' }}>
              <Typography sx={{ color: 'error.main', mb: 4, fontWeight: 500 }}>{error}</Typography>
              <Button 
                variant="outlined" 
                color="inherit" 
                startIcon={<RefreshCcw size={18} />}
                onClick={reset}
                sx={{ borderRadius: 99, borderColor: 'divider' }}
              >
                Try Again
              </Button>
            </Box>
          </motion.div>
        )}

        {analysis && (
          <motion.div
            key="analysis-result"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <Button 
                startIcon={<RefreshCcw size={16} />}
                onClick={reset}
                sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
              >
                New Analysis
              </Button>
            </Box>
            <AnalysisDisplay analysis={analysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
};
