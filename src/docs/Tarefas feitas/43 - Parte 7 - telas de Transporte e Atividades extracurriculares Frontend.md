# Tarefa 43 — (feito) Parte 7: telas de Transporte e Atividades extracurriculares (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `70cc3d9` (igual ao `origin/main` na hora da entrega)
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório, **mais 10 arquivos a apagar** (lista em "Arquivos a apagar")
**Ordem de deploy:** **este front-end vai primeiro**, antes da Tarefa 137 do `rastreio-backend` (ela **remove** rotas que o front antigo usa). O front novo não chama nenhuma rota removida; até a 137 subir, as telas de Transporte e Atividades, o catálogo e as inscrições mostram erro de carregamento (`404`), sem efeito em dados. Sem academias em produção, sem impacto.

---

## Contexto

A Parte 7 do Plano de Atualizações (no `rastreio-backend`) troca o serviço genérico que a academia criava e personalizava por um **catálogo fixo**: **Transporte** (preço e prazo gerais, rotas com horário de embarque, veículos) e **Atividade extracurricular** (instrutor, horários, individual ou coletiva com turma da atividade). A cobrança é só **mensalidade nos meses do ano civil que a academia marca**, mais a taxa de inscrição opcional. Esta tarefa é a parte do front-end: telas de gestão, catálogo e inscrições do estudante, inscrições da academia, e a remoção das telas de serviço genérico e de categorias. Contrato completo: seção 23 da Documentação da API (5.0.0) do `rastreio-backend`, Tarefa 137.

## O que foi atualizado e onde

