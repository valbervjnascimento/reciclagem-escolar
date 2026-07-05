# ♻️ EcoGestão Escolar

Sistema para professores registrarem a coleta de materiais recicláveis
(plástico, alumínio e frasco de perfume) das suas turmas, com painel
administrativo central para a escola.

## Stack

- Next.js 16 (App Router) + React 19
- Firebase Authentication + Firestore (dados)
- Firebase Admin SDK (rotas de API do painel admin)
- Tailwind CSS v4
- Recharts (gráficos) + jsPDF (relatório em PDF)

## Estrutura principal

```
app/
  page.js              → landing page
  login/page.js        → login + "esqueci minha senha"
  cadastro/page.js      → cadastro de professor
  painel/page.js        → painel do professor (turma, alunos, coletas)
  admin/page.js         → painel administrativo da escola
  api/admin/            → rotas server-side (Admin SDK) usadas pelo /admin
  components/ui.js       → componentes visuais reutilizáveis
  hooks/useAuth.js       → hook de sessão do Firebase Auth
lib/
  duplicidade.js         → regra de detecção de registros suspeitos
  firebaseAdmin.js       → inicialização do Firebase Admin SDK (server-only)
firestore.rules          → regras de segurança recomendadas para o Firestore
```

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Funcionalidades

### Professor (`/painel`)
- Cria e gerencia sua turma e a lista de alunos (CRUD completo).
- Lança, edita e exclui registros de coleta (plástico, alumínio, frasco).
- Ao salvar um registro, o sistema verifica se já existe outro lançamento
  para o mesmo aluno no mesmo dia. Se encontrar, **não bloqueia nem apaga
  nada** — mostra um aviso e, se o professor confirmar, salva o registro
  já marcado como "possível duplicidade" (nível *forte* se os valores são
  idênticos, ou *fraca* se são diferentes). O professor pode marcar como
  "revisado" depois de conferir.
- Layout responsivo (Tailwind) para celular, tablet e notebook — sem
  depender de JavaScript para decidir o layout.

### Administrador (`/admin`, restrito por e-mail)
- Dashboard com KPIs e gráfico por categoria de material.
- Gestão total: remover professores, turmas e alunos.
- Aba **Professores**: corrigir e-mail cadastrado errado, ou gerar uma
  **senha temporária** para o professor (ver seção abaixo).
- Aba **Duplicidades**: lista central de todos os registros suspeitos de
  toda a escola, para revisão.
- Exportação de relatório em PDF.

## Sobre "ver a senha do professor"

Não é possível — nem para o administrador, nem em nenhum sistema sério —
recuperar a senha original de alguém, porque ela nunca é armazenada em
texto puro (o Firebase guarda apenas um hash irreversível). A alternativa
segura, que é o que foi implementado aqui, é o admin **gerar uma nova
senha temporária** para o professor (aba Professores > "Resetar senha").
Essa senha aparece **uma única vez** na tela para o admin copiar e
entregar pessoalmente; ela não fica salva em nenhum lugar do sistema.

Para professores que digitaram um e-mail inválido no cadastro (por isso
não recebem o link de "esqueci minha senha"), use "Corrigir e-mail" na
mesma aba.

## Configurando o painel administrativo (Admin SDK)

As ações de resetar senha e corrigir e-mail rodam em rotas de servidor
(`app/api/admin/*`) que usam o Firebase Admin SDK, porque só ele pode
alterar a conta de **outro** usuário (o SDK do cliente só altera a conta
de quem está logado).

1. No [Firebase Console](https://console.firebase.google.com/), abra o
   projeto → **Configurações do projeto** → **Contas de serviço**.
2. Clique em **Gerar nova chave privada** (baixa um `.json`).
3. Copie o conteúdo do arquivo e cole em `.env.local` (veja
   `.env.local.example`):

   ```
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account", ... }'
   ADMIN_EMAILS=valbervjnascimento@gmail.com
   ```

4. Reinicie `npm run dev`. Em produção (Vercel, etc.), configure as
   mesmas variáveis de ambiente no painel do provedor — **nunca** comite
   o `.env.local` real.

## Regras de segurança do Firestore

O arquivo `firestore.rules` na raiz do projeto contém regras recomendadas
(cada professor só edita seus próprios dados; leitura liberada para
qualquer usuário logado; e-mail admin com acesso total). Aplique com:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # aponte para firestore.rules
firebase deploy --only firestore:rules
```

Sem essas regras publicadas, o banco pode continuar com as regras padrão
do projeto (verifique no Console antes de ir para produção).
