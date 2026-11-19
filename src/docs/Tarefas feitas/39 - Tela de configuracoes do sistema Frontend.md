# Tarefa 39 — Tela de configurações do sistema (Parte 3 do Plano de Atualizações) (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `740ce90` (a Tarefa 38, Parte 1, já aplicada)
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório. Nenhum arquivo a apagar.
**Ordem de deploy:** depende da **Tarefa 129 do `rastreio-backend`** (rotas `GET`, `PUT` e `DELETE /admin/sistema/configuracoes`) já em produção. Sem ela, o item "Sistema" aparece no menu de Configurações e a tela mostra o erro `404` do servidor ao carregar. O backend sozinho (Tarefa 129) não precisa desta tarefa para continuar funcionando.

---

## Contexto

A Parte 3 do plano passa 15 variáveis de ambiente do servidor para o banco, editáveis por administradores. O backend (Tarefa 129) expõe a lista aprovada, o valor efetivo, a origem (banco, ambiente ou não definida) e se a alteração vale "na hora" ou "só no próximo reinício". Esta tarefa é a **tela de administração** do último item da Parte 3: `/configuracoes/sistema`, dentro de Configurações.

Comportamento por perfil:

- **Admin `fpp`**: vê todas as configurações agrupadas, pode definir, alterar, substituir (segredo) e "Voltar ao ambiente" (remover o valor gravado).
- **Admin `adm`**: vê tudo, em modo consulta; não aparecem os botões de alterar (o backend exigiria `fpp`).
- **Admin `gerente`, academia e estudante**: não veem o item no menu; abrir a URL à mão redireciona para `/` (guarda de rota) ou mostra "Acesso restrito".

Decisões de UI, replicando telas irmãs:

- A página segue o padrão de `configuracoes/seguranca` (página fina + `PageContent` por seção) e usa os mesmos `Badge`, `Button`, `Modal`, `Icon` e os mesmos cartões e caixas de erro/sucesso de `PasswordSettingsCard`.
- Cada configuração mostra: chave, descrição, **"Vale na hora"** ou **"Vale após reiniciar o servidor"**, a origem ("Gravada pelo sistema", "Variável de ambiente", "Não definida"), o valor atual e quem alterou por último e quando.
- **Segredo** nunca mostra valor: só `********`. O campo de edição é `type="password"`, vem vazio e diz "o atual não é exibido"; só se pode **substituir**. O valor atual nunca chega ao navegador (o backend só manda a máscara).
- O campo muda com o tipo: número (`min`, `max`, inteiro ou decimal), Sim/Não, lista fechada (`LOG_LEVEL`), texto com exemplo. A validação do navegador só dá retorno imediato; quem decide é o servidor, e a mensagem dele é mostrada.
- "Voltar ao ambiente" pede confirmação num modal; para segredo avisa que o valor apagado não se recupera; para configuração de reinício avisa que só vale depois do reinício.
- Depois de salvar ou remover, a tela usa a configuração devolvida pelo servidor (sem recarregar a lista) e mostra a mensagem do servidor, que já termina com o aviso de reinício quando é o caso.

## O que foi atualizado e onde

