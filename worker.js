// Formiga · Assistente
// Cloudflare Worker que recebe o comando do app e pede ao Gemini para transformá-lo em ações.
// Variáveis (em Settings → Variables and Secrets):
//   GEMINI_API_KEY  (Secret)  chave do Google AI Studio
//   ALLOWED_ORIGIN  (Text)    ex.: https://seu-usuario.github.io  (pode ter várias, separadas por vírgula)
//   MODEL           (Text, opcional) ex.: gemini-3.1-flash-lite
//   GOOGLE_CLIENT_ID      (Text)    o mesmo Client ID do index.html (login sem expirar)
//   GOOGLE_CLIENT_SECRET  (Secret)  o segredo do mesmo cliente, no Google Cloud
// O Worker não guarda nada: só repassa o texto e devolve as ações.
// Rotas /auth/code e /auth/refresh: trocam o código do login do Google por um token que se renova sozinho.

const SCHEMA = {
  type: "OBJECT",
  properties: {
    mensagem: { type: "STRING", description: "Observação curta para a pessoa, só se algo ficou ambíguo. Senão, vazio." },
    acoes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          tipo: { type: "STRING", enum: ["compromisso", "tarefa", "item_lista", "nota"] },
          titulo: { type: "STRING" },
          data: { type: "STRING", description: "AAAA-MM-DD escolhida da lista de dias. Vazio se não houver." },
          repetir_semanal: { type: "BOOLEAN" },
          inicio: { type: "STRING", description: "HH:MM, 24 horas" },
          fim: { type: "STRING", description: "HH:MM, 24 horas. Vazio se não informado." },
          caixa: { type: "STRING", description: "Para tarefa: uma das caixas do planner. Para nota: uma das caixas de notas." },
          lista: { type: "STRING", description: "Para item_lista: uma das listas existentes ou um nome novo." },
          texto: { type: "STRING", description: "Detalhes extras (conteúdo da nota ou observações da tarefa)." }
        },
        required: ["tipo", "titulo"]
      }
    }
  },
  required: ["acoes"]
};

function instrucoes(b) {
  const lst = a => (Array.isArray(a) ? a : []).slice(0, 60).map(s => String(s).slice(0, 60)).join(", ") || "(nenhuma)";
  return `Você converte pedidos em português em ações para um app de organização chamado Formiga.
Responda somente com o JSON do esquema. Não invente itens que a pessoa não pediu.

Tipos de ação:
- compromisso: algo com horário (consulta, aula, reunião). Use "data" da lista de dias. Se a pessoa disser "toda segunda", "todas as terças" etc., use repetir_semanal=true e a data do próximo dia correspondente.
- tarefa: algo a fazer, sem horário. "caixa" deve ser a caixa do planner mais adequada. "data" só se a pessoa indicar quando (ex.: "semana que vem" → um dia da próxima semana).
- item_lista: algo para pôr numa lista (compras, filmes, viagem). "lista" deve ser a lista existente mais adequada; se nenhuma servir, um nome novo curto.
- nota: um texto para guardar. "titulo" curto, conteúdo em "texto", "caixa" uma das caixas de notas.

Regras de horário: "às 12" = 12:00; "meio-dia" = 12:00; horas de 1 a 7 sem "da manhã" normalmente são da tarde (ex.: "às 4" = 16:00). Sem fim informado, deixe "fim" vazio.
Um pedido pode gerar várias ações; vários itens de uma lista viram várias ações item_lista.

Hoje: ${String(b.hoje || "").slice(0, 40)}
A semana começa em: ${String(b.inicioSemana || "segunda-feira").slice(0, 20)}
Próximos dias:
${(Array.isArray(b.dias) ? b.dias : []).slice(0, 31).map(s => String(s).slice(0, 40)).join("\n")}

Caixas do planner: ${lst(b.caixas)}
Listas: ${lst(b.listas)}
Caixas de notas: ${lst(b.caixasNotas)}`;
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = String(env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
    const ok = allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": ok ? origin : (allowed[0] || "null"),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json({ erro: "Use POST" }, 405, cors);
    if (!ok) return json({ erro: "Origem não permitida" }, 403, cors);
    if (!env.GEMINI_API_KEY) return json({ erro: "Chave do Gemini não configurada" }, 500, cors);

    let b;
    try { b = await req.json(); } catch { return json({ erro: "Pedido inválido" }, 400, cors); }
    const path = new URL(req.url).pathname;
    if (path === "/auth/code" || path === "/auth/refresh") {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return json({ erro: "Login não configurado" }, 500, cors);
      const form = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET });
      if (path === "/auth/code") {
        form.set("grant_type", "authorization_code"); form.set("redirect_uri", "postmessage"); form.set("code", String(b.code || ""));
      } else {
        form.set("grant_type", "refresh_token"); form.set("refresh_token", String(b.refresh_token || ""));
      }
      const g = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
      const d = await g.json().catch(() => ({}));
      if (!g.ok) return json({ erro: d.error || "erro", invalido: d.error === "invalid_grant" }, g.status === 400 ? 400 : 502, cors);
      return json({ access_token: d.access_token, expires_in: d.expires_in, scope: d.scope, refresh_token: d.refresh_token || undefined }, 200, cors);
    }
    const texto = String(b.texto || "").slice(0, 600).trim();
    if (!texto) return json({ acoes: [] }, 200, cors);

    const models = [env.MODEL, "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-2.5-flash"].filter(Boolean);
    const payload = {
      systemInstruction: { parts: [{ text: instrucoes(b) }] },
      contents: [{ role: "user", parts: [{ text: texto }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json", responseSchema: SCHEMA }
    };
    // Tenta o modelo configurado; se ele não existir mais (404), passa para o próximo.
    let r;
    for (const model of models) {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify(payload)
      });
      if (r.status !== 404) break;
    }
    if (!r.ok) return json({ erro: "Gemini respondeu " + r.status }, 502, cors);
    const d = await r.json();
    const t = (d?.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    let out;
    try { out = JSON.parse(t); } catch { out = { acoes: [] }; }
    if (!Array.isArray(out.acoes)) out.acoes = [];
    return json(out, 200, cors);
  }
};
