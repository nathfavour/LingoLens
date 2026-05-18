export interface AccentAnalysis {
  primaryAccent: string;
  detectedDialects: string[];
  confidence: number;
  characteristics: string[];
  linguisticMarkers: {
    phonology: string;
    prosody: string;
    syntax: string;
  };
  detailedExplanation: string;
}

export interface TrainingFeedback {
  score: number;
  feedback: string;
  accuracyBreakdown: {
    vowels: number;
    consonants: number;
    intonation: number;
  };
  tips: string[];
}

export interface WordFeedback {
  word: string;
  score: number;
  tip?: string;
}

export interface PronunciationFeedback {
  overallScore: number;
  words: WordFeedback[];
  generalAdvice: string;
}
