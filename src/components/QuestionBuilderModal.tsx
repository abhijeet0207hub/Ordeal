import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  RefreshCw,
  Code,
  FileQuestion,
  Layers,
} from 'lucide-react';
import { Exam, ExamQuestion, GlassTheme } from '../types';
import { GLASS_THEMES } from '../utils/theme';
import { generateLocalDistractors } from '../utils/localDistractorGenerator';

interface QuestionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  onQuestionAdded: (examId: string, q: ExamQuestion) => void;
  currentTheme: GlassTheme;
}

export const QuestionBuilderModal: React.FC<QuestionBuilderModalProps> = ({
  isOpen,
  onClose,
  exams,
  onQuestionAdded,
  currentTheme,
}) => {
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || 'exam-cs-401');
  const [questionText, setQuestionText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [correctAnswerText, setCorrectAnswerText] = useState('');
  const [wrongOption1, setWrongOption1] = useState('');
  const [wrongOption2, setWrongOption2] = useState('');
  const [wrongOption3, setWrongOption3] = useState('');
  const [explanation, setExplanation] = useState('');
  const [points, setPoints] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const theme = GLASS_THEMES[currentTheme];

  if (!isOpen) return null;

  const handleGenerateDistractors = async () => {
    if (!questionText.trim()) {
      setFeedbackMsg('Please enter the question prompt first.');
      return;
    }
    if (!correctAnswerText.trim()) {
      setFeedbackMsg('Please enter the correct answer so the local pedagogical generator can synthesize realistic wrong alternatives.');
      return;
    }

    setIsGenerating(true);
    setFeedbackMsg(null);

    try {
      // Immediate local generation with simulated micro-tick for smooth tactile response
      await new Promise((r) => setTimeout(r, 200));
      const exam = exams.find((e) => e.id === selectedExamId);
      const result = generateLocalDistractors(
        questionText,
        correctAnswerText,
        exam?.category || 'Computer Science'
      );

      if (result.distractors && result.distractors.length >= 3) {
        setWrongOption1(result.distractors[0]);
        setWrongOption2(result.distractors[1]);
        setWrongOption3(result.distractors[2]);
        if (result.explanation && !explanation) {
          setExplanation(result.explanation);
        }
        setFeedbackMsg('✨ 3 plausible distractors generated on-device via local pedagogical engine!');
      } else {
        setFeedbackMsg('Could not synthesize distractors.');
      }
    } catch (e: any) {
      setFeedbackMsg('Distractor generation error.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim() || !correctAnswerText.trim()) {
      setFeedbackMsg('Question text and correct answer are required.');
      return;
    }

    const options = [
      correctAnswerText,
      wrongOption1 || 'Alternative misconception A',
      wrongOption2 || 'Alternative misconception B',
      wrongOption3 || 'Alternative misconception C',
    ];

    const newQuestion: ExamQuestion = {
      id: 'q-' + Date.now().toString().slice(-5),
      question: questionText,
      codeSnippet: codeSnippet.trim() ? codeSnippet : undefined,
      options,
      correctAnswer: 0, // initially at index 0, shuffle engine will randomize it for candidates!
      explanation: explanation || 'Verified standard academic solution.',
      points,
    };

    try {
      await fetch(`/api/exams/${selectedExamId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      });
    } catch (e) {
      console.warn('Backend save question note:', e);
    }

    onQuestionAdded(selectedExamId, newQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`relative max-w-2xl w-full rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.glow} p-6 shadow-2xl space-y-5 my-8`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Question Builder & Algorithmic Distractor Lab
              </h2>
              <p className="text-xs text-slate-400">
                Author MCQ questions and auto-generate plausible wrong options using on-device heuristics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Exam Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Target Examination
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-slate-900 text-white">
                {ex.code}: {ex.title} ({ex.questions.length} existing items)
              </option>
            ))}
          </select>
        </div>

        {/* Question Prompt */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Question Statement / Problem Prompt
          </label>
          <textarea
            rows={2}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. Which distributed algorithm guarantees total order broadcast in an asynchronous network model?"
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80"
          />
        </div>

        {/* Optional Code Snippet */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-slate-400" />
            Optional Code Snippet
          </label>
          <textarea
            rows={2}
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            placeholder="// Paste code snippet here if applicable..."
            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-emerald-300 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        {/* Correct Answer Input */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Correct Answer (Ground Truth)
            </label>
            <span className="text-[10px] text-emerald-300 font-mono">Will be randomized during test</span>
          </div>
          <input
            type="text"
            value={correctAnswerText}
            onChange={(e) => setCorrectAnswerText(e.target.value)}
            placeholder="e.g. Paxos with lease-based failure detection"
            className="w-full bg-black/40 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-medium"
          />
        </div>

        {/* Auto-Generate Wrong Distractors Trigger */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-xs font-bold text-slate-200 block">Wrong Options (Distractors)</span>
            <span className="text-[11px] text-slate-400">Plausible alternatives that test student comprehension</span>
          </div>

          <button
            type="button"
            onClick={handleGenerateDistractors}
            disabled={isGenerating}
            className="py-2 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>{isGenerating ? 'Synthesizing...' : 'Auto-Generate Wrong Options (On-Device)'}</span>
          </button>
        </div>

        {feedbackMsg && (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-300 flex items-center gap-2 font-mono">
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* 3 Wrong Option Fields */}
        <div className="space-y-2">
          <input
            type="text"
            value={wrongOption1}
            onChange={(e) => setWrongOption1(e.target.value)}
            placeholder="Wrong Option 1 (or click Auto-Generate above)"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/80"
          />
          <input
            type="text"
            value={wrongOption2}
            onChange={(e) => setWrongOption2(e.target.value)}
            placeholder="Wrong Option 2 (or click Auto-Generate above)"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/80"
          />
          <input
            type="text"
            value={wrongOption3}
            onChange={(e) => setWrongOption3(e.target.value)}
            placeholder="Wrong Option 3 (or click Auto-Generate above)"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/80"
          />
        </div>

        {/* Explanation */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Explanation / Pedagogical Note
          </label>
          <input
            type="text"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explain why the correct answer holds and why distractors fail..."
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveQuestion}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${theme.accentBtn}`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Question to Exam Bank</span>
          </button>
        </div>
      </div>
    </div>
  );
};
