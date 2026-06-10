import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScreenState, Evento, Participante, Nota, Categoria } from "../types";
import { Trophy, Music, Clock, Star, Medal, Users, Tv, ShieldAlert, CheckCircle } from "lucide-react";

interface ScreenViewProps {
  stageState: {
    currentEventId: string;
    currentCategoryId: string;
    currentParticipantId: string | null;
    screenState: ScreenState;
    timerCount: number;
    timerActive: boolean;
    scoreRevealIndex: number;
  };
  event: Evento | undefined;
  scores: Nota[];
  activeCategory: Categoria | undefined;
  activeParticipant: Participante | undefined;
}

export default function ScreenView({
  stageState,
  event,
  scores,
  activeCategory,
  activeParticipant,
}: ScreenViewProps) {
  const { screenState, timerCount, scoreRevealIndex } = stageState;

  // Calcula ranking em tempo real para a categoria ativa
  const getRanking = () => {
    if (!event || !activeCategory) return [];

    const categoriaParts = event.participantes.filter(
      (p) => p.categoryId === activeCategory.id
    );

    const ranking = categoriaParts.map((part) => {
      // Filtrar notas recebidas por esse participante nesta categoria
      const partScores = scores.filter(
        (s) => s.participanteId === part.id && s.categoryId === activeCategory.id
      );

      // Calcular média ponderada baseada no peso de cada critério
      let totalPonderado = 0;
      let totalPesos = 0;

      activeCategory.criterios.forEach((crit) => {
        // Encontrar notas de todos os jurados para esse critério
        const notasCriterio = partScores.flatMap((s) =>
          s.itens.filter((item) => item.criterioId === crit.id)
        );

        if (notasCriterio.length > 0) {
          const somaNotas = notasCriterio.reduce((acc, curr) => acc + curr.valor, 0);
          const mediaCriterio = somaNotas / notasCriterio.length;

          totalPonderado += mediaCriterio * crit.peso;
          totalPesos += crit.peso;
        }
      });

      const mediaFinal = totalPesos > 0 ? totalPonderado / totalPesos : 0;

      return {
        participante: part,
        mediaFinal: parseFloat(mediaFinal.toFixed(2)),
        votosCount: partScores.length,
      };
    });

    // Ordenar por nota final decrescente
    return ranking.sort((a, b) => b.mediaFinal - a.mediaFinal);
  };

  const ranking = getRanking();
  const topTres = ranking.slice(0, 3);

  // Notas para o participante atual
  const activeParticipantScores = activeParticipant
    ? scores.filter(
        (s) =>
          s.participanteId === activeParticipant.id &&
          s.categoryId === activeCategory?.id
      )
    : [];

  // Formata o tempo (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      id="screen-view-container"
      className="relative w-full h-full bg-slate-950 text-white overflow-hidden flex flex-col justify-between border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 select-none"
      style={{
        backgroundImage: "radial-gradient(circle at 50% 30%, #1e1b4b 0%, #020617 80%)",
      }}
    >
      {/* Grid de fundo sutil para aspecto tech */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* HEADER DO TELÃO */}
      <div className="relative z-10 flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-lg text-slate-950 shadow-lg shadow-rose-500/20">
            SS
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-slate-300 uppercase">
              {event?.nome || "SENPAI SCORE LIVE"}
            </h1>
            <p className="text-xs font-mono text-amber-400">
              {activeCategory?.nome || "Categoria Não Selecionada"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="font-mono text-xs text-emerald-400 tracking-widest uppercase">
            TELÃO ATIVO • {screenState.toUpperCase()}
          </div>
        </div>
      </div>

      {/* CONTEÚDO DINÂMICO CONFORME ESTADO */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center py-6">
        <AnimatePresence mode="wait">
          {/* ESTADO IDLE */}
          {screenState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center p-4 shadow-xl">
                <Tv className="w-12 h-12 text-slate-400 animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Aguardando Operação de Palco
              </h2>
              <p className="max-w-md text-sm text-slate-400 mx-auto">
                O sistema de projeção está ativado e pronto. A produção de palco iniciará a próxima bateria em instantes.
              </p>
            </motion.div>
          )}

          {/* ESTADO INTRO - INFORMAÇÃO DA CATEGORIA */}
          {screenState === "intro" && activeCategory && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-3xl space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full">
                  Categoria Iniciada
                </span>
                <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow">
                  {activeCategory.nome}
                </h2>
              </div>

              <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 backdrop-blur-md space-y-4">
                <p className="text-slate-300 text-sm leading-relaxed text-center italic">
                  &ldquo;{activeCategory.regras}&rdquo;
                </p>

                <div className="pt-4 border-t border-white/5 space-y-3">
                  <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest text-center">
                    Critérios de Julgamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {activeCategory.criterios.map((crit) => (
                      <div
                        key={crit.id}
                        className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-center"
                      >
                        <div className="text-lg font-bold text-amber-400">
                          Peso {crit.peso}x
                        </div>
                        <div className="font-semibold text-xs text-white truncate">
                          {crit.nome}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {crit.descricao}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ESTADO CALLING - CHAMADA DE PARTICIPANTE */}
          {screenState === "calling" && activeParticipant && (
            <motion.div
              key="calling"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
            >
              {/* Card Esquerdo: Imagem */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-72 h-80 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-xl shadow-amber-500/5 group">
                  <img
                    src={activeParticipant.imagemUrl}
                    alt={activeParticipant.nome}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-700 font-mono text-xs text-amber-400 px-2.5 py-1 rounded-md">
                    #ORDEM {activeParticipant.ordemAp}
                  </div>
                </div>
              </div>

              {/* Lado Direito: Identidade */}
              <div className="md:col-span-7 space-y-6 text-center md:text-left">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-xs font-semibold tracking-wider font-mono uppercase">
                    <Star className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    Subindo ao Palco
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-white line-clamp-2">
                    {activeParticipant.cosplayName || activeParticipant.nome}
                  </h2>
                  {activeParticipant.cosplayName && (
                    <p className="text-slate-400 text-lg font-mono">
                      Competidor(a): {activeParticipant.nome}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {activeParticipant.origemOrigem && (
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                      <span className="block text-[10px] text-slate-500 uppercase tracking-widest">
                        Origem / Franquia
                      </span>
                      <span className="font-bold text-slate-200">
                        {activeParticipant.origemOrigem}
                      </span>
                    </div>
                  )}
                  {activeParticipant.musicaNome && (
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl col-span-1">
                      <span className="block text-[10px] text-slate-500 uppercase tracking-widest">
                        Trilha / Áudio
                      </span>
                      <span className="font-bold text-slate-200 truncate block">
                        {activeParticipant.musicaNome}
                      </span>
                    </div>
                  )}
                </div>

                <div className="animate-bounce inline-flex items-center gap-2 text-sm text-amber-400 font-semibold font-mono">
                  PREPARE-SE PARA A APRESENTAÇÃO...
                </div>
              </div>
            </motion.div>
          )}

          {/* ESTADO PERFORMING - PERFORMANCE ATIVA */}
          {screenState === "performing" && activeParticipant && (
            <motion.div
              key="performing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center space-y-6"
            >
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Lado Esquerdo - Info e Visualizer */}
                <div className="lg:col-span-8 flex flex-col md:flex-row gap-6 items-center bg-slate-900/50 p-6 border border-white/5 rounded-2xl">
                  <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-700 shadow-inner flex-shrink-0">
                    <img
                      src={activeParticipant.imagemUrl}
                      alt={activeParticipant.nome}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center md:text-left flex-1 space-y-1">
                    <span className="text-xs font-mono font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      Performance em Andamento
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight text-white">
                      {activeParticipant.cosplayName || activeParticipant.nome}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Ordem: #{activeParticipant.ordemAp} | Origem: {activeParticipant.origemOrigem || "Geral"}
                    </p>
                    {activeParticipant.musicaNome && (
                      <div className="flex items-center gap-1 justify-center md:justify-start text-xs text-rose-400 mt-1">
                        <Music className="w-3.5 h-3.5" />
                        <span className="truncate max-w-xs">{activeParticipant.musicaNome}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lado Direito - Cronômetro de Palco Gigante */}
                <div className="lg:col-span-4 bg-slate-900/80 border border-slate-700/60 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg min-h-[160px]">
                  <Clock className="w-6 h-6 text-amber-500 mb-1 animate-pulse" />
                  <div className="font-mono text-5xl font-extrabold tracking-widest text-amber-400 drop-shadow">
                    {formatTime(timerCount)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1">
                    Cronômetro Geral de Palco
                  </div>
                </div>
              </div>

              {/* Visualizer simulado de áudio */}
              <div className="w-full h-3 bg-slate-950 border border-slate-800 rounded-full overflow-hidden flex items-center px-1">
                <div className="flex items-center gap-1.5 w-full h-full py-0.5 justify-around">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const animationDelay = `${(i * 0.08).toFixed(2)}s`;
                    const scaleFactor = Math.floor(Math.random() * 3) + 1; // 1 to 3
                    return (
                      <span
                        key={i}
                        className="w-1 h-full bg-gradient-to-t from-rose-500 via-amber-400 to-rose-400 rounded-full"
                        style={{
                          animationName: "pulse",
                          animationDuration: `${0.4 + Math.random() * 0.4}s`,
                          animationTimingFunction: "ease-in-out",
                          animationDelay,
                          animationIterationCount: "infinite",
                          animationDirection: "alternate",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ESTADO VOTING_OPEN */}
          {screenState === "voting_open" && activeParticipant && (
            <motion.div
              key="voting_open"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6 max-w-xl"
            >
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 relative">
                <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold tracking-tight text-white uppercase">
                  Votação Aberta!
                </h2>
                <p className="text-slate-300 font-medium">
                  Apresentação concluída para: <span className="text-amber-400 font-semibold">{activeParticipant.cosplayName || activeParticipant.nome}</span>.
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Os jurados Yuki Chan, Maurício Sato e Carol Kim já podem acessar seus terminais móveis e enviar suas avaliações técnicas.
                </p>
              </div>

              {/* Status de recebimento das notas */}
              <div className="border border-white/5 bg-slate-900/60 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center block">
                  Status de Submissão dos Jurados
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {event?.jurados.map((jur) => {
                    const jaVotou = activeParticipantScores.some((s) => s.juradoId === jur.id);
                    return (
                      <div
                        key={jur.id}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          jaVotou
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-slate-950 border-slate-800 text-slate-500 animate-pulse"
                        }`}
                      >
                        <div className="text-xs font-bold block">{jur.nome}</div>
                        <span className="text-[9px] font-mono block">
                          {jaVotou ? "SALVO ✓" : "AGUARDANDO..."}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ESTADO REVEAL_SCORES - REVELAÇÃO NOTISTA PASSO A PASSO */}
          {screenState === "reveal_scores" && activeParticipant && (
            <motion.div
              key="reveal_scores"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-4xl space-y-6"
            >
              <div className="text-center space-y-1">
                <span className="text-xs font-mono tracking-widest text-rose-500 uppercase">
                  Resultado de Palco
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  Revelação de Notas Individuais
                </h2>
                <p className="text-slate-400 text-sm">
                  Competidor: <span className="text-white font-medium">{activeParticipant.cosplayName || activeParticipant.nome}</span>
                </p>
              </div>

              {/* Grid de Julgamento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {event?.jurados.map((jur, idx) => {
                  const jurScoreObj = activeParticipantScores.find((s) => s.juradoId === jur.id);
                  const isRevealed = scoreRevealIndex > idx;

                  // Calcula média simples do jurado para mostrar na bolha
                  const jurMedia = jurScoreObj
                    ? jurScoreObj.itens.reduce((acc, c) => acc + c.valor, 0) /
                      jurScoreObj.itens.length
                    : 0;

                  return (
                    <div
                      key={jur.id}
                      className={`relative bg-slate-900 border overflow-hidden p-5 rounded-2xl flex flex-col justify-between min-h-[220px] transition-all duration-500 ${
                        isRevealed
                          ? "border-amber-500/40 shadow-lg shadow-amber-500/5 bg-[radial-gradient(circle_at_to_p,rgb(217,119,6,0.05))] "
                          : "border-slate-800 opacity-60 filter blur-[0.5px]"
                      }`}
                    >
                      {/* Avatar e Nome do Jurado */}
                      <div className="flex items-center gap-3">
                        <img
                          src={jur.avatar}
                          alt={jur.nome}
                          className="w-10 h-10 rounded-full border border-slate-700 bg-slate-950"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-slate-200">{jur.nome}</h4>
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {jur.especialidade}
                          </span>
                        </div>
                      </div>

                      {/* Nota e Critérios */}
                      <div className="my-4 flex-1 flex flex-col justify-center">
                        {isRevealed ? (
                          jurScoreObj ? (
                            <div className="space-y-1.5 font-mono">
                              {jurScoreObj.itens.map((item) => {
                                const critNome =
                                  activeCategory?.criterios.find((c) => c.id === item.criterioId)
                                    ?.nome || "Critério";
                                return (
                                  <div
                                    key={item.criterioId}
                                    className="flex justify-between items-center text-xs text-slate-300"
                                  >
                                    <span className="truncate max-w-[120px]">{critNome}:</span>
                                    <span className="font-bold text-amber-400">{item.valor.toFixed(1)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center text-xs text-rose-400 font-mono italic">
                              Ausência de Notas
                            </div>
                          )
                        ) : (
                          <div className="text-center text-xs font-mono tracking-widest text-slate-500 uppercase animate-pulse">
                            [ AGUARDANDO LIBERAÇÃO ]
                          </div>
                        )}
                      </div>

                      {/* Nota Final Grande */}
                      <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-400">NOTAMÉDIA:</span>
                        <span className="font-mono text-2xl font-bold text-white">
                          {isRevealed ? (jurScoreObj ? jurMedia.toFixed(2) : "0.00") : "?,??"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reveal da Média Final Geral Ponderada (só mostra se revealIndex >= 4) */}
              <div className="mt-8 flex justify-center">
                {scoreRevealIndex >= 4 ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-amber-600 to-rose-600 p-[1px] rounded-3xl overflow-hidden shadow-2xl"
                  >
                    <div className="bg-slate-950 px-12 py-5 rounded-3xl flex flex-col items-center">
                      <div className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                        PONTUAÇÃO GERAL (MÉDIA PONDERADA)
                      </div>
                      <div className="text-5xl font-mono font-extrabold text-white mt-1 drop-shadow-md">
                        {(() => {
                          const itemPart = ranking.find(
                            (r) => r.participante.id === activeParticipant.id
                          );
                          return itemPart ? itemPart.mediaFinal.toFixed(2) : "0.00";
                        })()}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-1 font-mono">
                        <CheckCircle className="w-3 h-3" /> NOTA AUDITADA E SALVA NO SISTEMA CRON
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <button className="px-6 py-2.5 bg-slate-900 border border-slate-700/60 text-slate-400 text-xs font-mono uppercase tracking-widest rounded-xl">
                    Aguardando Revelação da Média Geral pelo Coordenador
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ESTADO RANKING_PARTIAL - RANKING ATIVO DA CATEGORIA */}
          {screenState === "ranking_partial" && (
            <motion.div
              key="ranking_partial"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-4xl space-y-6"
            >
              <div className="text-center space-y-1">
                <Trophy className="w-8 h-8 text-amber-500 mx-auto" />
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  Tabela Parcial de Classificação
                </h2>
                <p className="text-xs font-mono text-slate-400 uppercase">
                  Concurso Categoria: {activeCategory?.nome}
                </p>
              </div>

              {/* Tabela de Ranking */}
              <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                <div className="grid grid-cols-12 bg-slate-950 border-b border-slate-800 p-4 font-mono text-xs uppercase text-slate-400 tracking-wider">
                  <div className="col-span-2 text-center">Posição</div>
                  <div className="col-span-6">Competidor / Cosplay</div>
                  <div className="col-span-2 text-center">Jurados Votantes</div>
                  <div className="col-span-2 text-right">Nota Média</div>
                </div>

                <div className="divide-y divide-slate-800">
                  {ranking.length > 0 ? (
                    ranking.map((row, index) => {
                      const medalColor =
                        index === 0
                          ? "text-amber-400"
                          : index === 1
                          ? "text-slate-300"
                          : index === 2
                          ? "text-amber-700"
                          : "text-slate-500";
                      return (
                        <div
                          key={row.participante.id}
                          className={`grid grid-cols-12 items-center p-4 text-sm transition-all duration-300 hover:bg-slate-800/40 ${
                            index < 3 ? "bg-white/[0.01]" : ""
                          }`}
                        >
                          {/* Posição */}
                          <div className="col-span-2 flex justify-center items-center font-mono">
                            {index < 3 ? (
                              <Medal className={`w-6 h-6 ${medalColor}`} />
                            ) : (
                              <span className="font-bold text-slate-400">#{index + 1}</span>
                            )}
                          </div>

                          {/* Competidor */}
                          <div className="col-span-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                              <img
                                src={row.participante.imagemUrl}
                                alt={row.participante.nome}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-white leading-tight">
                                {row.participante.cosplayName || row.participante.nome}
                              </p>
                              <p className="text-xs text-slate-400 truncate">
                                {row.participante.cosplayName ? `por ${row.participante.nome}` : row.participante.origemOrigem}
                              </p>
                            </div>
                          </div>

                          {/* Jurados */}
                          <div className="col-span-2 text-center font-mono text-slate-300">
                            {row.votosCount} / {event?.jurados.length || 3}
                          </div>

                          {/* Nota */}
                          <div className="col-span-2 text-right font-mono text-lg font-bold text-amber-400">
                            {row.mediaFinal > 0 ? row.mediaFinal.toFixed(2) : "0.00"}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-500 uppercase font-mono tracking-widest">
                      Nenhum participante avaliado nesta categoria
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ESTADO PODIUM / RANKING FINAL */}
          {screenState === "podium" && (
            <motion.div
              key="podium"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full max-w-4xl space-y-12"
            >
              <div className="text-center space-y-2">
                <Medal className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500 uppercase tracking-tight">
                  Cerimônia de Premiação Final!
                </h2>
                <p className="text-sm font-mono text-slate-300">
                  CLASSIFICAÇÃO CONSAGRADA DA CATEGORIA: <span className="text-amber-400">{activeCategory?.nome}</span>
                </p>
              </div>

              {/* Pódio de 3 lugares */}
              <div className="flex flex-col md:flex-row justify-center items-end gap-6 pt-12">
                {/* 2º lugar */}
                {topTres[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center w-full md:w-64"
                  >
                    <div className="relative group mb-3">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-300 bg-slate-900 shadow-xl">
                        <img
                          src={topTres[1].participante.imagemUrl}
                          alt={topTres[1].participante.nome}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-1 bg-slate-300 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono text-sm border-2 border-slate-950">
                        2
                      </div>
                    </div>
                    <div className="text-center bg-slate-900/80 border border-slate-800 p-4 rounded-t-xl w-full h-32 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-100 line-clamp-1 text-sm">
                          {topTres[1].participante.cosplayName || topTres[1].participante.nome}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {topTres[1].participante.nome}
                        </p>
                      </div>
                      <div className="border-t border-slate-800 pt-2">
                        <div className="text-xs font-mono text-slate-400">NOTA TOTAL</div>
                        <div className="text-lg font-mono font-bold text-slate-200">
                          {topTres[1].mediaFinal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 1º lugar (Centro, maior) */}
                {topTres[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center w-full md:w-72"
                  >
                    <div className="relative group mb-4">
                      {/* Coroa/Brilho do vencedor */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <Trophy className="w-8 h-8 text-amber-400 animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                      </div>
                      <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-amber-400 bg-slate-900 shadow-2xl shadow-amber-400/15">
                        <img
                          src={topTres[0].participante.imagemUrl}
                          alt={topTres[0].participante.nome}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-1 bg-amber-400 text-slate-950 w-8 h-8 rounded-full flex items-center justify-center font-black font-mono text-base border-2 border-slate-950">
                        1
                      </div>
                    </div>
                    <div className="text-center bg-slate-900 border-2 border-amber-500/40 p-5 rounded-t-2xl w-full h-36 flex flex-col justify-between shadow-lg shadow-amber-500/5">
                      <div>
                        <h4 className="font-extrabold text-amber-400 line-clamp-1 text-base">
                          {topTres[0].participante.cosplayName || topTres[0].participante.nome}
                        </h4>
                        <p className="text-xs text-slate-300 truncate">
                          {topTres[0].participante.nome}
                        </p>
                      </div>
                      <div className="border-t border-slate-800/80 pt-2">
                        <div className="text-xs font-mono text-amber-500 font-semibold uppercase">CAMPEÃO ★ SCORE</div>
                        <div className="text-2xl font-mono font-black text-white">
                          {topTres[0].mediaFinal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3º lugar */}
                {topTres[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col items-center w-full md:w-64"
                  >
                    <div className="relative group mb-3">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-700 bg-slate-900 shadow-xl">
                        <img
                          src={topTres[2].participante.imagemUrl}
                          alt={topTres[2].participante.nome}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-1 bg-amber-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold font-mono text-sm border-2 border-slate-950">
                        3
                      </div>
                    </div>
                    <div className="text-center bg-slate-900/80 border border-slate-800 p-4 rounded-t-xl w-full h-32 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-100 line-clamp-1 text-sm">
                          {topTres[2].participante.cosplayName || topTres[2].participante.nome}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {topTres[2].participante.nome}
                        </p>
                      </div>
                      <div className="border-t border-slate-800 pt-2">
                        <div className="text-xs font-mono text-slate-400">NOTA TOTAL</div>
                        <div className="text-lg font-mono font-bold text-slate-300">
                          {topTres[2].mediaFinal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER DO TELÃO */}
      <div className="relative z-10 border-t border-white/10 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-mono">
        <div>
          LOCAÇÃO: {event?.local || "Centro de Eventos"} | DATA: {event?.data || "Julho, 2026"}
        </div>
        <div className="flex items-center gap-1.5 mt-2 sm:mt-0 text-amber-500">
          <Trophy className="w-3.5 h-3.5" />
          <span>SENPAI SCORE • SISTEMA DIGITAL DE PALCO REAL-TIME</span>
        </div>
      </div>

      {/* CSS Keyframes inline simples para o visualizador de áudio */}
      <style>{`
        @keyframes pulse {
          0% {
            height: 15%;
          }
          100% {
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
}
