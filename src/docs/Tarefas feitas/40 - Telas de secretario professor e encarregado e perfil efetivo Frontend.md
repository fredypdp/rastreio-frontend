# Tarefa 40 — Telas de secretário, professor e encarregado e perfil efetivo  (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `50b3cc1`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Ordem de deploy:** **Depende das Tarefas 130 e 131 do `rastreio-backend` já em produção** (ou na mesma janela). Sem elas, as telas novas recebem `404`/`403`, e o cadastro escolar enviaria um encarregado que o servidor antigo ignora. O backend 4.0.0 **sem** este frontend também quebra o cadastro com encarregado novo e a edição do telefone do encarregado (ver a ordem de deploy da Tarefa 130 do `rastreio-backend`). Vão **juntos**.

---

## Contexto

Plano de Atualizações, **Parte 4** — a interface dos três tipos novos:

- **Secretário:** a academia cria e gere secretários e escolhe as permissões de cada um. O secretário entra e vê **a mesma interface da academia**, mas só o que as permissões liberam; o que é da conta da academia (secretários, dados/NIF/alvará, provedor de pagamento) e o lançamento de notas e faltas ficam fora.
- **Professor:** a academia (ou o secretário) cria professores e vínculos turma+matéria; o professor tem uma área própria, só de consulta.
- **Encarregado:** vê os seus educandos, escolhe em nome de quem age e, a partir daí, usa as telas do estudante; quando o educando conclui o nível escolar, só consulta notas e faltas.

**Como funciona (decisão central):** o servidor já faz o secretário agir como a academia e o encarregado como o educando. Para não reescrever as dezenas de telas que comparam `user.tipo`, o cookie `user` guarda o tipo **efetivo** em `tipo` (secretário → `academia`; encarregado com educando → `estudante`) e o **real** em `tipo_real`. O frontend só **esconde ou mostra**; quem permite é o servidor.

## O que foi atualizado e onde

**11 arquivos alterados + 17 novos** (nesta tarefa; a outra tarefa do pacote lista os seus).

