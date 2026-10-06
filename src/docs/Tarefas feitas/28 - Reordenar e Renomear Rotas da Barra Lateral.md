# Tarefa 28 — Reordenar e renomear as rotas da barra lateral (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `adbe698`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** nenhuma dependência do `rastreio-backend` (não há tarefa irmã: nenhuma rota, campo ou resposta da API muda). Pode ir a qualquer momento. Também é independente da Tarefa 27 (pendente), que não toca `AppSidebar.tsx`: as duas podem ser aplicadas em qualquer ordem.

---

## Contexto

Pedido: deixar a barra lateral, para cada tipo de usuário, na ordem do arquivo "Rotas da Barra Lateral por Tipo de Usuário.md" e trocar o nome do grupo "Serviços Extras" por "Serviços".

A barra lateral é um **único** array de itens (`navItems`), do qual cada tipo de usuário vê um subconjunto filtrado, sempre na ordem do array. Por isso a ordem pedida só pode ser entregue se existir **uma única sequência** que sirva admin, academia e estudante ao mesmo tempo. Ela existe e é esta:

Painel → Perfil → Finanças → Pagamentos (estudante) → Gerenciamento → Academias → Estudantes → Notas & Faltas → Solicitações → Serviços → Comunicação → Avaliações → Administradores → Auditoria → Armazenamento → Configurações → Testes.

Em `main`, a ordem era outra (por exemplo, "Pagamentos" do estudante vinha só depois de "Solicitações", e "Comunicação" ficava depois de "Testes"), e o grupo se chamava "Serviços Extras".

## Decisões tomadas (pontos em que o arquivo anexo e o código atual não coincidem)

1. **"Solicitações" continua visível para admin e academia.** O arquivo anexo só a lista para o estudante, mas hoje a barra a mostra aos três tipos, a página `/solicitacoes` funciona para os três (a academia aprova ou reprova pedidos de interrupção, desvinculação e revinculação; o admin escolhe uma academia; o estudante cria pedidos) e o guard de rota (`route-guards.ts`) libera os três. Esconder o item seria tirar o acesso a uma função existente, o que vai além de "reordenar e renomear". O item fica logo depois de "Notas & Faltas", o mesmo lugar do estudante, sem alterar a ordem relativa de nenhum item do anexo.
2. **Grupo sem subitens visíveis deixa de aparecer.** Em `main`, todo admin via "Serviços Extras" como um botão que abre vazio (todos os subitens do grupo são de academia ou de estudante). O anexo diz que o admin não tem esse grupo, então passou a valer a regra geral: grupo sem nenhum subitem visível para o tipo de usuário não aparece.
3. **O nome novo vale só para o rótulo do menu.** As URLs (`/servicos-extras/...`) e os títulos das próprias páginas (por exemplo "Serviços Extras", "Catálogo de Serviços Extras") não mudam.
4. **O que o anexo não cobre fica como estava:** escola de ensino médio puro (vê "Cursos" e não vê "Anos acadêmicos"), admin que não é FPP e gerente (continuam vendo menos itens em "Configurações" e sem "Auditoria", no caso do gerente). Esses perfis só mudam de ordem.

## O que foi atualizado e onde

