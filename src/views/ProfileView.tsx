import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Avatar, 
  Button, 
  Grid, 
  Divider,
  Chip,
  useTheme
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, Calendar, User as UserIcon, Medal, ArrowRight, Settings } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, signIn, logout } = useAuth();
  const theme = useTheme();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      try {
        const progressRef = doc(db, 'users', user.uid, 'progress', 'gen-american');
        const snap = await getDoc(progressRef);
        if (snap.exists()) {
          setProgress(snap.data());
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

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
          <UserIcon size={40} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Profile Access Restricted</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 6 }}>
          Linguistic history and mastery metrics are synchronized to your neural identity. Sign in to retrieve your telemetry.
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          onClick={signIn}
          sx={{ px: 6 }}
        >
          Initialize Sync
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header Shell */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          mb: 6,
          borderRadius: 8,
          bgcolor: '#161412',
          border: '1px solid #1C1A18',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: 6
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Avatar 
            src={user.photoURL || ''} 
            sx={{ 
              width: 140, 
              height: 140, 
              border: '4px solid', 
              borderColor: 'rgba(255,179,0,0.2)',
              p: 0.5,
              bgcolor: 'rgba(255,179,0,0.05)'
            }}
          />
          <Box sx={{ 
            position: 'absolute', 
            bottom: 4, 
            right: 4, 
            bgcolor: 'primary.main', 
            color: '#0A0908', 
            p: 1, 
            borderRadius: '50%',
            boxShadow: theme.shadows[10]
          }}>
             <Trophy size={20} />
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', md: 'left' } }}>
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, letterSpacing: -2 }}>
            {user.displayName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, display: 'block', mb: 3 }}>
            Telemetry synced since {new Date(user.metadata.creationTime!).toLocaleDateString()}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: { xs: 'center', md: 'flex-start' } }}>
            <Chip label="Neural Pioneer" size="small" sx={{ bgcolor: 'rgba(255,179,0,0.1)', color: 'primary.main', fontWeight: 800, fontSize: '0.65rem' }} />
            <Chip label="Beta System Node" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary', fontWeight: 800, fontSize: '0.65rem' }} />
          </Box>
        </Box>

        <Box>
           <Button 
             variant="outlined" 
             color="error"
             size="small"
             onClick={logout}
             sx={{ borderRadius: 99, px: 3 }}
           >
             Terminate Session
           </Button>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* Stats Section with Inset Contrast */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, bgcolor: '#161412', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
              <TrendingUp size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Mastery Telemetry</Typography>
            </Box>

            <Paper elevation={0} sx={{ bgcolor: '#0A0908', p: 4, borderRadius: 4, border: '1px solid #1C1A18' }}>
              <Grid container spacing={4}>
                {[
                  { label: "Aggregate Accuracy", value: `${progress ? (progress.score / (progress.level || 1)).toFixed(1) : '0'}%` },
                  { label: "Neural Level", value: `LVL ${progress?.level || 0}` },
                  { label: "Active Nodes", value: "2" },
                  { label: "Datalink Sessions", value: progress ? "5" : "0" }
                ].map((stat, i) => (
                  <Grid size={{ xs: 6 }} key={i}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>{stat.value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Paper>
        </Grid>

        {/* Achievements Section */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 6, bgcolor: '#161412', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Medal size={20} color={theme.palette.primary.main} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Mastery Badges</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { title: "Point of Contact", desc: "Initialize first training session", color: theme.palette.success.main, active: true },
                { title: "Native Resonator", desc: "Reach 95% accuracy in Live Mode", color: theme.palette.secondary.main, active: false }
              ].map((badge, i) => (
                <Paper 
                  key={i} 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    borderRadius: 3, 
                    bgcolor: badge.active ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                    border: '1px solid #1C1A18',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    opacity: badge.active ? 1 : 0.3
                  }}
                >
                  <Box sx={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: '50%', 
                    bgcolor: badge.active ? `${badge.color}15` : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: badge.active ? badge.color : 'text.disabled'
                  }}>
                    <Medal size={22} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{badge.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{badge.desc}</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
