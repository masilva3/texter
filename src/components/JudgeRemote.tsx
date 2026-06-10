import React, { useState, useEffect } from "react";
import { Evento, Categoria, Participante, Jurado, Nota } from "../types";
import { Star, ShieldAlert, CheckCircle, Info, Edit3, Send, Laptop, RefreshCw } from "lucide-react";

interface JudgeRemoteProps {
  stageState: {
    currentEventId: string;
    currentCategoryId: string;
    currentParticipantId: string | null;
    screenState: string;
  };
  events: Evento[];
  scores: Nota[];
  onSubmitScore: (scoreData: {
    eventoId: string;
    categoryId: string;
    participanteId: string;
    juradoId: string;
    itens: { criterioId: string; valor: number }[];
    comentario: string;
    dispositivoInfo: string;
  }) => void;
}

export default function JudgeRemote({
  stageState,
  events,
  scores,
  onSubmitScore,
}: JudgeRemoteProps) {
  const activeEvent = events.find((e) => e.id === stageState.currentEventId);
  const activeCategory = activeEvent?.categorias.find((c) => c.id === stageState.currentCategoryId);
  const activeParticipant = activeEvent?.participantes.find((p) => p.id === stageState.currentParticipantId);

  // Armazena o ID do jurado atualmente simulado
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>("jur_1");
  const currentJudge = activeEvent?.jurados.find((j) => j.id === selectedJudgeId);

  // Dicionário de notas locais (criterioId -> valor)
  const [notasLocais, setNotasLocais] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);

  // Inicializa notas locais quando muda o participante, categoria ou jurado
  useEffect(() => {
    if (activeCategory) {
      const defaultNotes: Record<string, number> = {};
      activeCategory.criterios.forEach((crit) => {
        // Se este jurado já votou neste participante, recupera a nota cadastrada do banco do servidor!
        const notaExistenteObj = scores.find(
          (s) =>
            s.participanteId === activeParticipant?.id &&
            s.juradoId === selectedJudgeId &&
            s.categoryId === activeCategory.id
        );

        if (notaExistenteObj) {
          const itemNota = notaExistenteObj.itens.find((it) => it.criterioId === crit.id);
          defaultNotes[crit.id] = itemNota ? itemNota.valor : 8.5; // default 8.5
        } else {
          defaultNotes[crit.id] = 8.5; // default 8.5
        }
      });
      setNotasLocais(defaultNotes);

      // Recuperar comentário prévio se houver
      const scoreExistente = scores.find(
        (s) =>
          s.participanteId === activeParticipant?.id &&
          s.juradoId === selectedJudgeId &&
          s.categoryId === activeCategory.id
      );
      setComentario(scoreExistente?.comentario || "");

      // Verifica se o jurado já enviou o voto
      setIsDone(!!scoreExistente);
    }
  }, [activeParticipant?.id, selectedJudgeId, activeCategory?.id, scores]);

  const handleSliderChange = (critId: string, val: number) => {
    setNotasLocais((prev) => ({
      ...prev,
      [critId]: val,
    }));
  };

  const handleQuickScoreSet = (scoreValue: number) => {
    if (!activeCategory) return;
    const notes: Record<string, number> = {};
    activeCategory.criterios.forEach((crit) => {
      notes[crit.id] = scoreValue;
    });
    setNotasLocais(notes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeParticipant || !currentJudge || !activeCategory) return;

    setLoading(true);

    // Mapear notas locais pro formato da API
    const itens = Object.entries(notasLocais).map(([criterioId, valor]) => ({
      criterioId,
      valor: valor as number,
    }));

    // Simula atraso na rede
    setTimeout(() => {
      onSubmitScore({
        eventoId: stageState.currentEventId,
        categoryId: stageState.currentCategoryId,
        participanteId: activeParticipant.id,
        juradoId: currentJudge.id,
        itens,
        comentario,
        dispositivoInfo: `${currentJudge.nome} Terminal (${navigator.userAgent.slice(0, 20)}...)`,
      });
      setLoading(false);
      setIsDone(true);
    }, 600);
  };

  return (
    <div id="judge-remote" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 space-y-5">
      {/* SELECIONAR JURADO LOGADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-blue-400">JURADOS WEB CONSOLE</span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">Terminal de Avaliação</h3>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400">Atuar como:</label>
          <select
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 py-1.5 rounded focus:outline-none focus:border-blue-500"
            value={selectedJudgeId}
            onChange={(e) => setSelectedJudgeId(e.target.value)}
          >
            {activeEvent?.jurados.map((jur) => (
              <option key={jur.id} value={jur.id}>
                {jur.nome} ({jur.especialidade.split("&")[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CARD DO JURADO ATIVO */}
      {currentJudge && (
        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg flex items-center gap-3">
          <img
            src={currentJudge.avatar}
            alt={currentJudge.nome}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700"
          />
          <div className="truncate">
            <div className="font-bold text-xs text-slate-200">{currentJudge.nome}</div>
            <div className="text-[10px] text-slate-400 truncate">{currentJudge.especialidade}</div>
          </div>
        </div>
      )}

      {/* ESTADO DO PALCO PARA O JURADO */}
      {!activeParticipant ? (
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl text-center space-y-2">
          <Info className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="font-bold text-slate-300">Nenhum Competidor Ativo</h4>
          <p className="text-xs text-slate-500">Aguardando o Coordenador iniciar o participante no painel de palco.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card do Competidor Ativo */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
              <img
                src={activeParticipant.imagemUrl}
                alt={activeParticipant.nome}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                EM AVALIAÇÃO
              </span>
              <h4 className="font-bold text-white text-sm mt-1">
                {activeParticipant.cosplayName || activeParticipant.nome}
              </h4>
              <p className="text-xs text-slate-400">
                {activeParticipant.cosplayName ? `Competidor: ${activeParticipant.nome}` : activeParticipant.origemOrigem}
              </p>
            </div>
          </div>

          {/* STATUS DE NOTA ENVIADA */}
          {isDone ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl text-center space-y-3">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <div>
                <h4 className="font-bold text-emerald-300 text-sm">Nota Registrada com Sucesso!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Sua avaliação técnica e notas de critério foram salvas e criptografadas no servidor de auditoria.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsDone(false)}
                  className="px-3 py-1 bg-slate-900 border border-slate-750 hover:bg-slate-800 text-slate-300 rounded text-xs font-mono flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Alterar Notas
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-950/30 px-1 py-0.5 border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono text-slate-400 uppercase">Notas por Critério</span>
                  {/* Atalho de preenchimento rápido */}
                  <div className="flex gap-1">
                    {[7.5, 8.5, 9.5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickScoreSet(val)}
                        className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-white rounded"
                      >
                        Set {val.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {activeCategory?.criterios.map((crit) => {
                  const val = notasLocais[crit.id] || 8.5;
                  return (
                    <div key={crit.id} className="bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-slate-300 block">
                            {crit.nome} (Peso x{crit.peso})
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {crit.descricao}
                          </span>
                        </div>
                        <span className="font-mono text-sm font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                          {val.toFixed(1)}
                        </span>
                      </div>

                      {/* Controle deslizante personalizado */}
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        value={val}
                        onChange={(e) => handleSliderChange(crit.id, parseFloat(e.target.value))}
                      />
                    </div>
                  );
                })}
              </div>

              {/* COMENTÁRIOS E FEEDBACK */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" /> Feedback Técnico e Observações (Opcional):
                </label>
                <textarea
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 min-h-[60px]"
                  placeholder="Ex: Detalhe das pernas e pintura impecáveis, mas faltou sincronia labial no final do áudio..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
              </div>

              {/* AUDIT STRING */}
              <div className="flex gap-1 items-center text-[10px] text-slate-500 font-mono">
                <Laptop className="w-3 h-3 text-slate-600" />
                <span>Rastreabilidade: Terminal de Sincronização Segura</span>
              </div>

              {/* BOTÃO SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10"
              >
                {loading ? <Star className="w-4 h-4 animate-spin text-white" /> : <Send className="w-3.5 h-3.5" />}
                {loading ? "Salvando Nota..." : "Enviar Avaliação ao Painel"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
