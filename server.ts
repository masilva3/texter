import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Evento, StageState, Nota, AuditoriaLog, Participante } from "./src/types";

// Database persistente em memória para a sessão do container
let logs: AuditoriaLog[] = [
  {
    id: "log_1",
    timestamp: new Date().toISOString(),
    usuario: "Sistema",
    papel: "super_admin",
    acao: "inicializacao",
    detalhes: "Bancos de dados inicializado com sucesso para as competições.",
  },
];

const mockEventos: Evento[] = [
  {
    id: "evt_anime_friends",
    organizacaoId: "org_senpai",
    nome: "Anime Friends Festival 2026",
    local: "Espaço Anhembi, São Paulo - SP",
    data: "2026-07-15",
    status: "ativo",
    baterias: [
      { id: "bat_manha", nome: "Bateria A - Manhã", descricao: "Apresentações iniciais das 10:00 às 13:00" },
      { id: "bat_tarde", nome: "Bateria B - Tarde", descricao: "Apresentações de Elite das 14:00 às 18:00" },
    ],
    categorias: [
      {
        id: "cat_cosplay_desfile",
        nome: "Concurso Cosplay - Desfile Tradicional",
        regras: "Até 1 minuto de desfile livre. Notas de 0 a 10 por critério. Sem uso de áudio ou encenação complexa.",
        criterios: [
          { id: "cri_fidelidade", nome: "Fidelidade / ACABAMENTO", peso: 4, descricao: "Semelhança ao personagem original, costura, pintura e detalhes das armaduras." },
          { id: "cri_dificuldade", nome: "Dificuldade / COMPLEXIDADE", peso: 3, descricao: "Nível de dificuldade técnica de construção do traje e uso de materiais." },
          { id: "cri_presenca", nome: "Presença de Palco / POSTURA", peso: 3, descricao: "Postura, simpatia e capacidade de representar o personagem em desfile." },
        ],
      },
      {
        id: "cat_cosplay_apresentacao",
        nome: "Cosplay Apresentação Individual",
        regras: "Até 2 minutos de encenação com trilha ou diálogo. Notas de 0 a 10.",
        criterios: [
          { id: "cri_interpretacao", nome: "Interpretação / ENTRONAÇÃO", peso: 4, descricao: "Qualidade da atuação, dublagem, fidelidade de voz/trejeitos e atuação dramática." },
          { id: "cri_indumentaria", nome: "Indumentária", peso: 3, descricao: "Conformidade geral com o personagem." },
          { id: "cri_criatividade", nome: "Criatividade e Roteiro", peso: 3, descricao: "Impacto da cena, originalidade e aproveitamento do palco." },
        ],
      },
      {
        id: "cat_kpop_solo",
        nome: "K-Pop Dance Cover - Solo",
        regras: "Apresentações individuais de dança coreográfica de grupos oficiais de K-Pop.",
        criterios: [
          { id: "cri_fidelidade_coreografica", nome: "Fidelidade Coreográfica", peso: 4, descricao: "Precisão dos movimentos em relação à coreografia oficial." },
          { id: "cri_sincronia_ritmo", nome: "Sincronia e Ritmo", peso: 3, descricao: "Controle do tempo musical, energia e dinâmica de palco." },
          { id: "cri_carisma", nome: "Expressão Corporal e Carisma", peso: 3, descricao: "Expressão facial apropriada e conexão com o público." },
        ],
      },
    ],
    jurados: [
      { id: "jur_1", nome: "Yuki Chan", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Yuki", especialidade: "Cosmaker Internacional & Crítica de Costura" },
      { id: "jur_2", nome: "Maurício Sato", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Mauricio", especialidade: "Diretor Teatral, Dublador & Coreógrafo" },
      { id: "jur_3", nome: "Carol Kim", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Carol", especialidade: "Dançarina Elite & Instrutora de K-Pop Cover" },
    ],
    participantes: [
      {
        id: "part_1",
        nome: "Gabriel 'Loki' Silva",
        cosplayName: "Loki (Série Loki - Variante de Asgard)",
        origemOrigem: "Marvel Comics",
        musicaNome: "Green Magic Mischief Symphony",
        musicaVideoUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        imagemUrl: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=400&auto=format&fit=crop&q=60",
        status: "concluido",
        bateriaId: "bat_manha",
        categoryId: "cat_cosplay_desfile",
        ordemAp: 1,
      },
      {
        id: "part_2",
        nome: "Beatriz Nogueira Mendes",
        cosplayName: "Zelda (The Legend of Zelda: Tears of the Kingdom)",
        origemOrigem: "Nintendo Switch",
        musicaNome: "Hyrule Royal Theme (Remix)",
        musicaVideoUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        imagemUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=60",
        status: "apresentando",
        bateriaId: "bat_manha",
        categoryId: "cat_cosplay_desfile",
        ordemAp: 2,
      },
      {
        id: "part_3",
        nome: "Leticia 'Harley' Lima",
        cosplayName: "Malévola (Mistress of Evil)",
        origemOrigem: "Disney Studio",
        musicaNome: "Dark Magic Whistle",
        musicaVideoUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        imagemUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60",
        status: "espera",
        bateriaId: "bat_manha",
        categoryId: "cat_cosplay_desfile",
        ordemAp: 3,
      },
      {
        id: "part_4",
        nome: "Marcos Aoki",
        cosplayName: "Goku (Super Saiyan Blue Kaioken x10)",
        origemOrigem: "Dragon Ball Super",
        musicaNome: "Chala-Head-Chala Rock Beat",
        musicaVideoUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        imagemUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=60",
        status: "espera",
        bateriaId: "bat_tarde",
        categoryId: "cat_cosplay_desfile",
        ordemAp: 4,
      },
      {
        id: "part_5",
        nome: "Grupo Dynamite Dance",
        cosplayName: "BTS - 'Dynamite' Cover Dance",
        origemOrigem: "Kpop Coreografia",
        musicaNome: "Dynamite Performance Ver.",
        musicaVideoUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        imagemUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60",
        status: "espera",
        bateriaId: "bat_manha",
        categoryId: "cat_kpop_solo",
        ordemAp: 1,
      },
    ],
  },
  {
    id: "evt_korea_con",
    organizacaoId: "org_senpai",
    nome: "Korea Con São Paulo 2026",
    local: "Centro de Convenções Rebouças, SP",
    data: "2026-09-02",
    status: "preparacao",
    baterias: [
      { id: "bat_korea_1", nome: "Bateria K-Pop Coreia 1", descricao: "Apresentações K-Pop Solo" },
    ],
    categorias: [
      {
        id: "cat_kpop_solo",
        nome: "K-Pop Solo Cover",
        regras: "Foco total na precisão rítmica e expressão do idol.",
        criterios: [
          { id: "cri_fidelidade_coreografica", nome: "Fidelidade Coreográfica", peso: 5, descricao: "Fidelidade extrema ao vídeo original" },
          { id: "cri_sincronia_ritmo", nome: "Sincronia", peso: 5, descricao: "Ritmo e presença escênica." },
        ],
      },
    ],
    jurados: [
      { id: "jur_3", nome: "Carol Kim", avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Carol", especialidade: "Dançarina Elite" },
    ],
    participantes: [
      {
        id: "part_k_1",
        nome: "Thiago Kim",
        cosplayName: "Taemin (Criminal Performance)",
        origemOrigem: "Taemin",
        musicaNome: "Criminal Taemin",
        imagemUrl: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&auto=format&fit=crop&q=60",
        status: "espera",
        bateriaId: "bat_korea_1",
        categoryId: "cat_kpop_solo",
        ordemAp: 1,
      },
    ],
  },
];

// Notas iniciais simuladas para fechar o status do Gabriel (part_1) para parecer real
let scores: Nota[] = [
  // Notas para part_1 (Gabriel) do jurado Yuki Chan (jur_1)
  {
    id: "sc_gab_1",
    eventoId: "evt_anime_friends",
    categoryId: "cat_cosplay_desfile",
    participanteId: "part_1",
    juradoId: "jur_1",
    itens: [
      { criterioId: "cri_fidelidade", valor: 9.5 },
      { criterioId: "cri_dificuldade", valor: 8.0 },
      { criterioId: "cri_presenca", valor: 9.0 },
    ],
    comentario: "Excelente acabamento nos tecidos, mas o cetim da capa poderia ser menos brilhante. Presença de palco ótima!",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    dispositivoInfo: "iPad Air Pro (Safari Chrome UI)"
  },
  // Notas para part_1 (Gabriel) do jurado Mauricio Sato (jur_2)
  {
    id: "sc_gab_2",
    eventoId: "evt_anime_friends",
    categoryId: "cat_cosplay_desfile",
    participanteId: "part_1",
    juradoId: "jur_2",
    itens: [
      { criterioId: "cri_fidelidade", valor: 8.5 },
      { criterioId: "cri_dificuldade", valor: 8.5 },
      { criterioId: "cri_presenca", valor: 9.5 },
    ],
    comentario: "Postura e incorporação fantástica do Deus da Trapaça! Se divertiu horrores em cima do palco.",
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    dispositivoInfo: "Chrome 125, Windows 11 Stage-Judges"
  },
  // Notas para part_1 (Gabriel) do jurado Carol Kim (jur_3)
  {
    id: "sc_gab_3",
    eventoId: "evt_anime_friends",
    categoryId: "cat_cosplay_desfile",
    participanteId: "part_1",
    juradoId: "jur_3",
    itens: [
      { criterioId: "cri_fidelidade", valor: 9.0 },
      { criterioId: "cri_dificuldade", valor: 9.0 },
      { criterioId: "cri_presenca", valor: 8.5 },
    ],
    comentario: "Muito fiel ao traje original da variante Asgard. Sincronização gestual excelente.",
    timestamp: new Date(Date.now() - 2800000).toISOString(),
    dispositivoInfo: "iPhone 15 Pro, iOS Native Judge Remote"
  },
  // Notas preliminares para part_2 (Zelda) - apenas Yuki deu nota até agora para simular ao vivo!
  {
    id: "sc_zel_1",
    eventoId: "evt_anime_friends",
    categoryId: "cat_cosplay_desfile",
    participanteId: "part_2",
    juradoId: "jur_1",
    itens: [
      { criterioId: "cri_fidelidade", valor: 9.8 },
      { criterioId: "cri_dificuldade", valor: 9.5 },
      { criterioId: "cri_presenca", valor: 9.2 },
    ],
    comentario: "Traje maravilhoso! Detalhes em couro legítimo e impressões 3D lixadas perfeitamente.",
    timestamp: new Date().toISOString(),
    dispositivoInfo: "Mozilla/5.0 iPad Pro Stage Side"
  }
];

// Estado atual do palco
let stageState: StageState = {
  currentEventId: "evt_anime_friends",
  currentCategoryId: "cat_cosplay_desfile",
  currentParticipantId: "part_2", // Zelda está no palco atualmente
  screenState: "performing",
  timerCount: 45,
  timerActive: false,
  scoreRevealIndex: 0
};

// Start Express Server
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === API ENDPOINTS ===

  // 1. Get complete State
  app.get("/api/state", (req, res) => {
    res.json({
      events: mockEventos,
      scores: scores,
      stage: stageState,
      logs: logs
    });
  });

  // 2. Clear or Reset competition status to play again
  app.post("/api/state/reset", (req, res) => {
    // Restaurar notas padrão
    scores = [
      {
        id: "sc_gab_1",
        eventoId: "evt_anime_friends",
        categoryId: "cat_cosplay_desfile",
        participanteId: "part_1",
        juradoId: "jur_1",
        itens: [
          { criterioId: "cri_fidelidade", valor: 9.5 },
          { criterioId: "cri_dificuldade", valor: 8.0 },
          { criterioId: "cri_presenca", valor: 9.0 },
        ],
        comentario: "Excelente acabamento nos tecidos, presença de palco impecável!",
        timestamp: new Date(Date.now() - 3600).toISOString(),
        dispositivoInfo: "Simulated Device 1"
      }
    ];

    // Resetar status dos participantes
    const activeEvt = mockEventos.find(e => e.id === "evt_anime_friends");
    if (activeEvt) {
      activeEvt.participantes.forEach(p => {
        if (p.id === "part_1") p.status = 'concluido';
        else if (p.id === "part_2") p.status = 'apresentando';
        else p.status = 'espera';
      });
    }

    stageState = {
      currentEventId: "evt_anime_friends",
      currentCategoryId: "cat_cosplay_desfile",
      currentParticipantId: "part_2",
      screenState: "performing",
      timerCount: 0,
      timerActive: false,
      scoreRevealIndex: 0
    };

    logs.push({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      usuario: "Organizador Geral",
      papel: "organizador",
      acao: "reset_sistema",
      detalhes: "Todos os dados de teste foram resetados para o estado padrão.",
    });

    res.json({ status: "success", stage: stageState, scores });
  });

  // 3. Update the stage state (Screen View controller)
  app.post("/api/state/update-stage", (req, res) => {
    const { currentEventId, currentCategoryId, currentParticipantId, screenState, timerCount, timerActive } = req.body;

    if (currentEventId !== undefined) stageState.currentEventId = currentEventId;
    if (currentCategoryId !== undefined) stageState.currentCategoryId = currentCategoryId;
    if (currentParticipantId !== undefined) stageState.currentParticipantId = currentParticipantId;
    if (screenState !== undefined) stageState.screenState = screenState;
    if (timerCount !== undefined) stageState.timerCount = timerCount;
    if (timerActive !== undefined) stageState.timerActive = timerActive;

    // Se o participante mudou, podemos ajustar seu status correspondente
    if (currentParticipantId && currentParticipantId !== "null") {
      const activeEvt = mockEventos.find(e => e.id === stageState.currentEventId);
      if (activeEvt) {
        activeEvt.participantes.forEach(p => {
          if (p.id === currentParticipantId) {
            p.status = 'apresentando';
          }
        });
      }
    }

    // Registrar logs de controle
    logs.push({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      usuario: "Coordenador de Palco",
      papel: "coordenador",
      acao: "controle_palco",
      detalhes: `Estado do telão atualizado para: '${stageState.screenState}'. Ativo: ${stageState.currentParticipantId || 'Nenhum'}`,
    });

    res.json({ status: "success", stage: stageState });
  });

  // 4. Submit score (Judge interaction)
  app.post("/api/state/score", (req, res) => {
    const { eventoId, categoryId, participanteId, juradoId, itens, comentario, dispositivoInfo } = req.body;

    if (!participanteId || !juradoId) {
      return res.status(400).json({ status: "error", message: "Falta participanteId ou juradoId" });
    }

    // Remover duplicatas pro mesmo jurado e participante na rodada
    scores = scores.filter(s => !(s.participanteId === participanteId && s.juradoId === juradoId));

    const novaNota: Nota = {
      id: "sc_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      eventoId: eventoId || stageState.currentEventId,
      categoryId: categoryId || stageState.currentCategoryId,
      participanteId,
      juradoId,
      itens,
      comentario,
      timestamp: new Date().toISOString(),
      dispositivoInfo: dispositivoInfo || "Navegador do Jurado"
    };

    scores.push(novaNota);

    // Se todos ou quase todos os jurados votaram, podemos marcar esse participante como concluído no fluxômetro
    const activeEvt = mockEventos.find(e => e.id === (eventoId || stageState.currentEventId));
    if (activeEvt) {
      // Conta quantos jurados votaram nele
      const votosNoPart = scores.filter(s => s.participanteId === participanteId);
      if (votosNoPart.length >= activeEvt.jurados.length) {
        const partid = activeEvt.participantes.find(p => p.id === participanteId);
        if (partid) {
          partid.status = 'concluido';
        }
      }
    }

    // Adiciona log de auditoria
    const julgador = activeEvt?.jurados.find(j => j.id === juradoId)?.nome || `Jurado ${juradoId}`;
    const competidor = activeEvt?.participantes.find(p => p.id === participanteId)?.nome || `Cod ${participanteId}`;
    
    logs.push({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      usuario: julgador,
      papel: "jurado",
      acao: "submissao_nota",
      detalhes: `Lançou nota para o participante: ${competidor}. Notas: ${itens.map((n: any) => n.valor).join(" | ")}`,
    });

    res.json({ status: "success", scores });
  });

  // 5. Update score reveal list
  app.post("/api/state/reveal-scores", (req, res) => {
    const { index } = req.body;
    stageState.scoreRevealIndex = index;
    res.json({ status: "success", stage: stageState });
  });

  // 6. Manage participant details (Admin actions)
  app.post("/api/state/participant/add", (req, res) => {
    const { eventId, nome, cosplayName, origemOrigem, musicaNome, imagemUrl, categoryId, bateriaId } = req.body;
    
    const activeEvt = mockEventos.find(e => e.id === eventId);
    if (!activeEvt) {
      return res.status(404).json({ status: "error", message: "Evento não encontrado" });
    }

    const novoPart: Participante = {
      id: "part_" + Date.now(),
      nome,
      cosplayName,
      origemOrigem,
      musicaNome,
      imagemUrl: imagemUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=60",
      status: "espera",
      bateriaId: bateriaId || activeEvt.baterias[0]?.id || "bat_manha",
      categoryId: categoryId || activeEvt.categorias[0]?.id || "cat_cosplay_desfile",
      ordemAp: activeEvt.participantes.length + 1,
    };

    activeEvt.participantes.push(novoPart);

    logs.push({
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      usuario: "Administrador",
      papel: "organizador",
      acao: "cadastro_participante",
      detalhes: `Inscrito novo competidor: ${nome} com cosplay de ${cosplayName || "Não Informado"}.`,
    });

    res.json({ status: "success", events: mockEventos });
  });

  // 7. Update Event general setup
  app.post("/api/state/event/edit", (req, res) => {
    const { eventId, nome, local, data, status } = req.body;
    const activeEvt = mockEventos.find(e => e.id === eventId);
    if (activeEvt) {
      if (nome) activeEvt.nome = nome;
      if (local) activeEvt.local = local;
      if (data) activeEvt.data = data;
      if (status) activeEvt.status = status;

      logs.push({
        id: "log_" + Date.now(),
        timestamp: new Date().toISOString(),
        usuario: "Administrador de Evento",
        papel: "organizador",
        acao: "configurar_evento",
        detalhes: `Configurações de evento editadas. Novo Status: '${activeEvt.status}'`,
      });
    }
    res.json({ status: "success", events: mockEventos });
  });

  // Vite Middleware for development versus statically hosting in Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Senpai Score] Server is active on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Ops, falha ao inicializar o servidor de palco:", err);
});
