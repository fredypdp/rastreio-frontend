# Tarefa — Remover Envio de E-mails pelo Frontend e Notificação Duplicada

**Repositório:** `rastreio-frontend`
**Depende de:** a tarefa de backend `Tarefa - E-mails de Verificacao e Recuperacao de Senha via Backend (Brevo).md` — **precisa estar aplicada e validada primeiro**, esta tarefa chama os dois endpoints novos que ela cria (`/email/verificar-email/solicitar` e `/email/recuperar-senha/solicitar`).
**Execução:** Codex só executa — todas as alterações abaixo já foram escritas e validadas com `tsc --noEmit`, `eslint` e `npm run build` (até a etapa esperada — ver Validação) pelo orquestrador.

## Contexto

Três coisas diferentes, todas sobre o frontend deixar de enviar e-mails ele mesmo:

1. **Notificação de "academia cadastrada" duplicada** — o backend já envia esse aviso automaticamente, dentro do próprio registo público de academia (`RegisterAcademiaPublica -> SendAcademiaCadastradaEmailBrevo`, a todos os admins com permissão de ativação). O frontend também disparava um segundo aviso (`/api/academia-cadastro-notificacao`, para uma lista fixa de admins vinda de env var) — um resquício de quando o backend ainda não tinha esse envio nativo. É removido.

2. **Verificação de e-mail** — o frontend gerava o token e enviava o próprio e-mail (via NodeMailer). Passa a só chamar o endpoint novo do backend (`solicitarVerificacaoEmail`), que já faz tudo (gera o token E envia, com o HTML de marca da plataforma).

3. **Recuperação de senha** — o frontend fazia 3 passos (gerar token, resetar a senha, enviar o e-mail com a senha nova) através de uma rota própria em Next.js. Passa a chamar um único endpoint novo do backend (`solicitarRecuperacaoSenha`), que faz os 3 passos atomicamente do lado do servidor. O comportamento de "tipo é opcional, tenta estudante/academia/admin em sequência" (usado pela página pública `/esqueci-senha`, que nunca pede o tipo ao usuário) foi preservado — só que agora dentro do próprio backend, não mais nesta camada do frontend.

Como consequência, `nodemailer` deixou de ser usado em qualquer lugar do frontend e foi removido do `package.json`.

---

## 1. `package.json` — remover a dependência `nodemailer`

**Localizar** (no bloco `dependencies`):
```json
    "next": "16.0.10",
    "nodemailer": "^7.0.13",
    "primereact": "^10.9.7",
```
**Substituir por:**
```json
    "next": "16.0.10",
    "primereact": "^10.9.7",
```

**Localizar** (no bloco `devDependencies`):
```json
    "@types/node": "^20.19.25",
    "@types/nodemailer": "^7.0.9",
    "@types/react": "^19.2.1",
```
**Substituir por:**
```json
    "@types/node": "^20.19.25",
    "@types/react": "^19.2.1",
```

Depois de editar, rodar `npm install` para atualizar o `package-lock.json` (o orquestrador já rodou isto e confirmou que nada mais depende de `nodemailer`).

---

## 2. `src/lib/api/services/email.service.ts` — arquivo completo

Reescrito por completo. Os métodos `gerarTokenVerificacao`, `gerarTokenRecuperacao` e `resetarSenha` são removidos (ficariam sem nenhum chamador depois desta tarefa — eram usados só pelas 2 rotas Next.js removidas na seção 6). O método `verificarEmail` **fica** — é usado pela rota `/api/verificar-email/[token]`, que **não muda** nesta tarefa (confirma o clique no link recebido por e-mail).

**Arquivo completo — `/home/claude/work/rastreio-frontend/src/lib/api/services/email.service.ts`:**

