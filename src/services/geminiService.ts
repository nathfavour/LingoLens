import { AccentAnalysis, TrainingFeedback, PronunciationFeedback } from "../types";

export async function analyzeAccent(audioBase64: string, mimeType: string): Promise<AccentAnalysis> {
  const response = await fetch("/api/analyze-accent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze accent");
  }

  return response.json();
}

export async function getTrainingFeedback(
  audioBase64: string, 
  mimeType: string, 
  targetPhrase: string, 
  targetAccent: string
): Promise<TrainingFeedback> {
  const response = await fetch("/api/training-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType, targetPhrase, targetAccent }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get training feedback");
  }

  return response.json();
}

export async function generateTrainingSentence(complexity: 'word' | 'sentence' | 'paragraph'): Promise<string> {
  const response = await fetch("/api/generate-sentence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ complexity }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate sentence");
  }

  const data = await response.json();
  return data.sentence;
}

export async function getPronunciationFeedback(
  audioBase64: string,
  mimeType: string,
  targetText: string
): Promise<PronunciationFeedback> {
  const response = await fetch("/api/pronunciation-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType, targetText }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get pronunciation feedback");
  }

  return response.json();
}
