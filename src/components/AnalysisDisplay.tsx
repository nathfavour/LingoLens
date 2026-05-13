import React from 'react';
import { motion } from 'motion/react';
import { Globe, Languages, Target, Info, Sparkles, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AccentAnalysis } from '../services/geminiService';
import { cn } from '../lib/utils';

interface AnalysisDisplayProps {
  analysis: AccentAnalysis;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* Hero Result */}
      <section className="bg-card/40 backdrop-blur-md rounded-3xl p-8 border border-muted/20 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Globe className="w-48 h-48 -mr-12 -mt-12" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-6">
          <div className="space-y-2 flex-grow">
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
              <Target className="w-4 h-4" />
              <span>Primary Detection</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              {analysis.primaryAccent}
            </h2>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs font-mono text-muted-foreground uppercase opacity-70">Confidence</div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold font-mono">{confidencePercent}%</span>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dialects */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/20 border border-muted/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-primary/80">
            <Languages className="w-4 h-4" />
            <span>Regional Variations</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.detectedDialects.map((dialect, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium">
                {dialect}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Characteristics */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/20 border border-muted/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-primary/80">
            <Sparkles className="w-4 h-4" />
            <span>Notable Traits</span>
          </div>
          <ul className="grid grid-cols-1 gap-2">
            {analysis.characteristics.map((trait, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                {trait}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Linguistic Deep Dive */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-tighter opacity-50">
          <BookOpen className="w-4 h-4" />
          <span>Linguistic Matrix</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Phonology', value: analysis.linguisticMarkers.phonology, color: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Prosody', value: analysis.linguisticMarkers.prosody, color: 'bg-purple-500/10 border-purple-500/20' },
            { label: 'Syntax', value: analysis.linguisticMarkers.syntax, color: 'bg-emerald-500/10 border-emerald-500/20' }
          ].map((marker, i) => (
            <motion.div
              key={marker.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={cn("p-5 rounded-2xl border flex flex-col gap-2", marker.color)}
            >
              <span className="text-xs font-mono uppercase font-bold opacity-70">{marker.label}</span>
              <p className="text-sm leading-relaxed">{marker.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Summary */}
      <section className="bg-muted/5 rounded-3xl p-8 border border-muted/10">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">Analytical Summary</h3>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed">
          <ReactMarkdown>{analysis.detailedExplanation}</ReactMarkdown>
        </div>
      </section>
    </motion.div>
  );
};
