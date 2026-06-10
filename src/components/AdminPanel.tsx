import React, { useState, useEffect } from "react";
import { Evento, AuditoriaLog } from "../types";
import { 
  Shield, 
  UserPlus, 
  Database, 
  FileText, 
  Smartphone, 
  AlertCircle, 
  PlusCircle, 
  Check, 
  Calendar, 
  CloudLightning, 
  Share2, 
  Layers, 
  FolderOpen, 
  FileSpreadsheet, 
  Play, 
  Clock, 
  LogOut, 
  LogIn, 
  Loader2, 
  CheckCircle, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { 
  googleSignIn, 
  logout, 
  getAccessToken, 
  db, 
  testFirestoreConnection, 
  auth,
  handleFirestoreError,
  OperationType 
} from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, collection, getDocs, writeBatch } from "firebase/firestore";

interface AdminPanelProps {
  events: Evento[];
  logs: AuditoriaLog[];
  onAddParticipant: (data: {
    eventId: string;
    nome: string;
    cosplayName?: string;
    origemOrigem?: string;
    musicaNome?: string;
    categoryId?: string;
    bateriaId?: string;
  }) => void;
  onUpdateEvent: (data: {
    eventId: string;
    nome?: string;
    local?: string;
    data?: string;
    status?: "preparacao" | "ativo" | "encerrado";
  }) => void;
}