`src/types/api.ts` e `src/lib/api/client.ts` também recebem mudanças da Tarefa 41; a tabela diz o que é de cada uma.

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/types/contas.ts` (**novo**) | — | Contratos novos: permissões, conta de pessoa, professor e vínculos, área do professor, encarregado e educandos, códigos da porta de identidade. |
| `src/types/api.ts` | `UserType` (linha 7) | `UserType` ganha `secretario`, `professor`, `encarregado`; `MeuPerfilResponse` ganha `tipo_real`, `permissoes`, dados da conta, `educandos` e `educando_ativo`. |
| `src/lib/utils/educando.ts` (**novo**) | `cabecalhosDoEducando` (linha 44) | Cookie do educando escolhido e o cabeçalho `X-Educando` (só para o encarregado e fora das rotas de conta). |
| `src/lib/api/client.ts` | cabeçalho do educando (linha 257) | O cliente HTTP envia `X-Educando` automaticamente; sair da conta esquece o educando; o erro 403 traz `permissao_necessaria`. |
| `src/lib/api/contas-service.ts` (**novo**) | `secretarioService` (linha 35) | Serviços de secretários, professores, área do professor e encarregado. |
| `src/lib/api/index.ts` | — | Exporta os serviços novos. |
| `src/lib/perfil-efetivo-regras.ts` (**novo**) | `secretarioPodeAbrir` (linha 57) | Regras **puras** de quais páginas o secretário abre (reservadas, negadas, permissão por página) e a rota inicial de cada tipo. |
| `src/lib/perfil-efetivo.ts` (**novo**) | `aplicarPerfilEfetivo` (linha 57) | **Perfil efetivo** do cookie `user`: secretário vale como `academia`; encarregado com educando escolhido, como `estudante`; o tipo real fica em `tipo_real`. |
| `src/lib/route-guards.ts` | `restricaoDoTipoReal` (linha 395) | Rotas `/secretarios`, `/professores`, `/professor`, `/encarregado`; restrições pelo tipo real (secretário por permissão, professor e encarregado só na sua área, encarregado fora de "personalizar"). |
| `src/hooks/useRoutePermission.ts` | — | Passa o tipo real e as permissões ao guard; expõe `isSecretario`, `isProfessor`, `isEncarregado`. |
| `src/app/(painel)/layout.tsx` | — | Carrega o perfil efetivo e mostra a faixa do educando ao encarregado. |
| `src/components/encarregado/BannerEducando.tsx` (**novo**) | — | Faixa "A agir em nome de …" com a nota da fase de leitura e o botão "Trocar educando". |
| `src/layout/AppSidebar.tsx` | itens novos (linha 82) | Menu: Secretários, Professores, Minhas turmas, Meus educandos; professor e encarregado veem só a sua área; o secretário só vê o que as permissões liberam. |
| `src/components/auth/LoginForm.tsx` | — | Depois do login, cada tipo vai para a sua tela inicial. |
| `src/app/(full-width-pages)/trocar-senha/page.tsx` | — | Depois da troca da senha temporária, cada tipo vai para a sua tela inicial. |
| `src/app/(painel)/perfil/PageContent.tsx` | — | Não sobrescreve o cookie efetivo; mostra o cartão próprio para os três tipos novos. |
| `src/components/user-profile/ContaPessoaCard.tsx` (**novo**) | — | Perfil de secretário, professor e encarregado: dados, academia, permissões, educandos e edição do próprio telefone e e-mail. |
| `src/components/dashboard/PainelDashboard.tsx` | — | O secretário não vê o guia de configuração da academia (leva a páginas reservadas). |
| `src/components/contas/PermissoesPicker.tsx` (**novo**) | — | Seleção agrupada das permissões; marcar "gerir" marca e trava "ver"; "todas". |
| `src/components/contas/AvisoCredenciaisConta.tsx` (**novo**) | — | Resultado do envio das credenciais (a senha nunca aparece no ecrã); explica que não há reenvio para estes tipos. |
| `src/app/(painel)/secretarios/PageContent.tsx` (**novo**) | — | Tela de secretários: lista, criar/editar com permissões, ativar/desativar/eliminar. |
| `src/app/(painel)/secretarios/page.tsx` (**novo**) | — | Rota `/secretarios`. |
| `src/app/(painel)/professores/PageContent.tsx` (**novo**) | — | Tela de professores: lista, criar com vínculos, gerir vínculos, reatribuir, ativar/desativar/eliminar. |
| `src/app/(painel)/professores/page.tsx` (**novo**) | — | Rota `/professores`. |
| `src/app/(painel)/professor/PageContent.tsx` (**novo**) | — | Área do professor: turmas, estudantes, notas e faltas (só consulta). |
| `src/app/(painel)/professor/page.tsx` (**novo**) | — | Rota `/professor`. |
| `src/app/(painel)/encarregado/PageContent.tsx` (**novo**) | — | Área do encarregado: educandos, "Agir em nome", relação. |
| `src/app/(painel)/encarregado/page.tsx` (**novo**) | — | Rota `/encarregado`. |

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

- Cadastro do estudante com encarregado, troca de encarregado e reenvio por perfil: Tarefa 41.
- Lançar e corrigir notas e faltas pelo professor: Parte 11.
- Reenvio de credenciais para secretário, professor e encarregado (não existe no backend; as telas dizem como proceder).
- **Teste em navegador contra o backend real** (ver a validação).

## Marcar como feito

1. `**Estado:** feito`, `(feito)` no título.
2. Secção **Resultado** no fim: um parágrafo curto do que foi efetivamente feito e qualquer desvio.
3. Mover para `src/docs/Tarefas feitas/`, mesmo nome.

## Checklist

- [ ] Base conferida
- [ ] Pasta copiada por inteiro (11 alterados, 17 novos)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` sem problemas novos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos
- [ ] Estado trocado para **feito**, secção **Resultado** adicionada, documento movido para `src/docs/Tarefas feitas/`
