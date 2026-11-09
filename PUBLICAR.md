# Formiga · Como publicar no GitHub Pages

Este guia coloca o Formiga no ar com endereço próprio, login com Google, dados salvos no Google Drive de cada pessoa, assistente por voz e, opcionalmente, o Google Agenda dentro do app.

Você faz isto **uma vez**. Depois, quem usa só abre o link e toca em **Entrar com Google**.

**Custo:** zero. **Tempo:** cerca de 1 hora para tudo (30 minutos sem o assistente e sem o Google Agenda).

---

## O que você vai precisar

- Uma conta Google (a sua).
- Uma conta no **GitHub** (gratuita), para hospedar o app.
- Uma conta na **Cloudflare** (gratuita), só se quiser o assistente por voz.
- Os arquivos desta pasta.

### Arquivos desta pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | O app inteiro |
| `sw.js` | Faz o app funcionar sem internet e ser instalável |
| `manifest.webmanifest` | Nome e ícone quando instalado no celular |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `formiga-icone.svg` | Ícones |
| `privacidade.html` | Política de privacidade (exigida pelo Google) |
| `worker.js` | Código do assistente (vai para a Cloudflare, Parte 5) |
| `LICENSE` | Licença MIT |
| `PUBLICAR.md`, `NOTAS-IA.md` | Este guia e as notas sobre IA |

Há **duas linhas** para você preencher no `index.html`:

```
const GOOGLE_CLIENT_ID="COLE_AQUI_O_CLIENT_ID.apps.googleusercontent.com";
const ASSIST_URL="COLE_AQUI_A_URL_DO_WORKER";
```

Enquanto estiverem assim, o app funciona normalmente, só que salvando no próprio aparelho, sem login e sem assistente.

---

## Parte 1 · Colocar o app no ar (GitHub Pages)

1. Crie uma conta em **github.com**. O nome de usuário vai aparecer no endereço, por exemplo `arturfassoni.github.io/formiga`.
2. No topo, clique em **+ → New repository**.
   - Repository name: `formiga`
   - Marque **Public**
   - Clique em **Create repository**
3. Na página do repositório, clique em **uploading an existing file**.
4. Arraste **todos os arquivos desta pasta** e clique em **Commit changes**.
5. Vá em **Settings → Pages**.
   - Source: **Deploy from a branch**
   - Branch: **main**, pasta **/ (root)** → **Save**
6. Aguarde 1 a 2 minutos e recarregue. Aparece o endereço do app:
   `https://SEU-USUARIO.github.io/formiga/`

Abra o endereço: o app já funciona, salvando no aparelho. **Anote esse endereço**, ele será usado nas próximas partes.

> Até aqui, você já pode mandar o link para um grupo pequeno testar.

---

## Parte 2 · Login com Google e dados no Drive

Os menus do Google mudam de nome de vez em quando. Se algum não bater exatamente, procure o equivalente.

### 2.1 Criar o projeto
1. Acesse **console.cloud.google.com** com a sua conta.
2. No seletor de projeto (topo da página) → **New project** → nome `Formiga` → **Create**. Selecione o projeto criado.

### 2.2 Ativar a API do Drive
3. Menu **APIs & Services → Library** → busque **Google Drive API** → **Enable**.

### 2.3 Configurar a tela de login
4. Menu **Google Auth Platform** (em alguns painéis: **OAuth consent screen**) → **Get started**:
   - App name: `Formiga`
   - User support email: o seu e-mail
   - Audience: **External**
   - Contact information: o seu e-mail
   - Aceite os termos → **Create**
5. Em **Branding**:
   - Application home page: `https://SEU-USUARIO.github.io/formiga/`
   - Application privacy policy link: `https://SEU-USUARIO.github.io/formiga/privacidade.html`
   - **Não envie logo** por enquanto (logo exige verificação extra).
6. Em **Data access** → **Add or remove scopes** → procure e marque:
   `https://www.googleapis.com/auth/drive.appdata` → **Update** → **Save**.
   Esse escopo é **não sensível**: o app só enxerga uma pasta oculta e própria no Drive de cada pessoa.

