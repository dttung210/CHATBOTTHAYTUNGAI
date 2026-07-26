export type SupportMode = "HINT" | "STEP" | "FULL" | "GEOGEBRA";
export type KnowledgeLevel = "BASIC" | "ADVANCED";

export interface Student {
  username: string;
  hoTen: string;
  lopDuocPhep: number;
  mucDoMacDinh: KnowledgeLevel;
  mucDoToiDa: KnowledgeLevel;
  trangThai: "ACTIVE" | "LOCKED" | "EXPIRED";
  sessionToken?: string;
}

export interface HintItem {
  number: number;
  title: string;
  goal: string;
  question: string;
  knowledgeReminder?: string;
}

export interface StepItem {
  stepNumber: number;
  title: string;
  learningGoal: string;
  stepSolution: string;
  question: string;
  acceptedForms?: string[];
}

export interface StepData {
  stepId: string;
  stepNumber: number;
  totalSteps?: number;
  title: string;
  learningGoal: string;
  instruction: string;
  stepSolution?: string;
  question: string;
  expectedAnswerType: "TEXT" | "NUMBER" | "EXPRESSION";
  acceptedForms: string[];
  feedback?: string;
  status: "WAITING_FOR_STUDENT" | "CORRECT" | "INCORRECT" | "PAUSED";
  allSteps?: StepItem[];
}

export interface SolutionBlock {
  type: "TEXT" | "MATH" | "ALIGN" | "CONCLUSION";
  content: string;
}

export interface GeometryPoint {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GeometryData {
  figureType: string;
  needsTikz: boolean;
  geometryJson?: {
    figureType?: string;
    points?: GeometryPoint[];
    segments?: { from: string; to: string; style?: string }[];
    circles?: any[];
    functions?: string[];
  };
  tikzCode?: string;
  figureDescription?: string;
  accessibilityDescription?: string;
}

export interface SimilarExerciseData {
  exerciseId: string;
  parentProblemId: string;
  statementText: string;
  statementLatex: string;
  answerRevealed?: boolean;
  answerText?: string;
  answerLatex?: string;
  answerType?: string;
  isLoadingAnswer?: boolean;
  error?: string;
}

export interface SessionMemoryState {
  version: string;
  sessionId: string;
  username: string;
  status: "ACTIVE" | "PAUSED" | "ENDED";
  startedAt: string;
  lastActiveAt: string;
  currentMode: SupportMode;
  activeProblemId: string;
  activeExerciseId?: string;
  conversationId?: string;
  currentTopic?: string;
  currentGrade: number;
  knowledgeLevel: KnowledgeLevel;
  confirmedProblemFacts: string[];
  understoodConcepts: string[];
  misconceptions: string[];
  repeatedErrors: string[];
  hintsAlreadyShown: string[];
  completedSteps: string[];
  unresolvedQuestions: string[];
  generatedExerciseIds: string[];
  revealedAnswerIds: string[];
  activeGeoGebraDrawingId?: string;
  sessionSummary: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: "student" | "thay_tung";
  timestamp: string;
  text?: string;
  imageUrl?: string;
  confirmedProblemText?: string;
  mode?: SupportMode;
  responseTitle?: string;
  hints?: HintItem[];
  activeHintIndex?: number;
  step?: StepData;
  solutionBlocks?: SolutionBlock[];
  geometry?: GeometryData;
  similarExercise?: SimilarExerciseData;
  curriculumGuard?: {
    studentGrade: number;
    knowledgeLevel: KnowledgeLevel;
    methodUsed?: string;
    allowed: boolean;
    violationReason?: string;
  };
  helpfulRating?: "HELPFUL" | "UNHELPFUL";
}

export interface HistoryRecord {
  historyId: string;
  timestamp: string;
  username: string;
  lopHoc: number;
  cheDo: SupportMode;
  cauHoiGoc: string;
  deBaiLatex: string;
  resultStatus: string;
}