```ts
// src/lib/api/services/email.service.ts

import { api } from '../client';
import type {
  GerarTokenRecuperacaoRequest,
  VerificarEmailResponse,
  SolicitarEmailResponse,
} from '@/types/email-auth';

class EmailAuthService {

  /**
   * Confirma o token recebido por email (usuário clicou no link de
   * verificação). Rota pública: POST /email/verificar-email/:token.
   */
  async verificarEmail(token: string): Promise<VerificarEmailResponse> {
    return api.post<VerificarEmailResponse>(`/email/verificar-email/${token}`, {});
  }

  /**
   * Requer JWT — o backend identifica o usuário pelo próprio token (não
   * precisa de identificador/tipo no body) e envia o email de verificação
   * diretamente, com o HTML de marca da plataforma.
   */
  async solicitarVerificacaoEmail(jwt: string): Promise<SolicitarEmailResponse> {
    return api.post<SolicitarEmailResponse>(
      '/email/verificar-email/solicitar',
      {},
      { token: jwt }
    );
  }

  /**
   * Pública. 'tipo' é opcional — se omitido, o backend tenta identificar o
   * usuário como estudante, depois academia, depois admin, nessa ordem.
   * Reseta a senha imediatamente e envia a nova senha temporária por email
   * (com o HTML de marca da plataforma) — não há mais token/link envolvido.
   */
  async solicitarRecuperacaoSenha(identificador: string, tipo?: GerarTokenRecuperacaoRequest['tipo']): Promise<SolicitarEmailResponse> {
    return api.post<SolicitarEmailResponse>('/email/recuperar-senha/solicitar', {
      identificador,
      ...(tipo ? { tipo } : {}),
    });
  }
}

export const emailAuthService = new EmailAuthService();

```

---

## 3. `src/lib/utils/email.ts` — arquivo completo

`VerificarEmailComFrontend` e `RecuperarSenhaComFrontend` passam a chamar o backend diretamente, através dos métodos novos de `emailAuthService`. As assinaturas das duas funções **não mudam** — nenhum dos 4 locais que as chamam (`UserInfoCard.tsx`, as duas páginas de "esqueci a senha", `GuiaConfiguracoesSection.tsx`) precisa de qualquer alteração. `VerificarEmailComToken` fica exatamente como estava.

**Arquivo completo — `/home/claude/work/rastreio-frontend/src/lib/utils/email.ts`:**

```ts
// src/lib/utils/email.ts
import { UserType } from "@/types/api";
import { tokenStorage } from '@/lib/api';
import { emailAuthService } from '@/lib/api/services/email.service';

/**
 * Solicita o envio do email de verificação para o usuário logado.
 *
 * O backend agora controla o envio completo (token + email, com o HTML de
 * marca da plataforma) — o frontend só precisa estar autenticado, não
 * precisa mais gerar o token nem montar/enviar o email ele mesmo.
 */
export async function VerificarEmailComFrontend(_identificador: string, _tipo: UserType) {
  const jwt = tokenStorage.get();
  if (!jwt) throw new Error('Usuário não autenticado');

  return emailAuthService.solicitarVerificacaoEmail(jwt);
}

/**
 * Solicita a recuperação de senha. O backend reseta a senha imediatamente
 * e envia a nova senha temporária por email (com o HTML de marca da
 * plataforma) — não há mais token/link envolvido.
 *
 * 'tipo' continua opcional: quando não informado, o backend tenta
 * identificar o usuário como estudante, depois academia, depois admin,
 * nessa ordem (mesmo comportamento que antes era feito aqui no frontend).
 */
export async function RecuperarSenhaComFrontend(identificador: string, tipo?: UserType) {
  if (!identificador || identificador.trim() === '') {
    throw new Error('Identificador é obrigatório');
  }

  if (tipo && !['estudante', 'academia', 'admin'].includes(tipo)) {
    throw new Error('Tipo de usuário inválido');
  }

  return emailAuthService.solicitarRecuperacaoSenha(identificador.trim(), tipo);
}

/**
 * Verifica email usando token da URL (usuário clicou no link recebido).
 */
export async function VerificarEmailComToken(token: string) {
  if (!token || token.trim() === '') {
    throw new Error('Token é obrigatório');
  }

  const response = await fetch(`/api/verificar-email/${token}`, {
    method: 'POST'
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || data.error || 'Erro ao verificar email';
    throw new Error(errorMsg);
  }

  return data;
}

```

