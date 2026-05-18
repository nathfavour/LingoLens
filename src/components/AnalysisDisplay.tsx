import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  LinearProgress, 
  Divider,
  Container,
  useTheme
} from '@mui/material';
import { Globe, Languages, Target, Info, Sparkles, BookOpen, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AccentAnalysis } from '../types';

interface AnalysisDisplayProps {
  analysis: AccentAnalysis;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  const theme = useTheme();
  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <Box sx={{ pb: 10 }}>
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          mb: 6,
          borderRadius: 8,
          bgcolor: '#161412',
          border: '1px solid #1C1A18',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Globe 
          size={240} 
          style={{ 
            position: 'absolute', 
            top: -40, 
            right: -40, 
            opacity: 0.03, 
            pointerEvents: 'none' 
          }} 
        />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, opacity: 0.6 }}>
            <Target size={16} color={theme.palette.primary.main} />
            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 2 }}>Primary Detection</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between', gap: 4 }}>
            <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '5rem' }, fontWeight: 900, letterSpacing: -2, m: 0 }}>
              {analysis.primaryAccent}
            </Typography>
            
            <Box sx={{ minWidth: 200, textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Confidence Index</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '2.5rem', lineHeight: 1 }}>
                  {confidencePercent}%
                </Typography>
                <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', mb: 1, minWidth: 100 }}>
                  <Box sx={{ height: '100%', width: `${confidencePercent}%`, bgcolor: 'primary.main', borderRadius: 4 }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Details Grid */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Languages size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Regional Variations</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {analysis.detectedDialects.map((dialect, i) => (
                <Chip 
                  key={i} 
                  label={dialect} 
                  sx={{ 
                    bgcolor: 'rgba(255,179,0,0.1)', 
                    color: 'primary.main', 
                    fontWeight: 700,
                    borderRadius: 2,
                    border: '1px solid rgba(255,179,0,0.2)'
                  }} 
                />
              ))}
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Sparkles size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Notable Traits</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {analysis.characteristics.map((trait, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{trait}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Markers Section */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="overline" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, fontWeight: 900, opacity: 0.4, letterSpacing: 2 }}>
          <BookOpen size={14} /> Linguistic Matrix
        </Typography>
        <Grid container spacing={3}>
          {[
            { label: 'Phonology', value: analysis.linguisticMarkers.phonology, icon: Mic },
            { label: 'Prosody', value: analysis.linguisticMarkers.prosody, icon: Globe },
            { label: 'Syntax', value: analysis.linguisticMarkers.syntax, icon: Languages }
          ].map((marker, i) => (
            <Grid size={{ xs: 12, md: 4 }} key={marker.label}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  bgcolor: '#1C1A18', // Nested contrast
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mb: 1.5, 
                    fontWeight: 900, 
                    textTransform: 'uppercase', 
                    letterSpacing: 1.5,
                    color: 'primary.main',
                    opacity: 0.8
                  }}
                >
                  {marker.label}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary', fontWeight: 500 }}>
                  {marker.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Summary */}
      <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 8, bgcolor: 'rgba(255,255,255,0.02)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Info size={24} color={theme.palette.primary.main} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Analytical Summary</Typography>
        </Box>
        <Box sx={{ 
          color: 'text.secondary', 
          lineHeight: 1.8,
          '& p': { mb: 2 },
          '& strong': { color: 'text.primary', fontWeight: 600 }
        }}>
          <ReactMarkdown>{analysis.detailedExplanation}</ReactMarkdown>
        </Box>
      </Paper>
    </Box>
  );
};
