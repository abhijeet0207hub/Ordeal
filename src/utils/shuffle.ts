import { Exam, ExamQuestion } from '../types';

/**
 * Modern Fisher-Yates (Knuth) in-place shuffle algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles a single question's multiple-choice options while preserving
 * the correct answer index mapping.
 */
export function shuffleQuestionOptions(q: ExamQuestion): ExamQuestion {
  const originalCorrectOptionText = q.options[q.correctAnswer];
  const shuffledOptions = shuffleArray(q.options);
  const newCorrectAnswerIndex = shuffledOptions.indexOf(originalCorrectOptionText);

  return {
    ...q,
    options: shuffledOptions,
    correctAnswer: newCorrectAnswerIndex !== -1 ? newCorrectAnswerIndex : 0,
  };
}

/**
 * Prepares an exam for a candidate.
 * If randomizeQuestionsAndOptions is enabled in the exam security settings,
 * it shuffles questions and their options using the Fisher-Yates algorithm.
 */
export function prepareExamForCandidate(exam: Exam): Exam {
  if (!exam.securitySettings.randomizeQuestionsAndOptions) {
    return {
      ...exam,
      questions: exam.questions.map((q) => ({ ...q, options: [...q.options] })),
    };
  }

  // 1. Shuffle options within each question (remapping correct answer index)
  const optionShuffledQuestions = exam.questions.map((q) => shuffleQuestionOptions(q));

  // 2. Shuffle question order
  const fullyRandomizedQuestions = shuffleArray(optionShuffledQuestions);

  return {
    ...exam,
    questions: fullyRandomizedQuestions,
  };
}
