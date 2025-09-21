export interface Player {
  id: string;
  name: string;
  score: number;
  status: 'waiting' | 'selected' | 'blocked' | 'correct' | 'incorrect';
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

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
}

export type UserRole = 'host' | 'player';

export interface GameState {
  role: UserRole;
  roomCode: string;
  userName: string;
  room: Room | null;
  currentQuestion: Question | null;
  showQuestion: boolean;
  gameStatus: string;
  timers: {
    buzzer: number;
    answer: number;
  };
}