### 2.4 Criar a chave do app (Client ID)
7. Em **Clients** (ou **APIs & Services → Credentials**) → **Create client**:
   - Application type: **Web application**
   - Name: `Formiga web`
   - **Authorized JavaScript origins** → **Add URI** → `https://SEU-USUARIO.github.io`
     (sem `/formiga` e sem barra no final)
   - **Create** e **copie o Client ID** (termina em `.apps.googleusercontent.com`).

### 2.5 Publicar para todos
8. Em **Audience** → **Publish app** → confirme. O status passa para **In production**.
   - Importante: em modo de teste, só pessoas cadastradas entram e o login expira a cada 7 dias. Com o escopo não sensível, pode publicar direto, sem aviso de "app não verificado".

---

## Parte 3 · Colocar o Client ID no app

1. No GitHub, abra o `index.html` e clique no **lápis** (Edit).
2. Pressione **Ctrl+F** (ou Cmd+F) e busque `COLE_AQUI_O_CLIENT_ID`.
3. Substitua o texto entre aspas pelo Client ID copiado. A linha fica assim:
   ```
   const GOOGLE_CLIENT_ID="123456-abc.apps.googleusercontent.com";
   ```
4. Clique em **Commit changes**.
5. No `privacidade.html`, troque `seu-email@exemplo.com` pelo seu e-mail e faça **Commit**.

---

## Parte 4 · Testar e instalar

1. Abra o endereço do app no computador. Aparece a faixa **Entrar com Google**.
2. Entre, autorize e crie uma tarefa.
3. Abra o mesmo endereço no celular, entre com a mesma conta: a tarefa aparece.
4. Instale no celular:
   - **Android (Chrome):** menu ⋮ → **Instalar app** (ou **Adicionar à tela inicial**).
   - **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.

---

## Parte 5 · Assistente por voz e texto (opcional)

O botão redondo com microfone, no canto da tela, abre o assistente. A pessoa fala ou escreve, por exemplo:

> dentista segunda às 12, natação toda terça às 4 e tarefa terminar o relatório em Trabalho

O app mostra o que entendeu e só cria depois da confirmação. A chave do Gemini é **sua** e fica escondida num pequeno servidor gratuito (o Worker); quem usa não configura nada.

**O que vai para o Google:** apenas o texto do pedido, a data de hoje e os nomes das caixas e listas. O conteúdo das tarefas, notas e compromissos não sai do aparelho.

### 5.1 Chave do Gemini
1. Acesse **aistudio.google.com** com a sua conta.
2. **Get API key → Create API key** (pode escolher o projeto `Formiga`).
3. Copie a chave. Ela vai só para a Cloudflare, nunca para o GitHub.

### 5.2 Worker na Cloudflare
1. Crie uma conta em **dash.cloudflare.com**.
2. **Workers & Pages → Create → Create Worker** (modelo "Hello World").
3. Nome: `formiga-assistente` → **Deploy**.
4. **Edit code** → apague tudo → cole o conteúdo do arquivo **worker.js** → **Deploy**.
5. Volte ao Worker → **Settings → Variables and Secrets → Add**:
   - Tipo **Secret**, nome `GEMINI_API_KEY`, valor: a chave do 5.1
   - Tipo **Text**, nome `ALLOWED_ORIGIN`, valor: `https://SEU-USUARIO.github.io` (sem barra no final)
   - **Deploy**
6. Copie o endereço do Worker: `https://formiga-assistente.SEU-SUBDOMINIO.workers.dev`

### 5.3 Ligar no app
1. No GitHub, edite o `index.html`, busque `COLE_AQUI_A_URL_DO_WORKER` e cole o endereço do Worker entre as aspas.
2. **Commit changes**. O botão do microfone aparece no app.

