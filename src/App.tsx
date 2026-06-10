import React, { useState, useEffect } from "react";
import { Evento, StageState, Nota, AuditoriaLog, ScreenState } from "./types";
import ScreenView from "./components/ScreenView";
import CoordinatorConsole from "./components/CoordinatorConsole";
import JudgeRemote from "./components/JudgeRemote";
import AdminPanel from "./components/AdminPanel";
import PresenterScript from "./components/PresenterScript";
import { Tv, Shield, Users, Mic, Layers, HelpCircle, Trophy, RefreshCw, Star, Play } from "lucide-react";

export default function App() {
  // Estados principais sincronizados do Servidor Express
  const [events, setEvents] = useState<Evento[]>([]);
  const [scores, setScores] = useState<Nota[]>([]);
  const [stageState, setStageState] = useState<StageState>({
    currentEventId: "",
    currentCategoryId: "",
    currentParticipantId: null,
    screenState: "idle",
    timerCount: 0,
    timerActive: false,
    scoreRevealIndex: 0,
  });
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modo ativo de exibição na tela do simulador
  // 'split' = split screen (O Telão do lado esquerdo + Controles do lado direito) - MELHOR PARA TESTES!
  // 'screen' = apenas o telão do público
  // 'coordinator' = mesa de controle do coordenador
  // 'judge' = remote para jurados
  // 'admin' = configurações e logs
  const [viewPerspective, setViewPerspective] = useState<"split" | "screen" | "coordinator" | "judge" | "admin">("split");

  // Busca o estado geral do servidor
  const fetchBackendState = async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error("Erro na rede ao obter estado do servidor.");
      const data = await res.json();
      setEvents(data.events || []);
      setScores(data.scores || []);
      setStageState(data.stage || {
        currentEventId: "",
        currentCategoryId: "",
        currentParticipantId: null,
        screenState: "idle",
        timerCount: 0,
        timerActive: false,
        scoreRevealIndex: 0,
      });
      setLogs(data.logs || []);
      setFetchError(null);
    } catch (err: any) {
      console.error("[Senpai Score] Falha ao sincronizar:", err);
      setFetchError("Incapaz de conectar ao servidor do palco local. Verifique os logs.");
    }
  };

  // Poll de alta frequência do servidor para manter tudo em perfeito sync em tempo real
  useEffect(() => {
    fetchBackendState();
    const interval = setInterval(fetchBackendState, 1500);
    return () => clearInterval(interval);
  }, []);

  // Timer Tick local em React para evitar lag de rede, sincronizando o tick com o servidor se ativo
  useEffect(() => {
    let tInterval: any;
    if (stageState.timerActive) {
      tInterval = setInterval(() => {
        // Incrementa o contador localmente e envia o update silenciosamente
        const nextCount = stageState.timerCount + 1;
        setStageState((prev) => ({ ...prev, timerCount: nextCount }));
        
        // Dispara para o servidor continuar no cronômetro oficial
        fetch("/api/state/update-stage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timerCount: nextCount }),
        });
      }, 1000);
    }
    return () => clearInterval(tInterval);
  }, [stageState.timerActive, stageState.timerCount]);

  // Atualizar Estado do Palco (Geral)
  const handleUpdateStage = async (updates: Partial<StageState>) => {
    try {
      // Otimistic local update
      setStageState((prev) => ({ ...prev, ...updates }));

      const res = await fetch("/api/state/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Erro ao despachar atualização de palco.");
      const data = await res.json();
      if (data.stage) setStageState(data.stage);
    } catch (err) {
      console.error(err);
    }
  };

  // Revelar notas passo a passo
  const handleRevealScores = async (idx: number) => {
    try {
      setStageState((prev) => ({ ...prev, scoreRevealIndex: idx }));
      const res = await fetch("/api/state/reveal-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: idx }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.stage) setStageState(data.stage);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submeter Nota de Jurado Oficial
  const handleSubmitScore = async (scoreData: {
    eventoId: string;
    categoryId: string;
    participanteId: string;
    juradoId: string;
    itens: { criterioId: string; valor: number }[];
    comentario: string;
    dispositivoInfo: string;
  }) => {
    try {
      const res = await fetch("/api/state/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scoreData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.scores) setScores(data.scores);
        fetchBackendState(); // Força recarga imediata
      }
    } catch (err) {
      console.error(err);
    }
  };

  // RESETAR Banco de dados e scores para jogar de novo
  const handleResetDatabase = async () => {
    if (!confirm("Tem certeza que deseja resetar todas as notas e voltar ao estado de fábrica?")) return;
    try {
      const res = await fetch("/api/state/reset", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.stage) setStageState(data.stage);
        if (data.scores) setScores(data.scores);
        fetchBackendState();
        alert("Rodada reiniciada com sucesso! Divirta-se simulando.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cadastrar novo competidor (Ação de Administrador)
  const handleAddParticipant = async (pData: {
    eventId: string;
    nome: string;
    cosplayName?: string;
    origemOrigem?: string;
    musicaNome?: string;
    categoryId?: string;
    bateriaId?: string;
  }) => {
    try {
      const res = await fetch("/api/state/participant/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pData),
      });
      if (res.ok) fetchBackendState();
    } catch (err) {
      console.error(err);
    }
  };

  // Atualizar configurações do evento
  const handleUpdateEvent = async (eData: {
    eventId: string;
    nome?: string;
    local?: string;
    data?: string;
    status?: "preparacao" | "ativo" | "encerrado";
  }) => {
    try {
      const res = await fetch("/api/state/event/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eData),
      });
      if (res.ok) fetchBackendState();
    } catch (err) {
      console.error(err);
    }
  };

  // Simular votos de todos os jurados instantaneamente com notas plausíveis para testes dinâmicos rápidos!
  const handleAutoSubmitScores = async (partId: string) => {
    const activeEvt = events.find((e) => e.id === stageState.currentEventId);
    const activeCat = activeEvt?.categorias.find((c) => c.id === stageState.currentCategoryId);
    if (!activeEvt || !activeCat) return;

    // Dispara pedidos paralelos pro servidor para Yuki, Sato e Carol
    for (const jur of activeEvt.jurados) {
      // Gera notas ligeiramente flutuantes
      const baseNote = 8.0 + Math.random() * 2.0; // 8.0 a 10.0
      const itens = activeCat.criterios.map((c) => ({
        criterioId: c.id,
        valor: parseFloat((Math.min(10.0, baseNote + (Math.random() * 1.0 - 0.5))).toFixed(1)),
      }));

      await fetch("/api/state/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventoId: stageState.currentEventId,
          categoryId: stageState.currentCategoryId,
          participanteId: partId,
          juradoId: jur.id,
          itens,
          comentario: `Voto simulado em lote pela mesa técnica para o personagem do participante no palco.`,
          dispositivoInfo: `Stage Console (Automático)`,
        }),
      });
    }

    // Recarrega estado finalizado
    fetchBackendState();
  };

  // Elementos do evento selecionado atual
  const activeEvent = events.find((e) => e.id === stageState.currentEventId);
  const activeCategory = activeEvent?.categorias.find((c) => c.id === stageState.currentCategoryId);
  const activeParticipant = activeEvent?.participantes.find((p) => p.id === stageState.currentParticipantId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-rose-500 selection:text-white pb-8">
      
      {/* BARRA SUPERIOR DE CONECTOR / BRANDING */}
      <header className="sticky top-0 z-35 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 shadow-lg flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-gradient-to-tr from-rose-500 to-amber-500 text-slate-950 font-black tracking-tighter text-lg rounded-xl shadow-lg ring-1 ring-white/10">
              SENPAI SCORE
            </span>
          </div>
          <div className="h-5 w-[1px] bg-slate-800 hidden md:block" />
          <div className="hidden md:block">
            <p className="text-xs font-mono text-slate-400">
              Event Management & Stage Scoring System
            </p>
            {activeEvent && (
              <p className="text-xs text-amber-400 font-bold tracking-tight">
                ★ {activeEvent.nome}
              </p>
            )}
          </div>
        </div>

        {/* SELETOR DE PERSPECTIVAS DO SISTEMA (SIMULADOR DE MESA) */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-805 text-xs">
          {[
            { id: "split", label: "Mesa Completa", icon: Layers },
            { id: "screen", label: "Apenas Telão", icon: Tv },
            { id: "coordinator", label: "Mesa Coordenador", icon: Play },
            { id: "judge", label: "Terminal Jurado", icon: Star },
            { id: "admin", label: "Admin & Logs", icon: Shield },
          ].map((item) => {
            const IsActive = viewPerspective === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setViewPerspective(item.id as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                  IsActive
                    ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md shadow-rose-600/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* FEEDBACK DE ERRO SE O SERVER CAIR */}
      {fetchError && (
        <div className="max-w-4xl mx-auto mt-4 mx-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-center text-xs flex items-center justify-center gap-2 font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
          {fetchError}
        </div>
      )}

      {/* ÁREA CENTRAL PRINCIPAL DO CONTEÚDO */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {/* PERSPECTIVA 1: MESA GLOBAL DE SIMULAÇÃO (SPLIT) : O PODER DO EVENT OS */}
        {viewPerspective === "split" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* LADO ESQUERDO: TELÃO DE AUDIÊNCIA AO VIVO (PÚBLICO) */}
            <div className="xl:col-span-6 space-y-4 xl:sticky xl:top-[74px]">
              <div className="flex justify-between items-center bg-slate-900/40 p-2 border border-slate-805 rounded-xl font-mono text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  VISTA DO TELÃO DO PALCO (SIMULADOR DO PROJETOR)
                </span>
                <span>Proporção 16:9 Adaptada</span>
              </div>

              {/* Telão do Palco */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl">
                <ScreenView
                  stageState={stageState}
                  event={activeEvent}
                  scores={scores}
                  activeCategory={activeCategory}
                  activeParticipant={activeParticipant}
                />
              </div>

              {/* Roteiro da Voz do Apresentador sincronizado abaixo */}
              <PresenterScript stageState={stageState} event={activeEvent} />
            </div>

            {/* LADO DIREITO: ABAS DE CONTROLE OPERACIONAL DO SHOW */}
            <div className="xl:col-span-6 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 flex">
                {[
                  { id: "coor_tab", label: "1. Controle Coordenador", color: "text-amber-400" },
                  { id: "judge_tab", label: "2. Terminal de Votos", color: "text-blue-400" },
                  { id: "admin_tab", label: "3. Administração & Logs", color: "text-rose-400" },
                ].map((tab, idx) => {
                  const subTabActive =
                    (tab.id === "coor_tab" && viewPerspective === "split" && !activeParticipant?.status) || // fallback
                    (tab.id === "coor_tab" && stageState.screenState !== "voting_open") ||
                    (tab.id === "judge_tab" && stageState.screenState === "voting_open") ||
                    false; // We can let user click them freely
                  return (
                    <div
                      key={tab.id}
                      className="flex-1 py-2 text-center font-bold text-xs cursor-default text-slate-300 font-mono"
                    >
                      {tab.label}
                    </div>
                  );
                })}
              </div>

              {/* Seção 1: Console de Controle */}
              <CoordinatorConsole
                stageState={stageState}
                events={events}
                scores={scores}
                logsCount={logs.length}
                onUpdateStage={handleUpdateStage}
                onRevealScores={handleRevealScores}
                onResetDatabase={handleResetDatabase}
                onAutoSubmitScores={handleAutoSubmitScores}
              />

              {/* Seção 2: Terminal do Júri */}
              <JudgeRemote
                stageState={stageState}
                events={events}
                scores={scores}
                onSubmitScore={handleSubmitScore}
              />

              {/* Seção 3: Painel Administrativo de Retaguarda */}
              <AdminPanel
                events={events}
                logs={logs}
                onAddParticipant={handleAddParticipant}
                onUpdateEvent={handleUpdateEvent}
              />
            </div>
          </div>
        )}

        {/* PERSPECTIVA 2: APENAS O TELÃO (FULLSCREEN PRESET) */}
        {viewPerspective === "screen" && (
          <div className="max-w-5xl mx-auto aspect-video">
            <ScreenView
              stageState={stageState}
              event={activeEvent}
              scores={scores}
              activeCategory={activeCategory}
              activeParticipant={activeParticipant}
            />
          </div>
        )}

        {/* PERSPECTIVA 3: APENAS COORDENADOR */}
        {viewPerspective === "coordinator" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <CoordinatorConsole
              stageState={stageState}
              events={events}
              scores={scores}
              logsCount={logs.length}
              onUpdateStage={handleUpdateStage}
              onRevealScores={handleRevealScores}
              onResetDatabase={handleResetDatabase}
              onAutoSubmitScores={handleAutoSubmitScores}
            />
            {/* Acopla roteiro de voz simplificado embaixo */}
            <PresenterScript stageState={stageState} event={activeEvent} />
          </div>
        )}

        {/* PERSPECTIVA 4: APENAS JURADO REMOTE */}
        {viewPerspective === "judge" && (
          <div className="max-w-2xl mx-auto">
            <JudgeRemote
              stageState={stageState}
              events={events}
              scores={scores}
              onSubmitScore={handleSubmitScore}
            />
          </div>
        )}

        {/* PERSPECTIVA 5: APENAS ADMIN */}
        {viewPerspective === "admin" && (
          <div className="max-w-4xl mx-auto">
            <AdminPanel
              events={events}
              logs={logs}
              onAddParticipant={handleAddParticipant}
              onUpdateEvent={handleUpdateEvent}
            />
          </div>
        )}
      </main>

      {/* GUIA DE SIMULAÇÃO RÁPIDA (FOOTER) */}
      <footer className="w-full max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-1 text-center md:text-left flex-1">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5 justify-center md:justify-start">
              <HelpCircle className="w-4 h-4 text-amber-500" /> Como simular a competição ao vivo?
            </h4>
            <p className="text-xs text-slate-400 max-w-2xl">
              1. Na Mesa de Controle, mude o Telão para <strong>Intro Categoria</strong> ou <strong>Chamado</strong>.<br />
              2. Escolha o competidor na lista (ex: Beatriz Nogueira Mendes) e clique em <strong>Selecionar</strong>.<br />
              3. Inicie o tempo em <strong>Iniciar Apresentação</strong>. Mude para o estado <strong>No Palco</strong>.<br />
              4. Quando terminar, mude para <strong>Abrir Votação</strong>. Nesse momento o Terminal Jurado é liberado!<br />
              5. Candidate as notas dos jurados mudando o seletor &ldquo;Atuar como&rdquo; no Terminal de Votos OU aperte em <strong>Auto-Julgar</strong>.<br />
              6. Clique em <strong>Revelar Notas</strong> e faça as revelações passo-a-passo (Yuki, Sato, Carol, Média Geral).<br />
              7. Veja o participante subir na tabela em tempo real no estado <strong>Exibir Ranking</strong>!
            </p>
          </div>
          <button
            onClick={fetchBackendState}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 text-slate-350 hover:text-white hover:border-slate-700 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Forçar Recarga do Servidor
          </button>
        </div>
      </footer>
    </div>
  );
}
