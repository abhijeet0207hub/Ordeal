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
 * Shuffles a single question's multiple-choice options while preserving:
 * 1. The displayed correctAnswer index
 * 2. The canonical optionIndexMap (mapping displayed index -> canonical index)
 * 3. The original canonicalOptions and canonicalCorrectAnswer for deterministic server/client grading
 */
export function shuffleQuestionOptions(q: ExamQuestion): ExamQuestion {
  const canonicalOptions = q.canonicalOptions ? [...q.canonicalOptions] : [...q.options];
  const canonicalCorrectAnswer =
    typeof q.canonicalCorrectAnswer === 'number' ? q.canonicalCorrectAnswer : q.correctAnswer;

  const indexedOptions = canonicalOptions.map((text, canonicalIdx) => ({
    text,
    canonicalIdx,
  }));

  const shuffledIndexed = shuffleArray(indexedOptions);
  const shuffledOptions = shuffledIndexed.map((item) => item.text);
  const optionIndexMap = shuffledIndexed.map((item) => item.canonicalIdx);
  const newCorrectAnswerIndex = optionIndexMap.indexOf(canonicalCorrectAnswer);

  return {
    ...q,
    options: shuffledOptions,
    correctAnswer: newCorrectAnswerIndex !== -1 ? newCorrectAnswerIndex : 0,
    optionIndexMap,
    canonicalOptions,
    canonicalCorrectAnswer,
  };
}

/**
 * Prepares an exam for a candidate.
 * Even when randomization is disabled, attaches identity optionIndexMap ([0, 1, 2, 3])
 * so client and server grading share the exact same canonical contract.
 */
export function prepareExamForCandidate(exam: Exam): Exam {
  if (!exam.securitySettings.randomizeQuestionsAndOptions) {
    return {
      ...exam,
      questions: exam.questions.map((q) => ({
        ...q,
        options: [...q.options],
        optionIndexMap: q.options.map((_, i) => i),
        canonicalOptions: [...q.options],
        canonicalCorrectAnswer: q.correctAnswer,
      })),
    };
  }

  // 1. Shuffle options within each question (retaining optionIndexMap -> canonical option index)
  const optionShuffledQuestions = exam.questions.map((q) => shuffleQuestionOptions(q));

  // 2. Shuffle question order
  const fullyRandomizedQuestions = shuffleArray(optionShuffledQuestions);

  return {
    ...exam,
    questions: fullyRandomizedQuestions,
  };
}

/**
 * Translates candidate's displayed option selections into canonical option indices
 * so the server grades against the canonical exam with 100% accuracy under any shuffle order.
 */
export function mapDisplayedAnswersToCanonical(
  preparedExam: Exam,
  displayedAnswers: Record<string, number>
): {
  canonicalAnswers: Record<string, number>;
  presentedOptionOrder: Record<string, number[]>;
} {
  const canonicalAnswers: Record<string, number> = {};
  const presentedOptionOrder: Record<string, number[]> = {};

  for (const q of preparedExam.questions) {
    const map = q.optionIndexMap || q.options.map((_, idx) => idx);
    presentedOptionOrder[q.id] = map;

    const selectedDisplayIdx = displayedAnswers[q.id];
    if (typeof selectedDisplayIdx === 'number' && selectedDisplayIdx >= 0 && selectedDisplayIdx < map.length) {
      canonicalAnswers[q.id] = map[selectedDisplayIdx];
    }
  }

  return { canonicalAnswers, presentedOptionOrder };
}

/**
 * Deterministic grading helper that evaluates either canonicalAnswers against canonicalCorrectAnswer
 * or displayed answers against displayed correctAnswer, guaranteeing zero divergence.
 */
export function evaluateQuestionSelection(
  question: ExamQuestion,
  displayedAnswers?: Record<string, number>,
  canonicalAnswers?: Record<string, number>
): {
  isCorrect: boolean;
  selectedOptionText: string | null;
  correctOptionText: string;
} {
  const canonicalOpts = question.canonicalOptions || question.options;
  const canonicalCorrectIdx =
    typeof question.canonicalCorrectAnswer === 'number'
      ? question.canonicalCorrectAnswer
      : question.correctAnswer;

  // Prefer canonical answer verification when available
  if (canonicalAnswers && typeof canonicalAnswers[question.id] === 'number') {
    const chosenCanonicalIdx = canonicalAnswers[question.id];
    return {
      isCorrect: chosenCanonicalIdx === canonicalCorrectIdx,
      selectedOptionText: canonicalOpts[chosenCanonicalIdx] ?? null,
      correctOptionText: canonicalOpts[canonicalCorrectIdx] ?? question.options[question.correctAnswer],
    };
  }

  // Fallback to displayed answer verification
  const chosenDisplayIdx = displayedAnswers?.[question.id];
  if (typeof chosenDisplayIdx === 'number') {
    if (question.optionIndexMap && question.canonicalOptions) {
      const mappedCanonicalIdx = question.optionIndexMap[chosenDisplayIdx];
      return {
        isCorrect: mappedCanonicalIdx === canonicalCorrectIdx,
        selectedOptionText: question.options[chosenDisplayIdx] ?? null,
        correctOptionText: canonicalOpts[canonicalCorrectIdx],
      };
    }
    return {
      isCorrect: chosenDisplayIdx === question.correctAnswer,
      selectedOptionText: question.options[chosenDisplayIdx] ?? null,
      correctOptionText: question.options[question.correctAnswer],
    };
  }

  return {
    isCorrect: false,
    selectedOptionText: null,
    correctOptionText: canonicalOpts[canonicalCorrectIdx] ?? question.options[question.correctAnswer],
  };
}