---

## 4. `src/types/email-auth.ts` — arquivo completo

Removidos os tipos que só serviam aos métodos removidos na seção 2 (`TokenResponse`, `GerarTokenVerificacaoRequest`, `ResetarSenhaResponse`, `FrontendEmailVerificacaoResponse`, `FrontendEmailRecuperacaoResponse` — nenhum é usado em mais nenhum lugar do projeto, já confirmado). Adicionado `SolicitarEmailResponse`, usado pelos dois novos endpoints. `GerarTokenRecuperacaoRequest` fica (ainda é usado, agora como referência de tipo em `email.service.ts`). Todo o resto do arquivo (`EmailNaoVerificadoError`, `AlterarSenhaRequest`/`Response`, `SenhasPadrao`, `getSenhaPadrao`, `isEmailNaoVerificadoError`) fica **exatamente igual** — são usados em outros pontos do projeto sem relação com esta tarefa.

**Arquivo completo — `/home/claude/work/rastreio-frontend/src/types/email-auth.ts`:**

```ts
// src/types/email-auth.ts
import { UserType } from "./api";

/**
 * Request para recuperação de senha (identificador obrigatório, tipo
 * opcional — quando omitido, o backend tenta estudante/academia/admin
 * nessa ordem).
 */
export interface GerarTokenRecuperacaoRequest {
  identificador: string; // codigo_estudante, codigo_academia ou email (admin)
  tipo: UserType; // 'estudante' | 'academia' | 'admin'
}

/**
 * Response quando email é verificado com sucesso
 */
export interface VerificarEmailResponse {
  message: string;
  email: string;
}

/**
 * Response dos endpoints /email/verificar-email/solicitar e
 * /email/recuperar-senha/solicitar — o backend controla o envio completo
 * (token + email), por isso a resposta não traz token nem senha, só a
 * confirmação de que o email foi enviado.
 */
export interface SolicitarEmailResponse {
  success: boolean;
  message: string;
  email?: string;
}

/**
 * ✅ Response de erro quando email não está verificado
 */
export interface EmailNaoVerificadoError {
  error: "email não verificado";
  message: string;
  email_verificado: false;
}

/**
 * Request para alterar senha (usuário logado)
 */
export interface AlterarSenhaRequest {
  senha_atual: string;
  nova_senha: string;
}

/**
 * Response após alterar senha
 */
export interface AlterarSenhaResponse {
  message: string;
}

/**
 * Senhas padrão por tipo de usuário
 * Baseado em: internal/services/email_service.go -> GetDefaultPassword()
 */
export const SenhasPadrao = {
  estudante: (codigo: string) => codigo,           // codigo_estudante
  academia: (codigo: string) => codigo,            // codigo_academia
  admin: "spuriadm",
  gerente: "spurigerente",
  fpp: "spurifpp",
  default: "spuri123"
} as const;

/**
 * Tipo para as senhas padrão
 */
export type SenhaPadrao = 
  | string                    // Para estudante/academia (dinâmico)
  | "spuriadm"               // Admin
  | "spurigerente"           // Gerente
  | "spurifpp"               // FPP
  | "spuri123";              // Default

/**
 * Helper para obter senha padrão
 */
export function getSenhaPadrao(userType: UserType, codigo?: string, role?: string): string {
  switch (userType) {
    case "estudante":
      return codigo || SenhasPadrao.default;
    case "academia":
      return codigo || SenhasPadrao.default;
    case "admin":
      if (role === "fpp") return SenhasPadrao.fpp;
      if (role === "gerente") return SenhasPadrao.gerente;
      return SenhasPadrao.admin; // "adm" e default
    default:
      return SenhasPadrao.default;
  }
}

/**
 * ✅ Type guard para verificar se erro é EmailNaoVerificadoError
 */
export function isEmailNaoVerificadoError(error: any): error is EmailNaoVerificadoError {
  return (
    error &&
    error.error === "email não verificado" &&
    error.email_verificado === false
  );
}
```

---

## 5. `src/app/(full-width-pages)/(auth)/instituicoes/cadastrar/InstituicaoCadastroPublico.tsx` — remover a notificação duplicada

