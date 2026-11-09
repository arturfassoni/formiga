# Formiga: notas para continuar o trabalho

PWA de planner, listas, notas e agenda, em um arquivo só (`index.html`, JavaScript puro, sem build). Dono: Artur Fassoni (fala português do Brasil; responda em português).

- Site: https://arturfassoni.github.io/formiga/ (GitHub Pages, branch `main`, raiz)
- Repositório: https://github.com/arturfassoni/formiga
- Pasta local: `/Users/fassoni/Github/formiga-pages`

## Regras de trabalho

1. **Só publicar (git commit + push) quando o Artur disser "pode publicar" ou equivalente.** Cada autorização vale para a alteração em questão.
2. **Todo publish exige trocar o número do cache em `sw.js`** (`const CACHE = "formiga-vNN"`). Sem isso o celular não pega a versão nova. Versão atual no arquivo: ver `sw.js`.
3. Depois do push, conferir se entrou: `curl -s https://arturfassoni.github.io/formiga/sw.js | sed -n 2p` (o deploy leva 30 a 90 s). Para o usuário ver a versão nova, o app precisa ser aberto duas vezes.
4. Antes de publicar, checar sintaxe: extrair o conteúdo de `<script>` e rodar `node --check`.
5. Testes visuais: Google Chrome headless (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --screenshot=...`). Não há Node para testes, nem `gh` instalado; o `git push` funciona (Artur já está logado).
6. Se o deploy falhar com "Internal server error", é problema do GitHub: esperar a página de status e reenviar com `git commit --allow-empty`.
7. Terminar os commits com a linha `Co-Authored-By` indicada pelo ambiente.

## Arquitetura (tudo em `index.html`)

- **Dados:** objeto `state` (versão 4) em `localStorage` (`formiga-v1`), com `cards`, `lists` (chaves `bloco|caixa`, `perm|caixa`, `L|idLista`), `cols` (caixas), `events` (compromissos só do Formiga), `slists`/`scats` (listas e categorias), `nitems`/`ncats` (notas), `prefs`, `phases`. `migrate()` e `mig4()` convertem versões antigas. Importar um backup substitui tudo.
- **Sincronização:** Google Drive, pasta oculta do app (`drive.appdata`), arquivo `formiga-dados.json`.
- **Login:** Google Identity Services (token implícito, vale ~1 h, sem refresh). Uma única autorização reúne Drive e Agenda (`authAsk`, `authOnToken`, `authApply`, `authInit`). Escopos: `drive.appdata`, `calendar.readonly`, `calendar.events`. Token guardado em `formiga-tok`.
- **Google Agenda:** API REST v3. Leitura (`calList`, eventos, cores), edição e criação (`openGEdit`, `geSave`, `geDel`, `gApi`), `If-Match` com etag, `sendUpdates=none`. Só edita eventos sem convidados, sem repetição e do tipo padrão (`gReason`). A cor do evento escolhida no Formiga fica em `extendedProperties.private.fcolor` e só aparece no Formiga.
- **Planner:** tabela caixas x tempos. Menu de três traços no canto, clique em título de caixa/tempo, memória de tempos por caixa (`formiga-boxmem`), deslizar para mudar de caixa no celular, bolinhas de página embaixo, ordem global das caixas no Hoje. "Fechar" um modo mostra tela vazia de propósito.
- **Zoom do texto:** `body{zoom:var(--zoom)}`. Cuidado: `event.offsetX/Y` vem multiplicado pelo zoom. Use `getBoundingClientRect` e divida pela razão `rect.height/offsetHeight` (já corrigido na grade da agenda).
- **Excluir:** sem confirmação; o "Desfazer" (`offerUndo`, 7 s) restaura o estado. Para eventos do Google, o desfazer recria o evento. "Apagar tudo e começar do zero" ainda confirma.
- **Assistente por voz:** `worker.js` (Cloudflare). `ASSIST_URL` ainda é o texto de preenchimento em `index.html`, ou seja, **não está configurado**.
- Arquivos de apoio: `PUBLICAR.md` (guia de publicação), `NOTAS-IA.md`, `privacidade.html`.

## Google Cloud (projeto do Formiga)

- Status da tela de permissão: **Em produção**, app **não verificado**. Quem entra vê "O Google não verificou este app" e precisa tocar em **Avançado → Acessar Formiga (não seguro)** na primeira vez. Limite de 100 usuários até a verificação. Não há lista de usuários de teste nem expiração de 7 dias.
- O Client ID está no próprio `index.html` (`GOOGLE_CLIENT_ID`). É público por natureza.
- O domínio `arturfassoni.github.io` é compartilhado com outros repositórios do Artur (Jupyter Book), então o `localStorage` é compartilhado. O Artur aceitou esse risco.

## Estado atual

Publicado e funcionando: tema claro/escuro, tamanho do texto, Planner com navegação nova, listas e notas (duplicar, compartilhar por texto, colar lista), Agenda do Google com ver, editar, criar, excluir e cor por evento, botão de atualizar, login único.

**Alterado, mas não publicado ainda:** retirada das confirmações dos botões de excluir (tarefa, lista, nota, caixa, compromisso, evento do Google), com desfazer também para eventos do Google. Conferir `git status`; se `index.html` e `sw.js` aparecem modificados, falta o "pode publicar" e o commit.

O backup `formiga-backup-agenda.json` que o Artur recebeu da primeira versão é compatível (formato 4). Importar substitui todos os dados.

## Próximos passos (ideias, nada combinado ainda)

1. Publicar a retirada das confirmações (aguardando autorização) e testar o desfazer de evento do Google.
2. Agenda, etapa 2: arrastar e redimensionar eventos na grade.
3. Agenda, etapa 3: eventos que se repetem e eventos com convidados (hoje só abre no Google).
4. Mostrar no `PUBLICAR.md` o passo de convidar amigos (hoje não precisa: app em produção; só avisar do "Avançado → Acessar Formiga") e incluir o texto de convite para WhatsApp.
5. Se o grupo de amigos passar de ~100 pessoas ou o aviso de "não verificado" incomodar: iniciar a verificação do app no Google (exige domínio, política de privacidade e vídeo de demonstração).
6. Assistente por voz: publicar o `worker.js` na Cloudflare e preencher `ASSIST_URL` (Parte 5 do `PUBLICAR.md`).
7. Cor do evento aparecer também no Google (usaria as 11 cores do Google em vez da paleta do Formiga). O Artur ainda não decidiu.
8. Remover do app os itens de exemplo e de teste, se o Artur quiser limpar a base importada.
