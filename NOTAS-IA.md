# Formiga · Notas sobre assistente por voz e texto

Pesquisa feita em novembro de 2026. Objetivo: a pessoa fala ou digita
"dentista segunda às 12, natação terça às 16, tarefa terminar relatório em Projetos"
e o app executa.

## Arquitetura proposta (em qualquer opção)

1. **Voz → texto:** Web Speech API, embutida no navegador. Sem download, sem custo.
   Funciona bem no Chrome (computador e Android) e no Safari. Whisper no navegador
   (Transformers.js) só se for preciso independência do navegador.
2. **Texto → ações:** o modelo devolve apenas uma lista de ações num formato fixo (JSON):
   `criar_compromisso`, `criar_tarefa`, `adicionar_item_lista`, `criar_nota`…
   O modelo extrai "segunda, 12h"; o app calcula a data.
3. **Confirmação:** o app mostra o que vai fazer e a pessoa confirma.
   Isso cobre os erros ocasionais, principalmente de modelos pequenos.

## Opção A · Modelo pequeno no aparelho (WebLLM ou Transformers.js)

Tudo roda no navegador, nada sai do aparelho, sem custo.

| Modelo | Download (uma vez) | Observação |
|---|---|---|
| Qwen2.5-0.5B-Instruct | ~280 MB | Leve; bom para comandos simples |
| Qwen3-0.6B | ~335–350 MB | Mais novo; exige ~1,4 GB de memória de vídeo |
| Llama-3.2-1B-Instruct | ~700 MB | Segue instruções melhor; ~0,9 GB de memória de vídeo |
| Qwen2.5-1.5B-Instruct | ~870 MB | O mais capaz que cabe com folga; bom em português |

- Tamanho do app: hoje ~130 KB. A biblioteca do modelo soma alguns MB e só carrega
  para quem ativar o assistente. O modelo é baixado uma vez e fica guardado.
- Requisitos: navegador com WebGPU. Bom em computadores e Androids recentes;
  aparelhos antigos ou de entrada podem não ter memória de vídeo suficiente.
- Recomendação: Qwen2.5-1.5B com saída travada em JSON; Qwen2.5-0.5B como opção leve.
- O assistente deve ser **opcional** (ativado em configurações), por causa do download.

## Opção B · Chave de API da própria pessoa

Sem download, muito mais preciso, funciona em qualquer celular. Os comandos saem do
aparelho e vão para o provedor.

- **Gemini (Google AI Studio):** tem nível **gratuito**, sem cartão, para os modelos Flash,
  com limites de uso por minuto e por dia (folgados para este uso). No nível gratuito, o
  Google pode usar o conteúdo enviado para melhorar seus produtos.
- **Claude (Anthropic):** a API é **paga por uso**, com créditos pré-pagos, e é cobrada à
  parte da assinatura do Claude. Chamadas direto do navegador são permitidas com o
  cabeçalho `anthropic-dangerous-direct-browser-access: true`; como a chave é da própria
  pessoa e fica só no aparelho dela, o risco é aceitável.
- Custo real: cada comando usa poucas centenas de tokens; mesmo pago, fica em frações de
  centavo por comando.

## Opção C · IA embutida no Chrome (Gemini Nano)

Sem download pelo app, mas só no Chrome de computador e com exigências altas
(cerca de 22 GB livres em disco e mais de 4 GB de memória de vídeo). Não serve para celular hoje.

## Sugestão de caminho

1. Primeiro, a **Opção B com Gemini gratuito**: rápida de fazer e funciona para todo mundo.
2. Depois, a **Opção A** como alternativa "100% privada" para quem tiver aparelho compatível.
3. Em ambas, o mesmo formato de ações e a mesma tela de confirmação.
