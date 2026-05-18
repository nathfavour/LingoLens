import React, { useCallback, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  LinearProgress,
  useTheme
} from '@mui/material';
import { Upload, FileAudio, X, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const AudioUploaderContent: React.FC<AudioUploaderProps> = ({ onFileSelect, isLoading }) => {
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 700, mx: 'auto' }}>
      <Paper
        elevation={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          position: 'relative',
          borderRadius: 8,
          p: 6,
          textAlign: 'center',
          bgcolor: isDragging ? 'rgba(255,179,0,0.05)' : '#161412',
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : '#1C1A18',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            cursor: isLoading ? 'default' : 'pointer'
          }
        }}
      >
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: isLoading ? 'default' : 'pointer'
          }}
          disabled={isLoading}
        />
        
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'rgba(255,179,0,0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'primary.main'
                }}>
                  <Upload size={32} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Drop audio sample here</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>High-fidelity processing for M4A, WAV, MP3</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
                  <Mic size={12} />
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Neural Processing Enabled</Typography>
                </Box>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: 4, 
                    bgcolor: 'rgba(255,179,0,0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: 'primary.main'
                  }}>
                    <FileAudio size={48} />
                  </Box>
                  {!isLoading && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      sx={{
                        position: 'absolute',
                        top: -12,
                        right: -12,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: '#d32f2f' }
                      }}
                    >
                      <X size={16} />
                    </IconButton>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
                  </Typography>
                </Box>

                {isLoading && (
                  <LinearProgress 
                    sx={{ width: '100%', maxWidth: 200, borderRadius: 10, height: 4 }} 
                  />
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>
    </Box>
  );
};
