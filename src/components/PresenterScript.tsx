import React from "react";
import { Evento, Participante, Categoria } from "../types";
import { Mic, Speech, MessageSquare, AlertCircle, PlayCircle, Star } from "lucide-react";

interface PresenterScriptProps {
  stageState: {
    currentEventId: string;
    currentCategoryId: string;
    currentParticipantId: string | null;
    screenState: string;
  };
  event: Evento | undefined;
}

export default function PresenterScript({ stageState, event }: PresenterScriptProps) {
  const activeCategory = event?.categorias.find((c) => c.id === stageState.currentCategoryId);
  const activeParticipant = event?.participantes.find((p) => p.id === stageState.currentParticipantId);

  return (
    <div id="presenter-script" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <div className="p-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
          <Mic className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block leading-none">
            PRESENTER REMOTE SCRIPT
          </span>
          <h3 className="text-sm font-bold text-white mt-1 leading-none">Roteiro do Apresentador (MC)</h3>
        </div>
      </div>

      {/* ROTEIRO DINÂMICO BASEADO NO PARTICIPANTE */}
      {!activeParticipant ? (
        <div className="p-4 bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center space-y-1">
          <AlertCircle className="w-5 h-5 mx-auto text-slate-600 mb-1" />
          <p>Nenhum participante ativo no momento.</p>
          <p className="text-[10px]">Aguarde o Coordenador chamar o próximo competidor.</p>
        </div>
      ) : (
        <div className="space-y-3.5 text-xs">
          {/* Status do Telão Sincronizado */}
          <div className="p-2.5 bg-slate-950/60 border border-slate-805 rounded flex justify-between items-center font-mono text-[10px]">
            <span className="text-slate-400">STATUS DO SHOW:</span>
            <span className="text-purple-400 font-bold uppercase">{stageState.screenState}</span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-400 block uppercase border-b border-slate-850 pb-1">
              INTRODUÇÃO DO COMPETIDOR
            </span>

            {/* Fala Recomendada do MC */}
            <div className="bg-purple-950/15 border-l-4 border-purple-500 p-3 rounded-r-lg space-y-1.5">
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                <Speech className="w-3 h-3" /> FALA SUGERIDA (MICROFONE) ::
              </span>
              <p className="text-slate-200 leading-relaxed italic text-sm">
                &ldquo;E agora, senhoras e senhores, preparem seus corações e câmeras! Subindo ao palco do{" "}
                <span className="text-amber-400 font-bold font-mono">{event?.nome.split("Festival")[0] || "Senpai Score"}</span>, no concurso{" "}
                <span className="text-purple-300 font-semibold">{activeCategory?.nome.replace("Concurso", "")}</span>! É a hora de recebermos com muitas palmas o competidor de número{" "}
                <span className="text-white font-black">#{activeParticipant.ordemAp}</span>! Ele(a) vem apresentar o personagem{" "}
                <span className="text-amber-400 font-bold italic">{activeParticipant.cosplayName || "Cosplay"}</span> de{" "}
                <span className="text-emerald-400 font-semibold">{activeParticipant.origemOrigem || "Geral"}</span>! Que suba ao palco:{" "}
                <span className="text-white font-extrabold">{activeParticipant.nome}</span>! Solta o som, produção!&rdquo;
              </p>
            </div>
          </div>

          {/* Dicas de Palco de Acordo com Estado */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 block uppercase border-b border-slate-850 pb-1">
              DIRETRIZES DE PALCO (ACOMPANHAMENTO COORDENADOR)
            </span>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              {stageState.screenState === "calling" && (
                <li className="text-amber-450 font-medium">
                  Aguarde o competidor se posicionar. Certifique-se de que o cabo de áudio está conectado ou se ele autorizou soltar a trilha.
                </li>
              )}
              {stageState.screenState === "performing" && (
                <li>
                  Mantenha distância de foco do cosplay. Observe caso ocorra queda de partes da armadura ou se ele precisar de assistência da Staff de palco.
                </li>
              )}
              {stageState.screenState === "voting_open" && (
                <li className="text-emerald-400 font-medium">
                  Peça uma calorosa rodada de aplausos! Direcione a atenção para a bancada de jurados e diga: &ldquo;Agora os nossos jurados técnicos estão avaliando as notas...&rdquo;
                </li>
              )}
              {stageState.screenState === "reveal_scores" && (
                <li className="text-purple-400 font-medium">
                  Crie suspense! Quando o Coordenador apertar &ldquo;Revelar Yuki&rdquo;, anuncie a nota dela no microfone, gerando torcida e clamor na plateia!
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
