# Tarefa 30 — Provedor de pagamento em Configurações e métodos por provedor (frontend)

**Estado:** pendente
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `b1ca690` (commit completo `b1ca690b79ea2827972b186ab0c0ac2b54050c0a`, "feat(financeiro): provedor de pagamento e credenciais por provedor - tarefa 29"). Conferi que o `main` aplicado contém exatamente os arquivos entregues na Tarefa 29 (0 divergências).
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** depende da **Tarefa 120 do `rastreio-backend` já em produção**: a remoção de credenciais passa a devolver o aviso (`credenciais_arquivadas`), `GET /financeiro/provedor` passa a trazer `credenciais_arquivadas`, e as listas de métodos mostradas ao estudante passam a vir filtradas pelo provedor ativo. O backend primeiro, o frontend depois. **Há 2 arquivos a apagar** (abaixo).

---

## O que foi pedido

1. A configuração do provedor passa a viver na página `/financas/configuracoes`, com um **card** e **a sua própria página**, seguindo o padrão das demais configurações.
2. O seletor de métodos de propina e matrícula passa a mostrar só os métodos do provedor ativo.
3. Remover credenciais com cobranças pendentes passa a ser permitido **com aviso** (o backend arquiva as credenciais — Tarefa 120).

(As rotas `/financeiro/appypay/*` removidas nesta atualização não eram usadas pelo frontend desde a Tarefa 29.)

## Arquivos a apagar (ação manual)

- `src/app/(painel)/financas/credenciais/page.tsx` — a rota antiga `/financas/credenciais` deixa de existir como página; um **redirect** em `next.config.ts` leva favoritos e links antigos para `/financas/configuracoes/provedor`.
- `src/components/paineis/FinanceiroCredenciaisPainel.tsx` — foi **renomeado** para `ProvedorPagamentoPainel.tsx` (arquivo novo, com a tela ajustada). Se não for apagado fica um componente morto; não há outros importadores.

Nenhum outro arquivo é renomeado ou movido de diretório.

## Decisões

- **Padrão das configurações.** `/financas/configuracoes` já é uma página de cards, e cada card leva a uma subpágina com "Voltar" + manual de funcionamento (Mensalidade, Taxa de Matrícula). O provedor segue exatamente isso: card na raiz → página `/financas/configuracoes/provedor`, com o botão "Voltar" e o manual no topo.
- **Admin FPP.** Mensalidade e Taxa de Matrícula são de cada academia, e a raiz de Configurações mostrava ao admin FPP só um aviso de "indisponível". Como o **provedor do Spuri (contexto global)** é uma configuração que o admin FPP tem, a raiz agora mostra-lhe o card "Provedor de pagamento" (e um manual curto); os cards de Mensalidade e Taxa de Matrícula continuam só para a academia.
- **Menu lateral.** O item "Credenciais" sai (a página é alcançada pelo card, como as outras configurações). O guard de rota `/financas/credenciais` é substituído pelo de `/financas/configuracoes/provedor` (admin e academia).
- **Seletor de métodos (configuração).** Mostra só os métodos que o provedor ativo suporta (`metodos` do catálogo). Métodos já guardados que o provedor atual não suporta aparecem sinalizados ("serão removidos ao salvar") e **não são enviados** ao guardar (o backend os recusaria). Sem provedor ativo, o seletor explica e leva à página do provedor. Os cartões das configurações já definidas marcam "(indisponível no provedor atual)".
- **Seletor do estudante** (pagamento de propina e matrícula): não precisa de código no frontend — o backend já devolve a lista filtrada (Tarefa 120).
- **Remoção com aviso.** O diálogo deixa de dizer que a remoção pode ser recusada: explica que, havendo pendentes, as credenciais ficam arquivadas só para concluí-las. Depois de remover, o alerta é **de aviso** (não de erro) quando ficaram arquivadas, com o número de pendentes. Os cartões de provedor mostram "Credenciais removidas e arquivadas…" enquanto o snapshot existir.
- **Correção de um defeito antigo:** o tipo e o selo de ambiente usavam `"production"`, mas o backend devolve `"prod"`; o selo verde de produção nunca aparecia. Agora o tipo é `'test' | 'prod'` e o selo funciona.