**1 arquivo alterado + 0 novos** (mais este documento).

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/layout/AppSidebar.tsx` | comentário acima do array (linhas 25–27) | Explica que a ordem do array é a ordem exibida e que cada tipo de usuário vê um subconjunto na mesma ordem relativa |
| `src/layout/AppSidebar.tsx` | array `navItems` (linhas 28–151) | Os itens foram **reordenados** (blocos movidos inteiros, sem alterar ícones, caminhos nem subitens): Painel (31), Perfil (36), Finanças (41), Pagamentos (51), Gerenciamento (55), Academias (66), Estudantes (75), Notas & Faltas (83), Solicitações (92), Serviços (96), Comunicação (108), Avaliações (112), Administradores (120), Auditoria (125), Armazenamento (130), Configurações (135), Testes (148) |
| `src/layout/AppSidebar.tsx` | item do grupo, `name` (linha 96) | O rótulo "Serviços Extras" virou "Serviços" |
| `src/layout/AppSidebar.tsx` | `filteredNavItems`, bloco dos serviços (linhas 357 e 359) | O filtro por tipo de usuário procurava o grupo pelo nome antigo; passou a procurar "Serviços". Sem isso, o estudante passaria a ver os subitens da academia e vice-versa |
| `src/layout/AppSidebar.tsx` | fim do encadeamento de `filteredNavItems` (linhas 374–376) | Novo filtro final que remove o grupo cujo conjunto de subitens ficou vazio para aquele tipo de usuário |

Nenhum arquivo precisa ser apagado, movido nem renomeado.

### O que cada tipo de usuário passa a ver (nesta ordem)

| Tipo | Itens |
| --- | --- |
| Admin | Painel · Perfil · Finanças · Academias · Estudantes · Notas & Faltas · Solicitações\* · Comunicação · Avaliações · Administradores · Auditoria (só FPP e ADM) · Armazenamento · Configurações |
| Academia (escola e superior) | Painel · Perfil · Finanças · Gerenciamento · Estudantes · Notas & Faltas · Solicitações\* · Serviços · Comunicação · Avaliações · Configurações · Testes (só se `isTestesPageEnabled()`) |
| Estudante | Painel · Perfil · Pagamentos · Notas & Faltas · Solicitações · Serviços · Avaliações · Configurações |

\* Item que o anexo não lista para esse tipo e que foi mantido (decisão 1).

Os subitens de cada grupo, a ordem deles e as regras de visibilidade que já existiam (por exemplo, "Cursos" oculto no fundamental puro, "Anos acadêmicos" só no fundamental e misto, "Cadastrar" de estudantes só para academia) **não mudaram**.

## Validação realizada

**Baseline (`main` @ `adbe698`):** `npm ci` ok; `npx tsc --noEmit` sem erros; `npx eslint .` → **10 problemas (2 erros, 8 avisos)**, todos antigos: `verificar-email/[token]/page.tsx`, `estudantes/cadastrar/SelecaoContextoMassa.tsx`, `calendar/Calendar.tsx`, `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx` e `layout/AppSidebar.tsx` (2 avisos nas linhas 158 e 160).

**Depois (clone novo de `main` @ `adbe698`, o arquivo copiado por cima):**

```
tsc exit=0
✖ 10 problems (2 errors, 8 warnings)
eslint: IDENTICO ao baseline (mesmos 10 problemas, mesmas mensagens)
AppSidebar baseline: 158:5 e 160:6   →   depois: 161:5 e 163:6   (só deslocou 3 linhas, pelo comentário novo)
```

**Renderização do componente real.** `AppSidebar.tsx` foi compilado e renderizado com `react-dom/server` para 11 perfis (admin FPP, ADM e gerente; academia fundamental, mista, média e superior, com e sem Testes; estudante e estudante com finanças restritas; perfil ainda carregando). Só `next/*`, os hooks de usuário e os ícones foram substituídos por stubs. O resultado foi comparado com o arquivo anexo **lido diretamente** (não transcrito):

```
ANTES (main):   FALHA em admin, academia fundamental/mista/superior e estudante; FALHA grupos vazios: admin_fpp, admin_adm, admin_gerente → "Serviços Extras"
DEPOIS:
PASSA  admin_fpp              [extra mantido: Solicitações /solicitacoes]
PASSA  academia_fundamental   [extra mantido: Solicitações /solicitacoes]
PASSA  academia_misto         [extra mantido: Solicitações /solicitacoes]
PASSA  academia_superior      [extra mantido: Solicitações /solicitacoes]
PASSA  estudante
PASSA  nenhum grupo vazio em nenhum perfil
```

**Perfis que o anexo não cobre**, comparados com `main` (mesmo conjunto de itens, caminhos, ícones e subitens; só muda a ordem, o nome do grupo e a remoção do grupo vazio): 11 de 11 PASSA. Estudante com finanças restritas continua vendo só "Pagamentos"; perfil carregando continua sem nenhum item.

**Item e subitem ativos por rota (14 cenários, 3 tipos de usuário)**, por exemplo `/servicos-extras/catalogo`, `/faltas/configuracoes`, `/financas/pagamentos`, `/gerenciamento/turmas`, `/testes`, `/comunicacao`: 14 de 14 PASSA depois. Em `main`, os mesmos 14 se comportam igual (as 2 "diferenças" são só o nome do grupo, "Serviços Extras" → "Serviços").

**Ciclo desfazer regra → teste falha → restaurar** (seis mutações em cópias do arquivo entregue; o `sha256` do arquivo entregue ficou igual antes e depois):

| Regra desfeita | Resultado do teste |
| --- | --- |
| "Comunicação" de volta para depois de "Testes" | FALHOU (admin_fpp) |
| "Pagamentos" do estudante de volta para depois de "Solicitações" | FALHOU (estudante) |
| "Notas & Faltas" antes de "Estudantes" | FALHOU (admin_fpp) |
| Rótulo de volta para "Serviços Extras" | FALHOU (admin_fpp) |
| Filtro por tipo de usuário esquecido no nome antigo | FALHOU (admin_fpp: todos os subitens passam a aparecer) |
| Filtro de grupo vazio removido | FALHOU (admin_fpp) |

Depois de restaurar, o teste voltou a passar (saída acima).

**`next build`:** falha **só por rede**, tanto em `main` quanto com a mudança: `Failed to fetch Outfit from Google Fonts` (`src/app/layout.tsx`). Para ter evidência do resto do build, repeti **nos dois** com a fonte trocada por uma local, de forma temporária e descartável (já restaurada com `git checkout`, nada disso foi entregue): `Compiled successfully`, TypeScript sem erros, 67 páginas estáticas, **69 rotas nos dois, com a mesma lista** de tipo e caminho.

**Limites:** a parte visual não foi vista num navegador (o componente foi validado por renderização no servidor, que cobre quais itens aparecem, em que ordem e qual fica ativo, mas não o espaçamento, o realce nem a animação do menu). O script de verificação usado (render + comparação com o anexo) é temporário e não faz parte do repositório; o projeto não tem framework de testes.

## Observações sobre comportamentos antigos (não alterados nesta tarefa)

Descobertos ao validar; já existiam em `main` e **não** foram mexidos por estarem fora do pedido.

- **O grupo da rota atual não abre sozinho.** `derivedOpenSubmenu` (linha 380) percorre `["main", "others"]` (linha 383) e fica com o último valor, `"others"`, enquanto a renderização compara com `"main"`. Resultado: ao abrir, por exemplo, `/notas`, o grupo "Notas & Faltas" aparece fechado até o clique. Confirmado trocando o laço para só `"main"` numa cópia descartável (o grupo passa a abrir). Visto na renderização do componente, não num navegador.
- **Em `/academias/cadastrar`, "Listar" e "Cadastrar" ficam realçados juntos**, porque a rota de "Listar" (`/academias`) é prefixo da outra.

## Como aplicar

1. **Confirme que a base não mudou.** Na raiz do repositório:
   ```bash
   git fetch origin && git diff --stat adbe698 origin/main -- src/layout/AppSidebar.tsx
   ```
   Saída **vazia** = pode substituir. Se aparecer o arquivo, ele mudou depois da base: não substitua e avise. (Se `HEAD` local for o `main` atualizado, `git diff --stat adbe698 HEAD -- src/layout/AppSidebar.tsx` faz a mesma checagem.)
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos. O arquivo é completo e substitui o existente por inteiro; o documento novo cai em `src/docs/Lista de Tarefas/`.
3. **Verifique** e **marque como feito** (abaixo).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

`tsc` sem nenhum erro. `eslint` deve terminar com **10 problemas (2 erros, 8 avisos)**, os mesmos de antes; os dois avisos de `layout/AppSidebar.tsx` agora aparecem nas linhas 161 e 163. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração.

Conferência rápida no navegador, se quiser: entre como estudante, academia e admin e veja se a ordem bate com o arquivo anexo, se o grupo se chama "Serviços" e se o admin não vê grupo vazio.

## Fora de escopo

- **Não** alterar o `rastreio-backend` (nenhuma rota, campo ou resposta muda; não há tarefa irmã).
- **Não** alterar `route-guards.ts` nem as URLs: `/servicos-extras/...` continua igual; a mudança de nome é só do rótulo do menu.
- **Não** renomear os títulos das páginas de serviços ("Serviços Extras", "Catálogo de Serviços Extras", "Minhas Inscrições em Serviços Extras", "Inscrições em Serviços Extras", "Gerenciar Serviços Extras", "Solicitações de Serviços Extras").
- **Não** esconder "Solicitações" de admin e academia (decisão 1), nem mudar as regras de visibilidade do que o anexo não cobre (decisão 4).
- **Não** corrigir os dois comportamentos antigos descritos acima (grupo da rota atual fechado e realce duplo em `/academias/cadastrar`).
- **Não** corrigir os avisos e erros antigos do `eslint`.

## Marcar como feito

1. Troque `**Estado:** pendente` por `**Estado:** feito` e coloque `(feito)` no início do título.
2. Acrescente no fim uma secção **Resultado** com um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mova este documento de `src/docs/Lista de Tarefas/` para `src/docs/Tarefas feitas/`, com o mesmo nome.

## Checklist

- [ ] Base conferida (`git diff --stat adbe698 origin/main -- src/layout/AppSidebar.tsx` vazio)
- [ ] Pasta copiada (1 alterado, 0 novos, mais este documento)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` → 10 problemas (2 erros, 8 avisos), todos antigos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estudante, academia e admin veem a barra na ordem do arquivo anexo; o grupo se chama "Serviços"; o admin não vê grupo vazio
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`
