# Tarefa 41 — Cadastro com encarregado e reenvio de credenciais por perfil  (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `50b3cc1`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** **Depende das Tarefas 130 e 131 do `rastreio-backend` já em produção** (ou na mesma janela). Sem elas, as telas novas recebem `404`/`403`, e o cadastro escolar enviaria um encarregado que o servidor antigo ignora. O backend 4.0.0 **sem** este frontend também quebra o cadastro com encarregado novo e a edição do telefone do encarregado (ver a ordem de deploy da Tarefa 130 do `rastreio-backend`). Vão **juntos**.

---

## Contexto

Plano de Atualizações, **Parte 5** — a interface do cadastro e do reset:

- **Cadastro do estudante do nível escolar:** o campo único "telefone do encarregado" vira o **bloco do encarregado**. Ao digitar o telefone, a tela consulta se o encarregado já existe: se existe, avisa que será apenas vinculado (sem novas credenciais) e não pede dados; se não, pede nome, género, nascimento (18+), e-mail e relação. O resultado diz se a conta do encarregado foi criada ou vinculada.
- **Cadastro em massa:** o modelo Excel ganhou as colunas I a N do encarregado; o parser as valida e o lote as envia.
- **Troca de encarregado** pela academia ou pelo secretário; **desvincular encarregado** pelo estudante depois do nível escolar.
- **Reenvio de credenciais por perfil:** academia e secretário com permissão; admin só para estudante sem academia.
- Sai a edição do telefone do encarregado pelo estudante (a rota deixou de existir).

## O que foi atualizado e onde

**13 arquivos alterados + 2 novos** (nesta tarefa; a outra tarefa do pacote lista os seus).

