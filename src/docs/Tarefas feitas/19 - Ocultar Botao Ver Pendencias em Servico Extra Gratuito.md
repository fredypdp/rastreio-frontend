# Tarefa para o Codex — Repositório `rastreio-frontend` (frontend)

**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Branch base:** main
**Execução:** Não é necessário planejar nada. Todo o código já foi escrito e validado pelo orquestrador (ver "O que já foi validado" abaixo) e está pronto no arquivo `19 - Ocultar Botao Ver Pendencias em Servico Extra Gratuito.patch`, nesta mesma pasta. Sua única tarefa é aplicar o patch, rodar as verificações do Passo 2, e mover/renomear os arquivos conforme o Passo 3.

**Ordem de deploy:** nenhuma dependência com a Tarefa 113 do `rastreio-backend` — pode ir para produção antes, depois ou junto. (Mesmo sem o backend corrigido, esta mudança já evita o erro visto pelo estudante, já que o botão passa a só aparecer quando o serviço de fato cobra algo; com o backend corrigido também, o endpoint fica protegido mesmo se algo chegar a chamá-lo fora desta tela.)

---

## Contexto do problema

Reportado: em `/servicos-extras/minhas-inscricoes` (tela do estudante), o botão "Ver pendências" aparece mesmo para inscrições vinculadas a um serviço extra que não cobra nada — nem taxa única, nem mensalidade (campo `pago=false` do serviço). Clicar no botão chama `GET /estudante/servicos-extras/minhas-inscricoes/:id/pendencias`, que (antes da Tarefa 113, no backend) devolvia 500 exatamente por não haver preço/tipo de cobrança configurado nesse caso.

Investigando `MinhasInscricoesServicoExtraPainel.tsx`, o botão aparece incondicionalmente dentro do bloco `i.status==="vinculada"`, sem checar se o serviço cobra algo. O padrão certo já existe no painel irmão da academia (`ServicosExtrasSolicitacoesPainel.tsx`, `/servicos-extras/inscricoes`), que só mostra "Ver pendências" quando `s?.tipo_cobranca` está definido — vou replicar exatamente essa mesma condição aqui.

## O que o patch faz

1 arquivo:

- **`src/components/paineis/MinhasInscricoesServicoExtraPainel.tsx`** — o botão "Ver pendências" (dentro do bloco `status==="vinculada"`) passa a só renderizar quando `s?.tipo_cobranca` está definido, igual ao painel da academia. Nenhuma outra linha desse bloco muda — a listagem de pendências (`pend[i.id]?.map(...)`) continua como está, só nunca terá nada para mostrar num serviço gratuito (já que o botão que popularia `pend[i.id]` não aparece mais).

## O que já foi verificado nas outras páginas `/servicos-extras/*`

- **`ServicosExtrasSolicitacoesPainel.tsx`** (`/servicos-extras/inscricoes`, tela da academia) — já usa a condição correta (`s?.tipo_cobranca`); nada a corrigir lá, serviu de referência para esta correção.
- Nenhuma outra tela de serviços extras foi tocada ou precisa de mudança para este bug específico.

## O que já foi validado pelo orquestrador

- `npx tsc --noEmit` (projeto inteiro) — limpo, sem diferença do baseline (sem a mudança).
- `npx eslint .` (projeto inteiro) — o arquivo tocado mantém só o mesmo warning pré-existente de sempre (`react-hooks/exhaustive-deps` sobre `carregar`), idêntico ao baseline; **zero erros novos**. Os únicos 2 erros do projeto inteiro (`verificar-email/[token]/page.tsx` e `Calendar.tsx`) são pré-existentes, em arquivos que este patch não toca.
- **Validação final, independente de tudo isso:** clone novo e limpo de `main` direto do GitHub, apliquei o `.patch` exatamente como você vai aplicar (`git apply`), `npm install` do zero, e rodei de novo `npx tsc --noEmit` e `npx eslint .` — mesmíssimo resultado.

## Passo 1 — Aplicar o patch

Na raiz do repositório:

```bash
git apply "src/docs/Lista de Tarefas/19 - Ocultar Botao Ver Pendencias em Servico Extra Gratuito.patch"
```

Deve alterar 1 arquivo, nenhum novo. Se `git apply` falhar, PARE — não recrie a mudança manualmente, reporte o conflito.

## Passo 2 — Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem nenhum erro. `eslint` sem nenhum erro novo — só os 2 pré-existentes já documentados (`verificar-email/[token]/page.tsx`, `Calendar.tsx`), em arquivos não relacionados a este patch.

## O que NÃO fazer (fora de escopo)

- Não toque em `ServicosExtrasSolicitacoesPainel.tsx` (painel da academia) — já usa a condição correta, nada a corrigir lá.
- Não troque a condição para `s?.pago` — embora equivalente pela invariante de banco (`pago=false ⇔ preco e tipo_cobranca nulos`), `tipo_cobranca` é a condição já usada no painel irmão da academia; manter os dois painéis consistentes entre si facilita qualquer manutenção futura.
- A correção de backend que faz `.../pendencias` devolver `200` com lista vazia (em vez de `500`) para um serviço gratuito é um documento separado (Tarefa 113, no `rastreio-backend`) — não implemente nada de backend aqui.

## Passo 3 — Marcar como feito

Depois que os Passos 1–2 passarem sem problema, mova este arquivo e o `.patch` correspondente de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`.

**Atenção ao caminho:** neste repositório os documentos de tarefa ficam dentro de `src/docs/` (`src/docs/Tarefas feitas/`), não em `docs/` na raiz do repositório — confirmei a estrutura real antes de escrever este caminho.

## Resumo das mudanças (checklist final)

- [ ] Patch aplicado (`git apply`) sem conflitos
- [ ] `npm install` sem erros
- [ ] `npx tsc --noEmit` limpo
- [ ] `npx eslint .` sem erros novos
- [ ] Arquivos desta tarefa movidos para `src/docs/Tarefas feitas/`