**Localizar:**
```tsx
/**
 * Aciona (melhor esforço, sem bloquear a UI) o aviso por email aos
 * administradores com permissão de ativação sobre esta nova instituição
 * pendente de análise. Nunca aguardado (sem await no chamador) e qualquer
 * falha aqui é só logada — o cadastro em si já foi concluído com sucesso
 * antes desta chamada.
 */
function notificarAdminsCadastroAcademia(codigoAcademia: string) {
  fetch("/api/academia-cadastro-notificacao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigoAcademia }),
  }).catch((error) => {
    console.error("[cadastro-publico] falha ao acionar aviso aos administradores:", error);
  });
}
```

**Substituir por:**
```tsx
/**
 * NOTA: o aviso por email aos administradores sobre uma nova instituição
 * pendente de análise já é enviado automaticamente pelo backend, dentro do
 * próprio registo (RegisterAcademiaPublica -> SendAcademiaCadastradaEmailBrevo),
 * a todos os admins com permissão de ativação. Uma chamada extra a partir
 * daqui enviaria um segundo aviso duplicado — por isso foi removida.
 */
```

**Localizar** (a chamada à função removida, um pouco mais abaixo no mesmo arquivo):
```tsx
    if (result) {
      setResultado({ codigo_academia: result.codigo_academia, nome: payload.nome });
      notificarAdminsCadastroAcademia(result.codigo_academia);
    }
```

**Substituir por:**
```tsx
    if (result) {
      setResultado({ codigo_academia: result.codigo_academia, nome: payload.nome });
    }
```

Nada mais muda neste arquivo.

---

## Arquivos a remover

Estes 4 arquivos ficam **totalmente sem uso** depois desta tarefa (já confirmado — nenhum outro ponto do projeto os referencia) e devem ser apagados:

```
src/app/api/verificar-email/route.ts
src/app/api/recuperar-senha/route.ts
src/app/api/academia-cadastro-notificacao/route.ts
src/lib/email/email-service.ts
```

⚠️ **Não remover** `src/app/api/verificar-email/[token]/route.ts` — essa é uma rota DIFERENTE (confirma o clique no link recebido por e-mail) e continua em uso, sem qualquer alteração.

Depois de remover os 4 arquivos, as pastas `src/app/api/recuperar-senha/`, `src/app/api/academia-cadastro-notificacao/` e `src/lib/email/` ficam vazias e podem ser removidas também.

⚠️ **Não remover** o arquivo de imagem `public/images/email/spuri-logo-email.png` — ele deixou de ser referenciado por código TypeScript, mas o backend (Go) passou a depender dele como URL pública (ver tarefa de backend), então precisa continuar publicado exatamente neste caminho.

## Validação (já executada pelo orquestrador — Codex só precisa confirmar)

```bash
npm install
# depois de editar o package.json — atualiza o package-lock.json

npx tsc --noEmit
# esperado: nenhuma saída
# nota: se aparecer um erro mencionando ".next/types/validator.ts", é
# cache obsoleto de um build anterior — rode `rm -rf .next` e repita.

npx eslint src
# esperado: nenhum erro/warning novo (os já existentes antes desta tarefa,
# em arquivos não relacionados, continuam aparecendo — não são desta tarefa)

npm run build
# esperado: build avança normalmente e só para na etapa de download de
# fontes do Google (bloqueada por rede no ambiente do Codex/sandbox —
# limitação de ambiente conhecida, não um erro de código)
```

## Conclusão

Depois de aplicar as 5 seções de código, remover os 4 arquivos (+ pastas vazias resultantes), rodar `npm install`, e confirmar `tsc`/`eslint` limpos, marcar esta tarefa como concluída.

**Pré-requisito confirmado:** esta tarefa só funciona corretamente se a tarefa de backend `Tarefa - E-mails de Verificacao e Recuperacao de Senha via Backend (Brevo).md` já estiver aplicada — os dois métodos novos de `emailAuthService` chamam endpoints que só existem com aquele comportamento depois dela.