## O que foi atualizado e onde

**15 arquivos alterados + 2 novos + 2 a apagar.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/app/(painel)/financas/configuracoes/provedor/page.tsx` (**novo**) | metadata (l. 4) | Página do provedor, no padrão das subpáginas de Configurações. |
| `src/components/paineis/ProvedorPagamentoPainel.tsx` (**novo**; substitui `FinanceiroCredenciaisPainel.tsx`) | componente (l. 95); `handleRemover` (l. 273); confirmação da remoção (l. 342); `pendentesDaRemocao` e `pendentesDaEdicao` (l. 334–335); "Voltar" (l. 358) e manual (l. 360); cartões "Provedores disponíveis" (l. 413) com a nota de arquivadas (l. 433); selo de ambiente (l. 483) | Mesma tela da Tarefa 29, agora como subpágina de Configurações: botão Voltar + manual; remoção com aviso e alerta de aviso quando há snapshot; texto do diálogo de remoção com as pendentes conhecidas; nota nos cartões; aviso na edição de credencial quando há pendentes ("remova e cadastre de novo para trocar de conta"); selo `prod`. |
| `src/components/paineis/FinanceiroConfiguracoesRootPainel.tsx` | `CARD_PROVEDOR` (l. 20); visão do admin FPP (l. 25); visão da academia (l. 40) | Card "Provedor de pagamento" (primeiro da lista); admin FPP vê só esse card; manual atualizado (link para o provedor). |
| `src/components/paineis/financeiroNivelShared.tsx` | `provedorApi` (l. 88); `metodosSuportados` e nome do provedor (l. 127); `metodosValidos` (l. 207); `MetodosPagamentoCheckboxes` (l. 217); link do aviso (l. 168); cartões de configurações definidas (l. 624) | O contexto das telas financeiras da academia passa a carregar o provedor ativo e expõe os métodos suportados; o seletor filtra por eles e sinaliza os indisponíveis; o aviso "sem credenciais" aponta para a nova página. |
| `src/components/paineis/MensalidadeCriarPainel.tsx`, `MensalidadeEditarPainel.tsx`, `TaxaMatriculaCriarPainel.tsx` | `metodosValidos` ao enviar (l. 70, 99, 95); `suportados` no seletor (l. 120, 149, 137) | Só os métodos suportados vão no pedido; o seletor recebe os suportados e o nome do provedor. |
| `src/components/paineis/MensalidadeListaPainel.tsx`, `TaxaMatriculaListaPainel.tsx` | l. 61 e 60 | Passam os métodos suportados aos cartões das configurações definidas. |
| `src/components/paineis/PagamentosShared.tsx` | l. 200 | O aviso da tela de pagamentos aponta para `/financas/configuracoes/provedor`. |
| `src/types/api.ts` | `FinanceiroAmbiente` (l. 1479); `RemoverFinanceiroCredencialRequest` (l. 1571); `RemoverFinanceiroCredencialResponse` (l. 1582); `credenciais_arquivadas` em `FinanceiroProvedorDoContexto` (l. 1585) | Ambiente `'test' \| 'prod'`; tipo da resposta da remoção; campo `credenciais_arquivadas`; comentários da remoção sem o `409`. |
| `src/lib/api/services.ts` | `removerCredencial` (l. 961) | Devolve `RemoverFinanceiroCredencialResponse` (o aviso). |
| `src/lib/api/index.ts` | l. 175 | Exporta o tipo novo. |
| `src/lib/route-guards.ts` | l. 138 | Guard de `/financas/configuracoes/provedor` (admin, academia) no lugar do de `/financas/credenciais`. |
| `src/layout/AppSidebar.tsx` | grupo Finanças (l. 43) | Item "Credenciais" removido. |
| `src/app/(painel)/financas/layout.tsx` | mapa de títulos (l. 7) | Entrada de `/financas/credenciais` removida. |
| `next.config.ts` | `redirects` (l. 9) | `/financas/credenciais` → `/financas/configuracoes/provedor` (temporário, 307). |

## Validação realizada

**Ambiente.** Node 22.22.2, npm 10.9.7; `npm ci` (o registro derrubou a conexão na primeira tentativa; funcionou com `--maxsockets=4 --fetch-retries=6`). O `npm ci` pode alterar o `yarn.lock` localmente; descartei a alteração e ela **não** faz parte da entrega.

**Baseline (`main` @ `b1ca690`):** `npx tsc --noEmit` → saída 0, sem erros; `npx eslint .` → **10 problemas (2 erros, 8 avisos), todos já existentes** e fora dos arquivos desta tarefa: erros em `src/app/(full-width-pages)/verificar-email/[token]/page.tsx` e `src/components/calendar/Calendar.tsx`; avisos em `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx`, `AppSidebar.tsx` (duas vezes) e `estudantes/cadastrar/SelecaoContextoMassa.tsx` (duas vezes).

**Depois (clone novo de `main` @ `b1ca690`, pasta copiada por cima e os 2 arquivos apagados, como você vai aplicar):**

- `npx tsc --noEmit` → saída 0, sem erros. (Durante o trabalho o `tsc` apontou a comparação antiga com `"production"` no painel que foi reescrito — a confirmação do defeito do selo.)
- `npx eslint .` → **os mesmos 10 problemas (2 erros, 8 avisos)**; a comparação arquivo a arquivo com o baseline é idêntica; nenhum problema novo.
- `package.json`, `package-lock.json` e `yarn.lock` intactos.
- `next build` **sem alterar nada**: falha somente por rede — não consegue baixar a fonte `Outfit` do Google Fonts (`src/app/layout.tsx`, arquivo que esta tarefa não toca; o mesmo acontece em `main`). Numa **cópia descartável**, trocando só o `import` da fonte por uma stub: `✓ Compiled successfully`, `✓ Generating static pages (67/67)`, saída 0; a lista de rotas do build inclui `/financas/configuracoes/provedor` e **não** inclui `/financas/credenciais` (a rota antiga é atendida pelo redirect). A stub foi revertida e não faz parte da entrega.

**Não validado:** a tela em navegador contra o backend real (não há ambiente de browser aqui), o redirect em execução (só configuração e compilação), e o comportamento com um segundo provedor, que ainda não existe. O contrato com o backend foi conferido contra os testes da Tarefa 120 (resposta `200` da remoção, `credenciais_arquivadas` no estado do contexto, listas filtradas).

## Como aplicar

1. **Confirme que a base não mudou:** `git fetch && git diff --stat b1ca690 origin/main -- src next.config.ts`. Vazio = pode substituir; se aparecer algum arquivo, ele mudou depois da base — não substitua e avise.
2. **Confirme que a Tarefa 120 do `rastreio-backend` já está em produção.**
3. **Apague** `src/app/(painel)/financas/credenciais/page.tsx` e `src/components/paineis/FinanceiroCredenciaisPainel.tsx`.
4. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos.
5. **Verifique** (abaixo).
6. **Marque como feito** (abaixo).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem erros; `eslint` com exatamente os 10 problemas antigos listados acima e nenhum novo. Se o `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração. `next build` só passa com acesso ao Google Fonts.

## Fora de escopo

- **Job de reconciliação** (backend): não implementado, aguarda decisão.
- **Serviços extras**: a configuração e o pagamento de serviços extras continuam a mostrar todos os métodos (não foram pedidos); o backend recusa na geração da cobrança o que o provedor não suporta.
- **Intelize e PayPay**: só os nomes de exibição em `NOME_PROVEDOR`; a tela já os mostra se o catálogo os devolver.
- Cópia da `Documentação da API.md` em `src/` (versão 2.3.0, desatualizada): não tocada.

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida (`b1ca690`)
- [ ] Tarefa 120 do `rastreio-backend` já em produção
- [ ] Os 2 arquivos antigos apagados; pasta copiada por inteiro (15 alterados, 2 novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` sem problemas novos (os 10 antigos permanecem)
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`
