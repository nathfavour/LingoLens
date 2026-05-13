import { useState, useCallback } from 'react';
import { Mic2, History, AlertCircle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioUploaderContent } from './components/AudioUploader';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { analyzeAccent, AccentAnalysis } from './services/geminiService';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AccentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
      });
      reader.readAsDataURL(selectedFile);
      const base64 = await base64Promise;

      const result = await analyzeAccent(base64, selectedFile.type);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 container mx-auto px-6 pt-20">
        {/* Navigation / Header */}
        <header className="flex flex-col items-center text-center space-y-6 mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground p-[1px]"
          >
            <div className="w-full h-full bg-[#050505] rounded-2xl flex items-center justify-center">
              <Mic2 className="w-8 h-8 text-primary" />
            </div>
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
              Lingo<span className="text-primary">Lens</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto font-light leading-relaxed">
              Detect accents, sub-dialects, and linguistic patterns using professional-grade AI analysis.
            </p>
          </div>
        </header>

        {/* Primary Content Area */}
        <section className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {!analysis && !isLoading && !error && (
              <motion.div
                key="uploader"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-8"
              >
                <AudioUploaderContent onFileSelect={handleFileSelect} isLoading={isLoading} />
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 space-y-8"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-primary/20 animate-ping absolute inset-0" />
                  <div className="w-24 h-24 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-medium">Deconstructing Speech...</h3>
                  <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
                    Analyzing phonemes & prosody
                  </p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto py-20 text-center space-y-6"
              >
                <div className="inline-flex w-16 h-16 rounded-full bg-destructive/10 items-center justify-center text-destructive">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Analysis Failed</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <button
                  onClick={reset}
                  className="px-6 py-2 rounded-full border border-muted hover:bg-white hover:text-black transition-all flex items-center gap-2 mx-auto"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Try Another File
                </button>
              </motion.div>
            )}

            {analysis && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-4"
              >
                <div className="flex justify-center mb-8">
                  <button
                    onClick={reset}
                    className="group px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-sm text-muted-foreground hover:text-white"
                  >
                    <History className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
                    New Analysis
                  </button>
                </div>
                <AnalysisDisplay analysis={analysis} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Footer info */}
        <footer className="py-12 text-center opacity-30 text-xs font-mono uppercase tracking-[0.3em]">
          Powered by Gemini 3.1 Pro • Linguistic Engine v1.0
        </footer>
      </main>
    </div>
  );
}