### Bom saber
- O plano gratuito da Cloudflare e a cota gratuita do Gemini cobrem com folga um grupo de amigos e família. A cota do Gemini é por projeto, ou seja, dividida entre todos.
- No nível gratuito, o Google pode usar o texto enviado para melhorar seus produtos. No nível pago (ativável no AI Studio, com custo de fração de centavo por pedido), não.
- O Worker só aceita pedidos vindos do endereço do seu app. Para limitar abusos, a Cloudflare permite criar uma regra de limite em **Security → WAF → Rate limiting rules**.

---

## Parte 6 · Google Agenda dentro do app (opcional)

Quem quiser ativa em **••• → Mostrar Google Agenda**. Os eventos de todas as agendas visíveis da pessoa aparecem na Agenda do Formiga, com as cores do Google, junto dos compromissos criados no app. É **somente leitura**: o Formiga mostra, não altera.

### 6.1 Ativar
1. No Google Cloud: **APIs & Services → Library → Google Calendar API → Enable**.
2. Em **Data access**, adicione o escopo `https://www.googleapis.com/auth/calendar.readonly` → **Save**.
3. Nada muda no código: o app já está pronto.

### 6.2 Verificação do Google
O escopo da agenda é **sensível**. Até o app ser verificado:
- quem ativar o Google Agenda vê um aviso de "app não verificado" (dá para seguir em **Avançado → Ir para Formiga**);
- no máximo 100 pessoas podem ativar esse recurso.

O login com o Drive **não é afetado**: a permissão da agenda só é pedida a quem ativar a opção.

Para remover o aviso, peça a verificação em **Google Auth Platform → Verification Center**. O Google costuma pedir:
- página inicial e política de privacidade publicadas (já estão no repositório);
- comprovar que o endereço é seu, pelo **Google Search Console**: adicione a propriedade com o endereço do app, baixe o arquivo HTML de verificação que ele fornece e envie para o repositório;
- um vídeo curto (pode ser não listado no YouTube) mostrando o login e o uso da agenda no app;
- uma justificativa, por exemplo: "O app mostra os eventos do usuário numa grade semanal junto com suas tarefas. Somente leitura; nada é armazenado fora do aparelho."

Se o Google não aceitar o domínio `github.io` na verificação, a saída é registrar um domínio próprio (por exemplo `formiga.app.br`) e apontá-lo para o GitHub Pages em **Settings → Pages → Custom domain**.

---

## Como mandar para as pessoas

Mande o link e esta mensagem:

> Este é o Formiga, um app de organização que estou fazendo. Abre o link, toca em "Entrar com Google" e pronto. No celular, usa "Adicionar à tela inicial" para virar um app. Teus dados ficam numa pasta privada no teu Google Drive; ninguém mais vê, nem eu.

---

## Como atualizar o app depois

1. No GitHub, clique em **Add file → Upload files** e envie o `index.html` novo. Depois abra o arquivo no lápis e recoloque o **Client ID** e o endereço do **Worker** (Partes 3 e 5).
2. No `sw.js`, aumente o número em `const CACHE = "formiga-v2";` (v3, v4…) e faça **Commit**. Isso faz os aparelhos pegarem a versão nova.

As atualizações não afetam os dados das pessoas.

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| Erro `origin_mismatch` ao entrar com Google | Endereço não cadastrado no Client ID | Em **Clients**, confira **Authorized JavaScript origins**: `https://SEU-USUARIO.github.io`, sem barra no final |
| A janela de login não abre | Navegador bloqueou o pop-up | Permita pop-ups para o site e toque de novo em **Entrar com Google** |
| Aparece "Sincronizar" de tempos em tempos | O login do Google dura cerca de 1 hora | Um toque em **Sincronizar** renova, sem senha. É normal em apps sem servidor |
| O assistente diz que não conseguiu interpretar | Worker sem a chave ou com origem errada | Confira as variáveis `GEMINI_API_KEY` e `ALLOWED_ORIGIN` no Worker |
| O app não mostra a versão nova | Cache do aparelho | Aumente o número no `sw.js`; no aparelho, feche e abra o app duas vezes |
| Login pede reconsentimento a cada 7 dias | App em modo de teste | Em **Audience**, clique em **Publish app** |
