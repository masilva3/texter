import React from "react";
import { Evento, Categoria, Participante, ScreenState, Nota, StageState } from "../types";
import { Play, Square, Users, Tv, Shield, Volume2, FastForward, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface CoordinatorConsoleProps {
  stageState: StageState;
  events: Evento[];
  scores: Nota[];
  logsCount: number;
  onUpdateStage: (updates: Partial<StageState>) => void;
  onRevealScores: (index: number) => void;
  onResetDatabase: () => void;
  onAutoSubmitScores: (partId: string) => void;
}

export default function CoordinatorConsole({
  stageState,
  events,
  scores,
  logsCount,
  onUpdateStage,
  onRevealScores,
  onResetDatabase,
  onAutoSubmitScores,
}: CoordinatorConsoleProps) {
  const activeEvent = events.find((e) => e.id === stageState.currentEventId);
  const activeCategory = activeEvent?.categorias.find((c) => c.id === stageState.currentCategoryId);
  const activeParticipant = activeEvent?.participantes.find((p) => p.id === stageState.currentParticipantId);

  // Filtra participantes pela categoria ativa
  const catParticipants = activeEvent
    ? activeEvent.participantes.filter((p) => p.categoryId === stageState.currentCategoryId)
    : [];

  const handleScreenStateChange = (state: ScreenState) => {
    const updates: any = { screenState: state };
    if (state === "reveal_scores") {
      updates.scoreRevealIndex = 0; // reset reveal helper
    }
    onUpdateStage(updates);
  };

  const selectParticipant = (partId: string) => {
    onUpdateStage({
      currentParticipantId: partId,
      screenState: "calling", // Quando muda de participante, já coloca em modo "Calling" no telão!
      timerCount: 0,
    });
  };

  const toggleTimer = () => {
    onUpdateStage({ timerActive: !stageState.timerActive });
  };

  const resetTimer = () => {
    onUpdateStage({ timerCount: 0, timerActive: false });
  };

  // Status de votos do participante ativo
  const activePartVotes = activeParticipant
    ? scores.filter((s) => s.participanteId === activeParticipant.id && s.categoryId === activeCategory?.id)
    : [];

  return (
    <div id="coordinator-console" className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 text-slate-100">
      {/* HEADER DO CONSOLE */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded">
              COORDINATOR CONSOLE
            </span>
            <span className="text-xs text-slate-400 font-mono">Real-time Stage Controller</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Painel do Coordenador Geral</h2>
        </div>

        <button
          onClick={onResetDatabase}
          className="px-3 py-1 bg-rose-900/40 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white rounded text-xs font-mono transition-all"
        >
          Resetar Rodada ↺
        </button>
      </div>

      {/* SELECIONAR EVENTO E CATEGORIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">Evento Ativo:</label>
          <select
            className="w-full bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
            value={stageState.currentEventId}
            onChange={(e) => {
              const evt = events.find((ev) => ev.id === e.target.value);
              const firstCatId = evt?.categorias[0]?.id || "";
              const firstPartId = evt?.participantes.filter((p) => p.categoryId === firstCatId)[0]?.id || null;
              onUpdateStage({
                currentEventId: e.target.value,
                currentCategoryId: firstCatId,
                currentParticipantId: firstPartId,
                screenState: "idle",
              });
            }}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">Categoria:</label>
          <select
            className="w-full bg-slate-950 border border-slate-800 text-sm text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
            value={stageState.currentCategoryId}
            onChange={(e) => {
              const firstPartId =
                activeEvent?.participantes.filter((p) => p.categoryId === e.target.value)[0]?.id || null;
              onUpdateStage({
                currentCategoryId: e.target.value,
                currentParticipantId: firstPartId,
                screenState: "idle",
              });
            }}
          >
            {activeEvent?.categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CRONÔMETRO E CONTROLE VELOZ */}
      <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 w-12 h-12 rounded-xl flex items-center justify-center font-mono text-2xl text-amber-400 font-bold">
            {stageState.timerCount}s
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">Cronometragem da Apresentação</h3>
            <p className="text-xs text-slate-500 font-mono">Status: {stageState.timerActive ? "ATIVADO" : "PAUSADO"}</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={toggleTimer}
            className={`flex-1 md:flex-none flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              stageState.timerActive
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-slate-950"
            }`}
          >
            {stageState.timerActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {stageState.timerActive ? "Pausar" : "Iniciar"}
          </button>
          <button
            onClick={resetTimer}
            className="px-3 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs"
          >
            Zerar
          </button>
        </div>
      </div>

      {/* CONTROLE DE ESTADOS DO TELÃO */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Tv className="w-4 h-4 text-amber-500" /> Controlar Telão Principal (Público)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { state: "idle", label: "Standby (Idle)" },
            { state: "intro", label: "Intro Categoria" },
            { state: "calling", label: "Chamado" },
            { state: "performing", label: "No Palco" },
            { state: "voting_open", label: "Abrir Votação" },
            { state: "reveal_scores", label: "Revelar Notas" },
            { state: "ranking_partial", label: "Exibir Ranking" },
            { state: "podium", label: "Pódio Final 🏆" },
          ].map((item) => {
            const isActive = stageState.screenState === item.state;
            return (
              <button
                key={item.state}
                onClick={() => handleScreenStateChange(item.state as ScreenState)}
                className={`px-2.5 py-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                  isActive
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FLUXO PASSO-A-PASSO REVELAÇÃO DE NOTAS DE JURADOS */}
      {stageState.screenState === "reveal_scores" && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-3">
          <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" /> Desfile de Revelação de Notas do Apresentador
          </h4>
          <p className="text-xs text-slate-300">
            Libere as notas de cada jurado individualmente de forma coordenada com a voz do apresentador no microfone:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { idx: 1, label: "Revelar Yuki" },
              { idx: 2, label: "Revelar Maurício" },
              { idx: 3, label: "Revelar Carol" },
              { idx: 4, label: "Revelar Média Geral" },
            ].map((btn) => (
              <button
                key={btn.idx}
                onClick={() => onRevealScores(btn.idx)}
                className={`py-1.5 rounded text-xs font-mono transition-all ${
                  stageState.scoreRevealIndex >= btn.idx
                    ? "bg-emerald-500 text-slate-950 font-bold"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                {btn.label} {stageState.scoreRevealIndex >= btn.idx ? "✓" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FILA DE APRESENTAÇÃO / LISTA DE PARTICIPANTES */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-400" /> Sequência de Palco da Categoria
        </h3>

        <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
          {catParticipants.map((p) => {
            const isCurrent = stageState.currentParticipantId === p.id;
            const partVotes = scores.filter((s) => s.participanteId === p.id && s.categoryId === stageState.currentCategoryId);
            const totalJurados = activeEvent?.jurados.length || 3;
            const votsDone = partVotes.length;

            return (
              <div
                key={p.id}
                className={`flex justify-between items-center p-3 rounded-lg border text-xs transition-all ${
                  isCurrent
                    ? "bg-slate-950 border-amber-500/60 shadow-lg shadow-amber-500/5 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-750"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                      Ordem {p.ordemAp}
                    </span>
                    <span className={`font-bold ${isCurrent ? "text-amber-400" : "text-slate-300"}`}>
                      {p.cosplayName || p.nome}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    Competidor: {p.nome} | Trilha: {p.musicaNome || "Sem Trilha"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-mono text-slate-400 mr-2">
                    Notas: {votsDone} / {totalJurados}
                  </div>

                  {/* Botões rápidos de controle de palco pro participante */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => selectParticipant(p.id)}
                      className={`px-2 py-1 rounded font-semibold text-[10px] uppercase tracking-wider ${
                        isCurrent
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-slate-900 border border-slate-750 hover:bg-slate-850"
                      }`}
                    >
                      Selecionar
                    </button>

                    {isCurrent && votsDone < totalJurados && (
                      <button
                        onClick={() => onAutoSubmitScores(p.id)}
                        className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded font-bold text-[10px] flex items-center gap-1 whitespace-nowrap"
                        title="Simular votos dos 3 jurados automaticamente para testes"
                      >
                        <Sparkles className="w-3 h-3" /> Auto-Julgar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