**5 arquivos alterados + 3 novos.** Números de linha são os do arquivo entregue.

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/app/(painel)/configuracoes/SistemaConfiguracoesSection.tsx` (**novo**, 405 linhas) | `SistemaConfiguracoesSection` | A tela: carrega a lista, agrupa por `grupo`, edita por tipo, confirma a remoção, mostra origem, aplicação e auditoria; só `fpp` vê os botões. |
| `src/app/(painel)/configuracoes/sistema/page.tsx` (**novo**) | — | Página `/configuracoes/sistema` (`<PageContent section="sistema" />`). |
| `src/lib/configuracaoSistema.ts` (**novo**, 62 linhas) | — | Regras puras da tela: rótulos de origem, texto do valor atual (segredo só máscara), validação local por tipo, valor inicial do editor. Separado do componente para poder ser executado e testado. |
| `src/app/(painel)/configuracoes/PageContent.tsx` | imports (linhas 12), `SettingsSection` (20), `PAGE_TITLES` (28), `acessoRestrito` (83), ramo `section === "sistema"` (102) | Nova seção "sistema": só abre para admin com role `fpp` ou `adm`; para qualquer outro perfil devolve o mesmo "Acesso restrito". O bloco de acesso restrito do fim do arquivo virou a constante `acessoRestrito` (linhas 83 e 111/132), sem mudar o texto. |
| `src/layout/AppSidebar.tsx` | `subItems` de Configurações (linha 141), `canSeeSystemSettings` (243), `visiblePaths` (333–335) | Item "Sistema". Admin `fpp` vê todos; admin `adm` vê "Personalizar" e "Sistema"; os demais perfis não mudam. |
| `src/lib/route-guards.ts` | rota `/configuracoes/sistema` (linha 127) | `allowedTypes: ['admin']`, redireciona para `/` (a página refina para `adm` e `fpp`). |
| `src/lib/api/services.ts` | constante (264), imports (164), `adminService.listarConfiguracoesSistema` (2229), `definirConfiguracaoSistema` (2236), `removerConfiguracaoSistema` (2244) | Três métodos para `GET`, `PUT` e `DELETE /admin/sistema/configuracoes[/:chave]`; a chave vai com `encodeURIComponent`. |
| `src/types/api.ts` | bloco "Configurações do sistema" (linhas 2354–2396) | `ConfiguracaoSistemaItem`, `ConfiguracaoSistemaTipo`, `…Aplicacao`, `…Origem`, `ListarConfiguracoesSistemaResponse`, `SalvarConfiguracaoSistemaResponse`. |

## Validação realizada

**Ambiente:** Node 22.23.4, dependências instaladas com `npm install --ignore-scripts`. O `npm install` alterou o `yarn.lock` no sandbox; essa alteração foi descartada e **não** faz parte da entrega.

**Baseline de `main` @ `740ce90`** (worktree limpo, sem a mudança): `npx tsc --noEmit` sem erros; `npx eslint .` com **10 problemas antigos (2 erros, 8 avisos)**:

- `src/app/(full-width-pages)/verificar-email/[token]/page.tsx` 29:7 — erro `react-hooks/set-state-in-effect`
- `src/components/calendar/Calendar.tsx` 102:13 — erro `react-hooks/purity` (`Date.now`)
- `src/app/(painel)/estudantes/cadastrar/SelecaoContextoMassa.tsx` 80:5 e 115:5 — avisos de `eslint-disable` sem efeito
- `src/layout/AppSidebar.tsx` 158:5 (aviso de `eslint-disable` sem efeito) e 160:6 (`useEffect` sem a dependência `closeMobileSidebar`)
- `src/components/paineis/CategoriasServicoPainel.tsx` 33:38, `ServicosExtrasPainel.tsx` 75:38, `MinhasInscricoesServicoExtraPainel.tsx` 3:769 e `ServicosExtrasSolicitacoesPainel.tsx` 13:507 — avisos `react-hooks/exhaustive-deps`

**Pasta entregue copiada por cima de um clone limpo de `main` @ `740ce90`:** `npx tsc --noEmit` sem erros. `npx eslint .` com **os mesmos 10 problemas**; a única diferença é que os dois avisos de `AppSidebar.tsx` passam de 158:5/160:6 para **159:5/161:6**, porque o item novo entrou uma linha acima. Nenhum problema novo nos 8 arquivos tocados.

**Lógica executada de verdade** (compilada com `tsc` e rodada no Node, 23 asserções, todas verdes): segredo mostra só a máscara mesmo que um `valor` viesse na resposta; validação local (inteiro, mínimo, máximo, decimal, vazio, não numérico); valor inicial do editor por tipo; e a guarda `checkRoutePermission('/configuracoes/sistema', …)`: `admin` entra; `academia`, `estudante` e visitante saem para `/`.

**`next build`:** no ambiente de validação falha só por rede (`Failed to fetch Outfit from Google Fonts`, `fonts.googleapis.com`) — limitação do ambiente, não erro de código. Para ver o resto do build, foi feita uma cópia **temporária** trocando a fonte do Google por uma local (essa cópia não faz parte da entrega).
O build dessa cópia terminou com `rc=0` (`Compiled successfully`, 64 páginas geradas) e a lista de rotas passou a conter `/configuracoes/sistema`, ao lado de `/configuracoes/seguranca` e das demais.

**Não foi validado:** a parte visual num navegador (nenhuma tela foi aberta) e a integração real com o backend da Tarefa 129 (o contrato foi seguido a partir do código e dos testes do backend, e a lógica foi executada em isolamento). O repositório deixou de responder a acesso anônimo no fim da sessão, então não consegui reconfirmar o `HEAD` de `main` perto da entrega — use o comando de divergência abaixo.

## Como aplicar

1. **Confirme que a base não mudou:** `git diff --stat 740ce90 HEAD -- src/app/\(painel\)/configuracoes/PageContent.tsx src/layout/AppSidebar.tsx src/lib/api/services.ts src/lib/route-guards.ts src/types/api.ts`. Vazio = pode substituir; se aparecer algum arquivo, ele mudou depois da base — não substitua e avise.
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos.
3. **Verifique** (abaixo).
4. Commit: o texto está na resposta da entrega.
5. **Marque como feito** (abaixo), se algo divergir.

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

Esperado: `tsc` sem erros; `eslint` com exatamente os 10 problemas antigos acima (2 erros, 8 avisos) e nenhum novo — os dois avisos de `AppSidebar.tsx` aparecem em 159:5 e 161:6. Se o `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração (`git checkout yarn.lock`). Com o backend da Tarefa 129 no ar, abra `/configuracoes/sistema` como `fpp` (deve listar 15 configurações em 7 grupos) e como `adm` (mesma lista, sem botões de alterar).

## Fora de escopo

- **Backend:** Tarefa 129 do `rastreio-backend` (rotas, validação, auditoria, cofre de segredos).
- **Histórico de alterações por configuração** na tela: o backend guarda tudo no ledger, mas ainda não há rota para consultá-lo.
- **Rebuild de projeções (Admin → Configurações):** a lista do frontend não foi estendida com `configuracao_sistema` (ela já não lista as projeções mais recentes).
- **Novas variáveis das próximas partes:** aparecem sozinhas na tela, porque ela é montada a partir da lista que o backend devolve.

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida (`740ce90`)
- [ ] Pasta copiada (5 arquivos alterados, 3 novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` com os mesmos 10 problemas antigos (2 erros, 8 avisos), nenhum novo
- [ ] Tarefa 129 do `rastreio-backend` já em produção antes deste deploy
- [ ] Tela aberta como `fpp` e como `adm`
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`

## Resultado

A tela `/configuracoes/sistema` foi implementada: lista as 15 configurações aprovadas por grupo, mostra origem, "vale na hora / só no reinício" e quem alterou, edita por tipo com validação, substitui segredos sem nunca exibi-los e remove valores com confirmação; só o `fpp` altera e `adm` consulta. Desvios: nenhum em relação ao plano; a parte visual não foi vista num navegador.
