export type StepKind = 'content' | 'quiz' | 'code';

export type Choice = {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
};

export type BaseStep = {
  id: string;
  type: StepKind;
  title: string;
};

export type ContentStep = BaseStep & {
  type: 'content';
  body: string;
  analogy?: string;
  code?: string;
};

export type QuizStep = BaseStep & {
  type: 'quiz';
  question: string;
  choices: Choice[];
};

export type CodeStep = BaseStep & {
  type: 'code';
  prompt: string;
  code: string;
  choices: Choice[];
};

export type LessonStep = ContentStep | QuizStep | CodeStep;

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  topicId: string;
  difficulty: 'iniciante' | 'intermediario';
  xp: number;
  estimatedMinutes: number;
  steps: LessonStep[];
};

export type Topic = {
  id: string;
  title: string;
  description: string;
  color: string;
  emoji: string;
  lessonIds: string[];
};
