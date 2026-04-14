import { QuizQuestion } from './quiz-question.model';

/** Baraja copia del banco y devuelve `count` preguntas distintas al azar. */
export function pickRandomQuestions(bank: QuizQuestion[], count: number): QuizQuestion[] {
  const n = Math.min(Math.max(count, 1), bank.length);
  const copy = [...bank];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
