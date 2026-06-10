export interface Organizacao {
  id: string;
  nome: string;
  logo: string;
}

export interface Criterio {
  id: string;
  nome: string;
  peso: number; // ex: 3, 4, 3 (peso total geralmente soma 10)
  descricao: string;
}

export interface Categoria {
  id: string;
  nome: string;
  regras: string;
  criterios: Criterio[];
}

export interface Bateria {
  id: string;
  nome: string;
  descricao: string;
}

export interface Participante {
  id: string;
  nome: string;
  cosplayName?: string;
  origemOrigem?: string; // Anime, Mangá, Jogo, etc.
  musicaVideoUrl?: string;
  musicaNome?: string;
  imagemUrl?: string; // foto do competidor ou referência do personagem
  status: 'espera' | 'apresentando' | 'concluido';
  bateriaId: string;
  categoryId: string;
  ordemAp: number;
}

export interface Jurado {
  id: string;
  nome: string;
  avatar: string;
  especialidade: string;
}

export interface NotaItem {
  criterioId: string;
  valor: number; // 0.0 a 10.0
}

export interface Nota {
  id: string;
  eventoId: string;
  categoryId: string;
  participanteId: string;
  juradoId: string;
  itens: NotaItem[];
  comentario?: string;
  timestamp: string; // ISO string
  dispositivoInfo?: string; // Auditoria info
}

export type ScreenState =
  | 'idle'
  | 'intro'
  | 'calling'
  | 'performing'
  | 'voting_open'
  | 'voting_closed'
  | 'reveal_scores'
  | 'ranking_partial'
  | 'ranking_final'
  | 'podium';

export interface StageState {
  currentEventId: string;
  currentCategoryId: string;
  currentParticipantId: string | null;
  screenState: ScreenState;
  timerCount: number;
  timerActive: boolean;
  scoreRevealIndex: number; // used to reveal individual judge scores step list
}

export interface Evento {
  id: string;
  organizacaoId: string;
  nome: string;
  local: string;
  data: string;
  status: 'preparacao' | 'ativo' | 'encerrado';
  categorias: Categoria[];
  baterias: Bateria[];
  participantes: Participante[];
  jurados: Jurado[];
}

export interface AuditoriaLog {
  id: string;
  timestamp: string;
  usuario: string;
  papel: string;
  acao: string;
  detalhes: string;
}

// Representação de usuário logado na sessão de simulação
export type UserRole =
  | 'super_admin'
  | 'organizador'
  | 'coordenador'
  | 'staff'
  | 'jurado'
  | 'apresentador'
  | 'operador_telao'
  | 'leitor';

export interface UsuarioMock {
  id: string;
  nome: string;
  role: UserRole;
  password?: string;
  refId?: string; // Se for Jurado, armazena o id do Jurado correspondente
}
