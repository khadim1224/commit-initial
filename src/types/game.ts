export interface Player {
  id: string;
  name: string;
  score: number;
  status: 'waiting' | 'selected' | 'blocked' | 'correct' | 'incorrect' | 'qualified' | 'eliminated' | 'winner';
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

export type TournamentStage = 'premiere' | 'huitiemes' | 'demi' | 'finale';

export interface Room {
  code: string;
  host: {
    id: string;
    name: string;
  };
  players: Player[];
  currentQuestion: number;
  gameState: 'waiting' | 'question_displayed' | 'question_active' | 'buzzer_active' | 'answering' | 'results' | 'finished';
  buzzer: {
    active: boolean;
    playerId: string | null;
    timestamp: number | null;
  };
  scores: Record<string, number>;
  questions: Question[];
  stage?: TournamentStage; // nouvelle propriété: manche de la compétition
  // Valeur de la question en cours (+5/+10)
  currentQuestionValue?: number;
  // État du tie-break (candidats, places, compteur, question en cours)
  tieBreak?: {
    isActive: boolean;
    candidates: string[];
    slotsToFill: number;
    askedCount: number;
    maxQuestions: number;
    question?: Question | null;
  };
}

export type UserRole = 'host' | 'player' | 'monitor';

export interface GameState {
  role: UserRole;
  roomCode: string;
  userName: string;
  room: Room | null;
  currentQuestion: Question | null;
  showQuestion: boolean;
  gameStatus: string;
  activeRoomExists?: boolean; // indique si une salle active existe globalement
  timers: {
    buzzer: number;
    answer: number;
  };
}