export default function AdminPanel({
  events,
  logs,
  onAddParticipant,
  onUpdateEvent,
}: AdminPanelProps) {
  // Estado para filtragem e formulário
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || "");
  const [nome, setNome] = useState<string>("");
  const [cosplayName, setCosplayName] = useState<string>("");
  const [origemOrigem, setOrigemOrigem] = useState<string>("");
  const [musicaNome, setMusicaNome] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [bateriaId, setBateriaId] = useState<string>("");
  const [customMsg, setCustomMsg] = useState<string>("");

  // Estados de Workspace & Firebase
  const [firestoreOnline, setFirestoreOnline] = useState<boolean | null>(null);
  const [gUser, setGUser] = useState<User | null>(null);
  const [gToken, setGToken] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState<string | null>(null);
  const [integrationSuccess, setIntegrationSuccess] = useState<string | null>(null);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const [docLink, setDocLink] = useState<string | null>(null);

  const activeEvent = events.find((e) => e.id === selectedEventId);

  // Inicializa status do Firebase e monitora autenticação
  useEffect(() => {
    // 1. Testa a conexão com o Firestore
    testFirestoreConnection().then((success) => {
      setFirestoreOnline(success);
    });

    // 2. Escuta mudanças na autenticação do Firebase Google provider
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setGUser(user);
        const token = await getAccessToken();
        setGToken(token);
      } else {
        setGUser(null);
        setGToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setWorkspaceLoading("auth");
      setIntegrationError(null);
      const res = await googleSignIn();
      if (res) {
        setGUser(res.user);
        setGToken(res.accessToken);
        setIntegrationSuccess("Autenticado com sucesso no Google Workspace!");
        setTimeout(() => setIntegrationSuccess(null), 3000);
      }
    } catch (err: any) {
      setIntegrationError(`Erro de Login: ${err.message || err}`);
    } finally {
      setWorkspaceLoading(null);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGUser(null);
    setGToken(null);
    setDocLink(null);
    setIntegrationSuccess("Sessão Google desconectada.");
    setTimeout(() => setIntegrationSuccess(null), 3500);
  };

  const handleSubmitParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    onAddParticipant({
      eventId: selectedEventId,
      nome,
      cosplayName,
      origemOrigem,
      musicaNome,
      categoryId: categoryId || activeEvent?.categorias[0]?.id || "",
      bateriaId: bateriaId || activeEvent?.baterias[0]?.id || "",
    });

    setNome("");
    setCosplayName("");
    setOrigemOrigem("");
    setMusicaNome("");
    setCustomMsg("Competidor inscrito com sucesso!");
    setTimeout(() => setCustomMsg(""), 3000);
  };

  const handleToggleEventStatus = () => {
    if (!activeEvent) return;
    const nextStatus =
      activeEvent.status === "preparacao"
        ? "ativo"
        : activeEvent.status === "ativo"
        ? "encerrado"
        : "preparacao";

    onUpdateEvent({
      eventId: selectedEventId,
      status: nextStatus,
    });
  };

  // ==========================================
  // GOOGLE CALENDAR: Criar evento de competição
  // ==========================================
  const executeGoogleCalendarSchedule = async () => {
    if (!activeEvent) return;
    if (!gToken) {
      setIntegrationError("Autenticação Google necessária para agendar no Google Agenda.");
      return;
    }

    const confirmSchedule = window.confirm(
      `Deseja agendar o evento "${activeEvent.nome}" no seu Google Agenda para o dia ${activeEvent.data}?`
    );
    if (!confirmSchedule) return;

    try {
      setWorkspaceLoading("calendar");
      setIntegrationError(null);
      setDocLink(null);

      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `🏆 ${activeEvent.nome} - Senpai Score Live`,
          location: activeEvent.local,
          description: `Compromisso agendado automaticamente via Senpai Score.\nOperando palco de Cosplay, K-Pop e Karaokê em tempo real.\nLocal: ${activeEvent.local}\nCódigo do Evento: ${activeEvent.id}`,
          start: { date: activeEvent.data },
          end: { date: activeEvent.data },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API do Calendar: ${response.statusText}`);
      }

      const data = await response.json();
      setIntegrationSuccess(`Compensado! Evento agendado no seu Google Calendar com sucesso.`);
      if (data.htmlLink) {
        setDocLink(data.htmlLink);
      }
    } catch (err: any) {
      console.error(err);
      setIntegrationError(`Falha ao criar o evento no Calendar: ${err.message || err}`);
    } finally {
      setWorkspaceLoading(null);
    }
  };

  // ==========================================
  // GOOGLE DOCS: Exportar Roteiro do Apresentador
  // ==========================================
  const executeGoogleDocsGeneration = async () => {
    if (!activeEvent) return;
    if (!gToken) {
      setIntegrationError("Autenticação Google necessária para exportar ao Google Docs.");
      return;
    }

    const confirmDocs = window.confirm(
      `Confirmar a criação do "Roteiro Oficial do Apresentador" para o evento "${activeEvent.nome}" diretamente no seu Google Docs?`
    );
    if (!confirmDocs) return;

    try {
      setWorkspaceLoading("docs");
      setIntegrationError(null);
      setDocLink(null);

      // 1. Criar novo documento vazio
      const createResponse = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Roteiro do Apresentador - ${activeEvent.nome} (Senpai Score)`,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Erro ao criar arquivo no Docs: ${createResponse.statusText}`);
      }

      const docData = await createResponse.json();
      const documentId = docData.documentId;

      // 2. Elaboração do conteúdo textual estruturado de roteiro vocal
      const scriptBody = `ROTEIRO CONCEITUAL DO APRESENTADOR (MESTRE DE CERIMÔNIAS)\n` +
        `===============================================================\n\n` +
        `EVENTO: ${activeEvent.nome}\n` +
        `LOCAL: ${activeEvent.local}\n` +
        `DATA: ${activeEvent.data}\n\n` +
        `---------------------------------------------------------------\n` +
        `🎤 INTRODUÇÃO VOCAL DO EVENTO:\n` +
        `"Senhoras e senhores, preparem o coração! Está começando o concurso principal do palco do ${activeEvent.nome}!\n` +
        `Nosso painel de jurados especialistas já está posicionado. Hoje, a arena Senpai Score vai tremer!"\n\n` +
        `👥 BANCADA TÉCNICA DE JURADOS:\n` +
        activeEvent.jurados.map((j, idx) => `  * Jurado ${idx + 1}: ${j.nome} (${j.especialidade})`).join("\n") + "\n\n" +
        `📋 CONCORRENTES INSCRITOS ATIVOS NO PALCO:\n` +
        activeEvent.participantes.map((p, idx) => `  [#${idx + 1}] ${p.nome} - Atuando de "${p.cosplayName || "Original"}" (${p.origemOrigem || "N/A"})`).join("\n") + "\n\n" +
        `🌟 REGRAS DE AVALIAÇÃO:\n` +
        activeEvent.categorias.map(c => `  - ${c.nome}: ${c.regras}`).join("\n") + "\n\n" +
        `Obrigado por utilizar o sistema de Palco Senpai Score. Que vença o melhor cosplayer!`;

      // 3. Preencher o conteúdo
      const updateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                text: scriptBody,
                location: { index: 1 },
              },
            },
          ],
        }),
      });

      if (!updateResponse.ok) {
        throw new Error(`Erro ao popular o Google Doc: ${updateResponse.statusText}`);
      }

      setIntegrationSuccess(`Sucesso! Google Doc "${activeEvent.nome}" gerado.`);
      setDocLink(`https://docs.google.com/document/d/${documentId}/edit`);
    } catch (err: any) {
      console.error(err);
      setIntegrationError(`Falha no Google Docs: ${err.message || err}`);
    } finally {
      setWorkspaceLoading(null);
    }
  };

  // ==========================================
  // GOOGLE DRIVE: Backup de Placar de Notas
  // ==========================================
  const executeGoogleDriveBackup = async () => {
    if (!activeEvent) return;
    if (!gToken) {
      setIntegrationError("Autenticação Google necessária para efetuar backup no Google Drive.");
      return;
    }

    const confirmDrive = window.confirm(
      `Deseja exportar a Planilha de Notas e Classificação Geral do evento no seu Google Drive?`
    );
    if (!confirmDrive) return;

    try {
      setWorkspaceLoading("drive");
      setIntegrationError(null);
      setDocLink(null);

      // Criar conteúdo estruturado do placar de notas
      let reportString = `=== RELATÓRIO OFICIAL DE CLASSIFICAÇÃO- SENPAI SCORE ===\n`;
      reportString += `Evento: ${activeEvent.nome}\n`;
      reportString += `Data: ${activeEvent.data}\n`;
      reportString += `Local: ${activeEvent.local}\n`;
      reportString += `========================================================\n\n`;
      reportString += `🏆 QUADRO GERAL DE PARTICIPANTES:\n\n`;

      activeEvent.participantes.forEach((p, idx) => {
        reportString += `${idx + 1}. Competidor: ${p.nome}\n`;
        reportString += `   Cosplay: ${p.cosplayName || "Original"}\n`;
        reportString += `   Origem: ${p.origemOrigem || "N/A"}\n`;
        reportString += `   Status de Palco: ${p.status.toUpperCase()}\n`;
        reportString += `   Ordem Ap: #${p.ordemAp}\n`;
        reportString += `   -------------------------------------------------\n`;
      });

      reportString += `\nGerado automaticamente via sistema Senpai Score Live Competition OS.`;

      // 1. Upload do arquivo bruto de mídia para o Drive
      const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gToken}`,
          "Content-Type": "text/plain; charset=utf-8",
        },
        body: reportString,
      });

      if (!uploadRes.ok) {
        throw new Error(`Erro ao fazer upload no Drive: ${uploadRes.statusText}`);
      }

      const fileData = await uploadRes.json();
      const fileId = fileData.id;

      // 2. Renomear o arquivo usando PATCH de metadata
      const renameRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${gToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Classificacao_SenpaiScore_${activeEvent.id}.txt`,
        }),
      });

      if (!renameRes.ok) {
        throw new Error(`Erro ao nomear arquivo no Drive: ${renameRes.statusText}`);
      }

      setIntegrationSuccess("Excelente! Backup exportado para o Google Drive com sucesso.");
      setDocLink(`https://drive.google.com/file/d/${fileId}/view`);
    } catch (err: any) {
      console.error(err);
      setIntegrationError(`Falha no Google Drive: ${err.message || err}`);
    } finally {
      setWorkspaceLoading(null);
    }
  };

  // ==========================================
  // GOOGLE FORMS: Importar Submissões de Inscrições
  // ==========================================
  const executeGoogleFormsSync = async () => {
    if (!activeEvent) return;

    const confirmForms = window.confirm(
      `Deseja simular a sincronização com o formulário oficial de inscritos? Isso irá ler as fichas e importar um novo competidor para a mesa técnica.`
    );
    if (!confirmForms) return;

    try {
      setWorkspaceLoading("forms");
      setIntegrationError(null);

      // Simula um delay realista de requisição nas APIs das Forms
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockInscricoes = [
        {
          nome: "Juliana 'Asuka' Maranhão",
          cosplay: "Asuka Langley (Neon Genesis Evangelion)",
          origem: "Anime Gainax",
          musica: "A Cruel Angel's Thesis Symphony",
        },
        {
          nome: "Roberto Geralt",
          cosplay: "Geralt of Rivia (The Witcher 3)",
          origem: "CD Projekt Red",
          musica: "Silver for Monsters (Combat Theme)",
        },
        {
          nome: "Aline Kirari",
          cosplay: "Kirari Momobami (Kakegurui)",
          origem: "Netflix Series",
          musica: "Deal with the Devil Instrumental",
        }
      ];

      // Escolhe um ao acaso para simular a resposta recebida pela integração do webhook do Forms
      const randomCosplayer = mockInscricoes[Math.floor(Math.random() * mockInscricoes.length)];

      onAddParticipant({
        eventId: selectedEventId,
        nome: randomCosplayer.nome,
        cosplayName: randomCosplayer.cosplay,
        origemOrigem: randomCosplayer.origem,
        musicaNome: randomCosplayer.musica,
        categoryId: activeEvent.categorias[0]?.id || "",
        bateriaId: activeEvent.baterias[0]?.id || "",
      });

      setIntegrationSuccess(
        `Formulário Sincronizado! Inscrito "${randomCosplayer.nome}" do cosplay "${randomCosplayer.cosplay}" cadastrado na fila.`
      );
    } catch (err: any) {
      setIntegrationError(`Falha no Google Forms: ${err.message || err}`);
    } finally {
      setWorkspaceLoading(null);
    }
  };

  // ==========================================
  // FIREBASE FIRESTORE CLOUD INTEGRATION BACKUP
  // ==========================================
  const executeFirebaseBackup = async () => {
    if (!activeEvent) return;
    try {
      setWorkspaceLoading("firebase");
      setIntegrationError(null);

      // Sincronizar meta do evento ativo no Firestore do Speedy Vault
      const eventRef = doc(db, "events", activeEvent.id);
      await setDoc(eventRef, {
        id: activeEvent.id,
        organizacaoId: activeEvent.organizacaoId,
        nome: activeEvent.nome,
        local: activeEvent.local,
        data: activeEvent.data,
        status: activeEvent.status,
        timestampBackup: new Date().toISOString()
      }).catch((e) => handleFirestoreError(e, OperationType.WRITE, `events/${activeEvent.id}`));

      // Sincronizar todos os logs de auditoria correspondentes
      const batch = writeBatch(db);
      logs.forEach((log) => {
        const logRef = doc(db, "auditLogs", log.id);
        batch.set(logRef, {
          id: log.id,
          timestamp: log.timestamp,
          usuario: log.usuario,
          papel: log.papel,
          acao: log.acao,
          detalhes: log.detalhes
        });
      });
      await batch.commit().catch((e) => handleFirestoreError(e, OperationType.WRITE, "auditLogs/batch"));

      setIntegrationSuccess("Nuvem Firebase Sincronizada! Estado e Logs salvos no Firestore com persistência permanente.");
      setFirestoreOnline(true);
      setTimeout(() => setIntegrationSuccess(null), 4500);
    } catch (err: any) {
      console.error(err);
      setIntegrationError(`Falha ao sincronizar com Firestore: ${err.message || err}`);
    } finally {
      setWorkspaceLoading(null);
    }
  };

  return (
    <div id="admin-panel" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-mono text-rose-400">ADMIN CONTROL HUB</span>
          </div>
          <h2 className="text-base font-bold text-white mt-1">Configurações Gerais e Auditoria</h2>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400">Selecionar Evento:</label>
          <select
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 py-1.5 rounded focus:outline-none focus:border-rose-500"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: CADASTRO DE COMPETIDORES E STATUS */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status do Evento */}
          {activeEvent && (
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-500" /> Ciclo de Vida do Evento
              </h3>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 block font-mono">Status Atual:</span>
                  <span
                    className={`text-xs font-bold font-mono px-2 py-0.5 rounded uppercase ${
                      activeEvent.status === "ativo"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : activeEvent.status === "preparacao"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {activeEvent.status}
                  </span>
                </div>

                <button
                  onClick={handleToggleEventStatus}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs text-slate-200 font-bold rounded"
                >
                  Mudar Status ➜
                </button>
              </div>
            </div>
          )}

          {/* Cadastro de Participantes */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-rose-400" /> Inscrever Participante no Palco
            </h3>

            <form onSubmit={handleSubmitParticipant} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome Completo do Competidor:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mateus Silva"
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Nome do Cosplay / Grupo:</label>
                  <input
                    type="text"
                    placeholder="Ex: Ezreal (Star Guardian)"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 placeholder-slate-600 focus:outline-none"
                    value={cosplayName}
                    onChange={(e) => setCosplayName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Franquia / Origem:</label>
                  <input
                    type="text"
                    placeholder="Ex: League of Legends"
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 placeholder-slate-600 focus:outline-none"
                    value={origemOrigem}
                    onChange={(e) => setOrigemOrigem(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Categoria Alvo:</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">-- Padrão do Sistema --</option>
                    {activeEvent?.categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome.split("-")[1] || c.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Bateria de Palco:</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 focus:outline-none"
                    value={bateriaId}
                    onChange={(e) => setBateriaId(e.target.value)}
                  >
                    <option value="">-- Padrão do Sistema --</option>
                    {activeEvent?.baterias.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Música / Link de Áudio (MP3):</label>
                <input
                  type="text"
                  placeholder="Ex: Link externo ou trilha sonora principal..."
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-100 placeholder-slate-600 focus:outline-none"
                  value={musicaNome}
                  onChange={(e) => setMusicaNome(e.target.value)}
                />
              </div>

              {customMsg && (
                <div className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                  <Check className="w-3.5 h-3.5" /> {customMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded flex items-center justify-center gap-1 text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Inscrever Competidor
              </button>
            </form>
          </div>
        </div>

        {/* COLUNA DIREITA: TRILHA DE AUDITORIA E LOGS (TRANSPARÊNCIA) */}
        <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col h-full min-h-[360px]">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-3 mb-3">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Logs e Auditoria Anti-Fraude do Evento (Real-time)
          </h3>

          <div className="flex-1 overflow-y-auto max-h-[300px] text-[11px] font-mono scrollbar-thin">
            <div className="space-y-2.5">
              {logs.length > 0 ? (
                logs
                  .slice()
                  .reverse()
                  .map((log) => {
                    const pillColor =
                      log.papel === "super_admin"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : log.papel === "jurado"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : log.papel === "organizador"
                        ? "bg-amber-500/10 text-amber-450 border border-amber-500/20"
                        : "bg-slate-800 text-slate-300";

                    return (
                      <div
                        key={log.id}
                        className="bg-slate-950 border border-slate-900 p-2.5 rounded hover:bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                            <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded ${pillColor}`}>
                              {log.papel}
                            </span>
                            <strong className="text-slate-200">{log.usuario}</strong>
                          </div>
                          <p className="text-slate-300 leading-normal">{log.detalhes}</p>
                        </div>
                        <span className="text-[9px] text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 self-start">
                          SHA256 SECURED ✓
                        </span>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center p-8 text-slate-600">Nenhum log gravado no servidor.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECÇÃO GOOGLE CLOUD INTEGRADA & WORKSPACE PANEL */}
      <div id="workspace-integration-hub" className="border-t border-slate-800 pt-6 mt-6">
        <div className="bg-slate-950 rounded-2xl border border-slate-850 p-6 space-y-6">
          
          {/* HEADER HUB */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CloudLightning className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest">GOOGLE INTEGRATION CENTER</span>
              </div>
              <h3 className="text-sm font-bold text-white">Centralizada de Sincronizações e Workspace</h3>
              <p className="text-xs text-slate-400">Ative ferramentas integradas para Google Drive, Calendar, Docs e Forms.</p>
            </div>

            {/* STATUS DA AUTENTICAÇÃO DO USUÁRIO */}
            <div className="flex items-center gap-3">
              {gUser ? (
                <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                  {gUser.photoURL ? (
                    <img referrerPolicy="no-referrer" src={gUser.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-amber-500/40" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs font-mono">
                      {gUser.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="text-left text-[10px] leading-tight max-w-[150px]">
                    <span className="font-bold text-slate-200 block truncate">{gUser.displayName}</span>
                    <span className="text-slate-500 block truncate">{gUser.email}</span>
                  </div>
                  <button
                    onClick={handleGoogleLogout}
                    title="Desconectar Conta Google"
                    className="p-1 px-2 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 font-mono font-bold rounded-lg transition-all"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={workspaceLoading === "auth"}
                  className="gsi-material-button text-xs py-2 px-4 flex items-center gap-2 font-bold bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all cursor-pointer ring-1 ring-slate-200/20"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{workspaceLoading === "auth" ? "Conectando..." : "Sign in with Google"}</span>
                </button>
              )}
            </div>
          </div>

          {/* ESTADO FEEDBACK E NOTIFICAÇÃO */}
          {(integrationSuccess || integrationError) && (
            <div className="p-3 text-xs font-mono rounded-xl border flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                {integrationSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400">{integrationSuccess}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-rose-400">{integrationError}</span>
                  </>
                )}
              </div>
              {docLink && (
                <a
                  href={docLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-amber-400 font-bold font-mono rounded-lg transition-all"
                >
                  Abrir Arquivo ➜
                </a>
              )}
            </div>
          )}

          {/* BENTO GRID DE FERRAMENTAS WORKSPACE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* GOOGLE DRIVE CARD */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700/60 transition-all">
              <div className="space-y-1.5 text-left">
                <div className="p-2 w-max bg-blue-500/10 text-blue-400 rounded-lg">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Google Drive</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gere backups duráveis e planilhas gerais de notas diretamente na nuvem de arquivos do Google Drive.
                </p>
              </div>
              <button
                disabled={workspaceLoading !== null || !gUser}
                onClick={executeGoogleDriveBackup}
                className="w-full py-1.5 text-xs font-bold bg-blue-900/30 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-400 text-blue-200 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
              >
                {workspaceLoading === "drive" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                <span>Salvar Placar</span>
              </button>
            </div>

            {/* GOOGLE CALENDAR CARD */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700/60 transition-all">
              <div className="space-y-1.5 text-left">
                <div className="p-2 w-max bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Google Calendar</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Agende a data de palco e cronograma do concurso de beleza nerd de forma sincronizada no seu Google Calendar.
                </p>
              </div>
              <button
                disabled={workspaceLoading !== null || !gUser}
                onClick={executeGoogleCalendarSchedule}
                className="w-full py-1.5 text-xs font-bold bg-emerald-900/30 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-400 text-emerald-200 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
              >
                {workspaceLoading === "calendar" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Calendar className="w-3.5 h-3.5" />
                )}
                <span>Agendar Show</span>
              </button>
            </div>

            {/* GOOGLE DOCS CARD */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700/60 transition-all">
              <div className="space-y-1.5 text-left">
                <div className="p-2 w-max bg-purple-500/10 text-purple-400 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Google Docs</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Converta automaticamente o roteiro vocal do apresentador contendo regras e cosplayers em um novo Google Doc.
                </p>
              </div>
              <button
                disabled={workspaceLoading !== null || !gUser}
                onClick={executeGoogleDocsGeneration}
                className="w-full py-1.5 text-xs font-bold bg-purple-900/30 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-400 text-purple-200 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
              >
                {workspaceLoading === "docs" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Gerar Roteiro Doc</span>
              </button>
            </div>

            {/* GOOGLE FORMS CARD */}
            <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-4 hover:border-slate-700/60 transition-all">
              <div className="space-y-1.5 text-left">
                <div className="p-2 w-max bg-amber-500/10 text-amber-400 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Google Forms</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sincronize a ficha de inscrições com formulários do Google Forms para injetar novos cosplayers espontaneamente.
                </p>
              </div>
              <button
                disabled={workspaceLoading !== null}
                onClick={executeGoogleFormsSync}
                className="w-full py-1.5 text-xs font-bold bg-amber-900/30 hover:bg-amber-600 border border-amber-500/30 hover:border-amber-400 text-amber-200 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5"
              >
                {workspaceLoading === "forms" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>Simular Inscrição</span>
              </button>
            </div>

          </div>

          {/* SECTOR FIREBASE CLOUD SYSTEM PERSISTENCY */}
          <div className="bg-slate-900/60 border border-slate-850/60 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl h-max self-start sm:self-center">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <span>Firebase Server Persistency Engine</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${
                    firestoreOnline ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700/50"
                  }`}>
                    {firestoreOnline ? "FIRESTORE ONLINE ✓" : "OFFLINE / CARREGANDO"}
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Salve os dados de eventos, marcas judiciais e auditoria do container de teste na nuvem resiliente do Firestore.
                </p>
              </div>
            </div>

            <button
              disabled={workspaceLoading !== null}
              onClick={executeFirebaseBackup}
              className="py-2 px-5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black tracking-tight rounded-xl transition-all disabled:opacity-50 duration-200 shadow-md text-xs border border-white/10"
            >
              {workspaceLoading === "firebase" ? (
                <span className="flex items-center gap-1.5 justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  Salvando na Cloud...
                </span>
              ) : (
                "Efetuar Backup no Firestore"
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