**10 arquivos alterados + 8 novos + 10 a apagar.**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/types/api.ts` | `TipoServico` (1292) a `CatalogoServicos` (1372); `SolicitacaoServicoExtra`; `TipoLancamentoServicoExtra`; `SolicitarServicoExtraRequest` | Saem `ServicoExtra`, `ServicoExtraPayload`, `CategoriaServico`, `CategoriaServicoPayload`, `TipoCobrancaServico`; entram `TransporteConfig`, `RotaTransporte`, `VeiculoTransporte`, `AtividadeServico`, `HorarioAtividade`, `TurmaAtividade`, os payloads e o catálogo de quem paga (`CatalogoServicos`). A inscrição ganha `tipo_servico`, `rota_id`, `veiculo_ids`, `turma_id`; o lançamento é só `mensalidade`. |
| `src/lib/api/services.ts` | `listarCatalogoServicosExtras` (1092), `solicitarServicoExtra`, `getTransporte` (1651) e as demais, `aprovarSolicitacaoServicoExtra` (1677) | Saem as chamadas do serviço genérico e das categorias; entram as do Transporte (config, rotas, veículos), das atividades (CRUD, ativar/desativar, turmas, membros) e do catálogo do estudante; o pedido envia `rota_id` e `veiculo_ids`; a aprovação aceita `turma_id`. |
| `src/components/paineis/ServicosShared.tsx` (**novo**) | `lerValor` (44), `MesesSelector` (55), `DisponibilidadeServico` (105) | Peças comuns: leitura de valor em Kz que **recusa mais de 2 casas** (nunca arredonda), seletor dos 12 meses, escolha única, lista de problemas e a disponibilidade por ano/curso (extraída do formulário antigo). |
| `src/components/paineis/TransportePainel.tsx` (**novo**) | `TransportePainel` (51), `salvarGeral` (83), `salvarRota` (108) | Tela do Transporte: preço e prazo gerais, pagamento (métodos e taxa), disponibilidade, ativar; rotas (criar, editar, ativar/desativar, apagar) e veículos. Com o geral definido, o formulário da rota desliga o preço/prazo próprio e explica por quê; erros `409` do servidor aparecem na tela. |
| `src/components/paineis/AtividadesPainel.tsx` (**novo**) | `AtividadesPainel` (15) | Lista das atividades com preço, meses, horários, turmas ativas, avisos de configuração incompleta e ações. |
| `src/components/paineis/AtividadeFormPainel.tsx` (**novo**) | `AtividadeFormPainel` (39), `montar` (68) | Criar/editar atividade: dados, coletiva, gratuita, preço, meses, métodos, taxa, disponibilidade e horários (dia, início, fim); quando coletiva, as **turmas da atividade** (criar, renomear, ativar/desativar, apagar, ver membros). Depois de criar uma coletiva, vai direto para a edição (para criar a turma). |
| `src/components/paineis/ServicosExtrasCatalogoPainel.tsx` | `solicitarTransporte` (51) | Catálogo do estudante em Transporte e atividades: escolher **uma rota** e **ao menos um veículo** dela; atividade com horários e preço. Já vem filtrado pela elegibilidade (servidor). Sai o envio de documento. |
| `src/components/paineis/MinhasInscricoesServicoExtraPainel.tsx` | `titulo` (44) | Nome da rota e dos veículos / da atividade; "Ver mensalidades" (um lançamento por mês cobrado) e pagamento com os métodos já filtrados pelo provedor. |
| `src/components/paineis/ServicosExtrasSolicitacoesPainel.tsx` | `aprovar` (72) | Inscrições da academia com rota, veículos e turma; aprovar atividade **coletiva** exige escolher a turma da atividade. |
| `src/lib/route-guards.ts`, `src/layout/AppSidebar.tsx`, `src/lib/perfil-efetivo-regras.ts` | 229, 119, 38 | Rotas `/servicos-extras/transporte` e `/servicos-extras/atividades` no lugar de gerenciar-serviços e categorias (guardas, menu da academia, permissão `servicos_extras.ver` do secretário). |
| `src/app/(painel)/servicos-extras/transporte/page.tsx`, `atividades/page.tsx`, `atividades/criar/page.tsx`, `atividades/editar/[id]/page.tsx` (**novos**) | — | Páginas finas que montam os painéis. |
| `src/app/(painel)/servicos-extras/inscricoes/page.tsx` | título | "Inscrições em Serviços". |
| `src/app/(painel)/configuracoes/matricula/PageContent.tsx` | comentário do topo | Aponta para `ServicosShared.tsx` (o arquivo antigo foi removido). |

### Arquivos a apagar (10)

Copiar a pasta por cima **não** apaga: apague à mão (ou `git rm`).

```
src/app/(painel)/servicos-extras/categorias-servico/page.tsx
src/app/(painel)/servicos-extras/categorias-servico/criar/page.tsx
src/app/(painel)/servicos-extras/categorias-servico/editar/[id]/page.tsx
src/app/(painel)/servicos-extras/gerenciar-servicos/page.tsx
src/app/(painel)/servicos-extras/gerenciar-servicos/criar/page.tsx
src/app/(painel)/servicos-extras/gerenciar-servicos/editar/[id]/page.tsx
src/components/paineis/CategoriasServicoPainel.tsx
src/components/paineis/CategoriaServicoFormPainel.tsx
src/components/paineis/ServicoExtraFormPainel.tsx
src/components/paineis/ServicosExtrasPainel.tsx
```

Nenhum arquivo foi renomeado ou movido.

## Comportamento resultante

- **Academia** (e secretário com permissão): menu "Serviços" → **Transporte**, **Atividades**, **Inscrições** (some "Categorias de Serviço" e "Gerenciar Serviços"). Valor digitado com mais de 2 casas é recusado na tela antes de enviar (o servidor também recusa).
- **Estudante:** catálogo com Transporte (escolhe rota e veículos) e atividades; "Minhas Inscrições" mostra rota/veículos e as mensalidades mês a mês.
- Decisões de UI: o documento da inscrição **não é mais pedido** no catálogo (o servidor ainda o aceita, opcional; a academia deixou de poder instruí-lo). Seletor de métodos e avisos do provedor reaproveitam `MetodosPagamentoCheckboxes`/`useMetodosDoProvedor` (Tarefa 42).

## Validação realizada

- **Baseline** (`main` @ `70cc3d9`): `npx tsc --noEmit` sem erros; `npx eslint .` com **10 problemas (2 erros, 8 avisos)**: erros antigos em `verificar-email/[token]/page.tsx` (29:7) e `calendar/Calendar.tsx` (102:13); avisos em `estudantes/cadastrar/SelecaoContextoMassa.tsx` (80, 115), `AppSidebar.tsx` (180, 182) e 4 `exhaustive-deps` nos painéis de serviço antigos.
- **Com a mudança:** `npx tsc --noEmit` **sem erros**; `npx eslint .` com **6 problemas (os mesmos 2 erros e os mesmos 4 avisos que não são de serviços)**: os 4 avisos dos painéis substituídos desapareceram; nenhum problema novo.
- `next build` com a mudança: **compila e gera as 4 rotas novas** (`/servicos-extras/transporte`, `/atividades`, `/atividades/criar`, `/atividades/editar/[id]`). No ambiente de validação, o `next/font/google` (Outfit) não consegue baixar `fonts.googleapis.com`; contornei **só lá** trocando temporariamente a fonte em `layout.tsx` (**não entregue**). Não é erro de código.
- **Não foi visto em navegador** nem exercitado contra o back-end real (sem servidor no ambiente): a lógica visual, os formulários e as chamadas só foram verificados por tipos, lint e build; o contrato foi conferido contra os testes de ponta a ponta do back-end (Tarefa 137).

## Como aplicar

1. **Confirme que a base não mudou:** `git fetch origin && git diff --stat 70cc3d9 origin/main -- src`. Vazio = pode substituir; se listar algo, não substitua e avise.
2. **Apague** os 10 arquivos acima.
3. **Copie** a pasta `rastreio-frontend/` por cima da raiz, mantendo os caminhos.
4. **Verifique** (abaixo) e faça o deploy **antes** da Tarefa 137 do `rastreio-backend`.

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

Esperado: `tsc` sem erros; `eslint` com **6 problemas** (2 erros, 4 avisos), os antigos listados acima, nenhum novo. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte (`git checkout yarn.lock package-lock.json`).

## Fora de escopo

- O back-end (rotas, regras, cobrança, migration): **Tarefa 137 do `rastreio-backend`**.
- Escolha da turma da atividade **pelo estudante**: a academia escolhe ao aprovar (decisão da Tarefa 137).
- Bloqueio por módulo "servicos" e assinatura (Partes 9 e 10) e notificações (Parte 21).
- Edição do documento exigido na inscrição (a academia não define mais).
- Teste automatizado de interface: o repositório não tem; nenhum foi adicionado.

## Marcar como feito

Já está: `**Estado:** feito`, `(feito)` no título e a secção **Resultado** abaixo; o documento nasce em `src/docs/Tarefas feitas/`.

## Checklist

- [ ] Base conferida
- [ ] 10 arquivos apagados; pasta copiada (10 alterados, 8 novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` com 6 problemas, nenhum novo
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Deploy deste front **antes** da Tarefa 137 do `rastreio-backend`

## Resultado

As telas da Parte 7 estão prontas: Transporte (geral, rotas e veículos), Atividades (horários, turmas da atividade), catálogo do estudante com escolha de rota e veículos, inscrições com rota, veículos e turma, e remoção do serviço genérico e das categorias. Desvio: o envio de documento saiu do catálogo, já que a academia não define mais o que exigir.