Depende da Tarefa 40 do pacote (serviços, tipos e perfil efetivo).

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/components/estudantes/EncarregadoCadastroFields.tsx` (**novo**) | `EncarregadoCadastroFields` (linha 94) | Bloco do encarregado: ao completar o telefone consulta a API; encarregado existente é só vinculado (sem pedir dados); senão pede nome, género, nascimento (18+), e-mail e relação. |
| `src/components/estudantes/TrocarEncarregadoModal.tsx` (**novo**) | — | Troca de encarregado pela academia (ou secretário com `estudantes.dados`). |
| `src/app/(painel)/estudantes/cadastrar/CadastroSingularForm.tsx` | bloco do encarregado (linha 720) | O telefone único do encarregado vira o bloco do encarregado (nível escolar); o resultado informa conta nova ou vinculada. |
| `src/app/(painel)/estudantes/cadastrar/massaTemplate.ts` | — | Modelo Excel ganha as colunas I a N (nome, género, nascimento, e-mail, relação e descrição do encarregado) e as instruções 10 e 11. |
| `src/app/(painel)/estudantes/cadastrar/massaParser.ts` | `validarEncarregado` (linha 136) | Lê as colunas novas e valida o que foi preenchido (bloco "tudo ou nada", género, 18+, e-mail, relação). |
| `src/app/(painel)/estudantes/cadastrar/massaTypes.ts` | — | Campos do encarregado na linha do lote. |
| `src/app/(painel)/estudantes/cadastrar/massaPayload.ts` | `construirBlocoEncarregado` (linha 39) | Monta o bloco do encarregado de cada linha. |
| `src/app/(painel)/estudantes/cadastrar/massaErrorExport.ts` | — | O arquivo de erros reexportável mantém as colunas novas (a coluna de erro vem depois). |
| `src/app/(painel)/estudantes/cadastrar/massaDraft.ts` | — | Rascunho guarda o bloco do encarregado. |
| `src/lib/api/services.ts` | `achatarEncarregado` (linha 366) | O bloco viaja como campos `encarregado_*` no multipart e como objeto no JSON do lote; remove o serviço do telefone do encarregado. |
| `src/types/api.ts` | `encarregado` (linha 192) | `CriarEstudanteRequest.encarregado`; remove os tipos do telefone do encarregado. (O restante deste arquivo é da Tarefa 40.) |
| `src/app/(painel)/estudantes/PageContent.tsx` | `podeReenviarCredenciais` (linha 492) | Reenvio de credenciais por perfil (academia e secretário com permissão; admin só para estudante sem academia) e botão "Trocar encarregado". |
| `src/app/(painel)/configuracoes/personalizar/PageContent.tsx` | `StudentGuardianCard` (linha 129) | Em vez de editar o telefone do encarregado, mostra de quem é o telefone e oferece "Desvincular encarregado" depois do nível escolar. |
| `src/components/user-profile/ProfileEditCard.tsx` | — | Remove a edição do telefone do encarregado. |
| `src/app/(painel)/testes/PageContent.tsx` | — | Dados de teste geram o bloco do encarregado. |

## Validação realizada

**Método.** Clone novo de `main` @ `50b3cc1`, a pasta `rastreio-frontend/` do zip copiada por cima, `npm ci` e só então as verificações. O `main` original foi medido antes.

| Verificação | `main` original | Com o pacote |
| --- | --- | --- |
| `npx tsc --noEmit` | sem erros | **sem erros** |
| `npx eslint .` | 10 problemas (2 erros, 8 avisos) | **os mesmos 10**, nos mesmos arquivos (os dois avisos de `AppSidebar.tsx` já existiam; só mudaram de linha) — nenhum novo |
| `npm run build` | — | **compila** e gera as rotas `/secretarios`, `/professores`, `/professor` e `/encarregado` |
| `package.json`, `package-lock.json`, `yarn.lock` | — | intactos |

O `npm run build` precisou de `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` porque o sandbox não alcança `fonts.googleapis.com`; é só a fonte, o código é o mesmo. As **regras de rota** (quem abre o quê, por tipo real e por permissão) foram conferidas com um script descartável de 22 verificações, rodado com `tsx` e não incluído no pacote.

**Não verificado — leia antes de aplicar:** **nenhuma tela foi aberta num navegador nem contra o backend real.** O frontend não tem framework de testes. As telas novas (secretários, professores, área do professor, área do encarregado, cadastro com encarregado, troca de encarregado) estão verificadas só por tipos, lint e compilação; o contrato com o backend foi escrito a partir da Documentação da API 4.0.0 e do código do backend validado. Vale um percurso manual: criar secretário com permissões, entrar como ele, cadastrar estudante escolar com encarregado novo e depois um irmão, e entrar como encarregado.


## Como aplicar

1. **Confirme que a base não mudou:** `git fetch origin && git diff --stat 50b3cc1 origin/main -- "src/app/(full-width-pages)/trocar-senha/page.tsx" "src/app/(painel)/configuracoes/personalizar/PageContent.tsx" "src/app/(painel)/estudantes/PageContent.tsx" "src/app/(painel)/estudantes/cadastrar/CadastroSingularForm.tsx" "src/app/(painel)/estudantes/cadastrar/massaDraft.ts" "src/app/(painel)/estudantes/cadastrar/massaErrorExport.ts" "src/app/(painel)/estudantes/cadastrar/massaParser.ts" "src/app/(painel)/estudantes/cadastrar/massaPayload.ts" "src/app/(painel)/estudantes/cadastrar/massaTemplate.ts" "src/app/(painel)/estudantes/cadastrar/massaTypes.ts" "src/app/(painel)/layout.tsx" "src/app/(painel)/perfil/PageContent.tsx" "src/app/(painel)/testes/PageContent.tsx" "src/components/auth/LoginForm.tsx" "src/components/dashboard/PainelDashboard.tsx" "src/components/user-profile/ProfileEditCard.tsx" "src/hooks/useRoutePermission.ts" "src/layout/AppSidebar.tsx" "src/lib/api/client.ts" "src/lib/api/index.ts" "src/lib/api/services.ts" "src/lib/route-guards.ts" "src/types/api.ts"`. Vazio = pode substituir; se aparecer algum arquivo, ele mudou depois da base — não substitua e avise.
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos. O pacote traz as Tarefas 40 e 41 juntas (arquivos em comum).
3. **Verifique** (abaixo).
4. **Marque como feito** (abaixo).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem erros; `eslint` com exatamente os 10 problemas que já existiam em `main` (2 erros e 8 avisos; dois deles em `AppSidebar.tsx`, que esta tarefa altera, mas já existiam) e nenhum novo. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração.

## Fora de escopo

- Telas de secretário, professor e encarregado e o perfil efetivo: Tarefa 40.
- Cadastro do encarregado em lote com **consulta** de encarregado existente linha a linha (o servidor decide por linha e a mensagem de erro começa por "encarregado:").
- **Teste em navegador contra o backend real** (ver a validação).

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida
- [ ] Pasta copiada por inteiro (13 alterados, 2 novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` sem problemas novos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`
