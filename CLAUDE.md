# Formiga: notas para continuar o trabalho

PWA de planner, listas, notas e agenda, em um arquivo só (`index.html`, JavaScript puro, sem build). Dono: Artur Fassoni (fala português do Brasil; responda em português).

- Site: https://arturfassoni.github.io/formiga/ (GitHub Pages, branch `main`, raiz)
- Repositório: https://github.com/arturfassoni/formiga
- Pasta local: `/Users/fassoni/Library/CloudStorage/OneDrive-Personal/__agora/_projetos/for` (OneDrive; o `origin` já aponta para o GitHub, o push sai direto daqui)

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
- **Agenda interativa (v29 a v32):** na grade, arrastar um evento move (muda horário e dia), arrastar a faixa do rodapé redimensiona, arrastar num espaço vazio cria já com duração (`evDrag`, `newDrag`, `evCommit`), passo de 15 min. Mouse começa após 4 px; toque exige toque longo (~0,4 s). Eventos do Google só se movem se `gReason` vazio, com hora e no mesmo dia (PATCH com etag). Botão direito num evento abre menu "Excluir" (`evMenu`, só mouse). Puxador na base da agenda muda a altura da hora (`formiga-aghp`, por aparelho; duplo clique restaura). Janela do compromisso do Formiga tem "Salvar"; Esc fecha as janelas de evento; em tela de toque abrir evento existente não foca o título (`noKbd`).
- **Sincronizar (v35):** botão `#syncBtn` no topo (`syncAll`): `gSync()` do Drive + recarrega a Agenda do Google; só aparece se Drive ou Agenda estiverem ligados. A agenda só liga sozinha na primeira conexão (`firstCal` em `authApply`). O app se recarrega sozinho quando há `sw.js` novo (`controllerchange`). Mês é leve (só números, clique vai para o dia). Sombra do arraste por toque é corrigida para o zoom (bloco "Corrige a sombra do arraste" antes de `evDrag`), ainda sem teste em aparelho.
- **Barra de cima no celular (v36):** `#agBtn` só com ícone, colado nos modos; `.top` sem quebra de linha; logo escondido em ≤430 px. Com um modo "fechado", só a agenda aparece (CSS `body.closed` esconde colhead/weeks/shead exceto `.agenda`) e `#agBtn`/`#syncBtn` continuam visíveis.
- **Posição do clique e zoom:** o Chromium do VS Code devolve `getBoundingClientRect` já em coordenadas com zoom, enquanto `clientY` não. Use sempre `colY`/`rectLocal`/`zoomF` (nunca `offsetHeight` nem `offsetY`).
- **Listas e notas no computador:** `isSwipe()` é verdadeiro em todo modo que não seja Planner, então Listas e Notas usam o layout em botões (caixa aberta, botão por lista/nota, clique abre) também no desktop.
- **Cuidado ao declarar:** `const` de diálogos (ex.: `gedlg`) são declarados no meio do script; usá-los antes da declaração derruba o script inteiro e `node --check` não pega. Registrar handlers só depois da declaração.
- **Excluir:** sem confirmação; o "Desfazer" (`offerUndo`, 7 s) restaura o estado. Para eventos do Google, o desfazer recria o evento. "Apagar tudo e começar do zero" ainda confirma.
- **Assistente por voz:** `worker.js` (Cloudflare). `ASSIST_URL` ainda é o texto de preenchimento em `index.html`, ou seja, **não está configurado**.
- Arquivos de apoio: `PUBLICAR.md` (guia de publicação), `NOTAS-IA.md`, `privacidade.html`.

- **v37:** cores de evento = as 11 cores do Google (`GCOL`, `gcHex`, `evTone`); eventos do Google gravam `colorId` (aparece no Google Agenda), compromissos do Formiga guardam `color:"gNN"`; `fcolor` antigo ainda é lido. Linha da hora atual (`.nowline`, `nowTick`). Agenda do Google carrega janela larga (-14/+43 dias) e guarda `calRaw` por 10 min (navegar não espera rede). Eventos que se repetem: edita, move e exclui só a ocorrência (PATCH no id da instância; mover de agenda desativado). Botão ✓ no formulário de nova tarefa. Menu: "Importar notas do Keep (.html)" (`keepParse`, vai para a caixa de notas "Keep", ignora notas na lixeira; checklist vira linhas ☐/☑).
- **Botões da agenda na lateral (v38):** opção no menu (`#agSideBtn`, `formiga-agside` por aparelho). Em vez dos botões de texto no topo, coluna à direita (`.agside`) com botões redondos H, 3, 5, 7, M, depois ‹, › e + (a barra de cima some; só o Mês mantém a linha com o nome do mês). A classe da agenda é `agsd` (a classe `.side` já é da barra lateral do app; não reutilizar).

## Google Cloud (projeto do Formiga)

- Status da tela de permissão: **Em produção**, app **não verificado**. Quem entra vê "O Google não verificou este app" e precisa tocar em **Avançado → Acessar Formiga (não seguro)** na primeira vez. Limite de 100 usuários até a verificação. Não há lista de usuários de teste nem expiração de 7 dias.
- O Client ID está no próprio `index.html` (`GOOGLE_CLIENT_ID`). É público por natureza.
- O domínio `arturfassoni.github.io` é compartilhado com outros repositórios do Artur (Jupyter Book), então o `localStorage` é compartilhado. O Artur aceitou esse risco.

## Estado atual

Publicado e funcionando (cache `formiga-v38`): tema claro/escuro, tamanho do texto, Planner com navegação nova, listas e notas (duplicar, compartilhar por texto, colar lista), Agenda do Google com ver, editar, criar, excluir e cor por evento, botão de atualizar, login único, exclusão sem confirmação com desfazer, e a agenda interativa descrita abaixo.

Nada pendente de publicação. Conferir `git status` mesmo assim.

O backup `formiga-backup-agenda.json` que o Artur recebeu da primeira versão é compatível (formato 4). Importar substitui todos os dados.

## Próximos passos (ideias, nada combinado ainda)

1. Testar o desfazer de evento do Google (excluir e mover).
2. Agenda, etapa 3: eventos que se repetem e eventos com convidados (hoje só abre no Google).
3. Mostrar no `PUBLICAR.md` o passo de convidar amigos (hoje não precisa: app em produção; só avisar do "Avançado → Acessar Formiga") e incluir o texto de convite para WhatsApp.
4. Se o grupo de amigos passar de ~100 pessoas ou o aviso de "não verificado" incomodar: iniciar a verificação do app no Google (exige domínio, política de privacidade e vídeo de demonstração).
5. Assistente por voz: publicar o `worker.js` na Cloudflare e preencher `ASSIST_URL` (Parte 5 do `PUBLICAR.md`).
6. Cor do evento aparecer também no Google (usaria as 11 cores do Google em vez da paleta do Formiga). O Artur ainda não decidiu.
7. Remover do app os itens de exemplo e de teste, se o Artur quiser limpar a base importada.
