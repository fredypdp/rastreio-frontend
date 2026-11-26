# Tarefa 42 — Seletor de provedor, subtela do PayPay e avisos de cobrança (frontend)

**Estado:** feito
**Repositório:** https://github.com/fredypdp/rastreio-frontend
**Gerado sobre:** `main` @ `3b2b75c`
**Entrega:** arquivos completos e atualizados na pasta `rastreio-frontend/`, com os mesmos caminhos do repositório
**Plano:** Parte 6 (Provedor PayPay e troca de provedor), item de front-end
**Ordem de deploy:** depende da **Tarefa 136 do `rastreio-backend`** (versão 4.1.0 da API) já em produção. Sem ela, o catálogo de provedores não traz o PayPay e a tela continua a mostrar só a AppyPay (nada quebra); os selos de duplicidade e divergência só aparecem quando o backend os enviar. Ordem: **backend primeiro, depois front-end**.

---

## Contexto

A Parte 6 do plano pede, na tela de credenciais do módulo de finanças, **a escolha do provedor no topo e, para cada um (PayPay, AppyPay), uma subtela com os campos de credenciais**, mostrando qual está ativo. O PayPay ainda não tem manual (a subtela fica sem ele); a AppyPay mantém os textos atuais. O pedido incluiu também mostrar ao pagador os dados da referência do PayPay e avisar a academia de cobranças pagas em duplicidade ou com valor divergente (campos novos do backend).

Antes desta tarefa, a tela já montava o formulário a partir do catálogo do backend (`GET /financeiro/provedores`), mas listava os provedores como cartões e escolhia o provedor dentro do formulário, e mostrava a resposta do provedor em JSON cru ao pagador de uma referência.

## O que foi atualizado e onde

**5 arquivos alterados + 1 novo (este documento).**

| Arquivo | Onde | O que mudou |
| --- | --- | --- |
| `src/components/paineis/ProvedorPagamentoPainel.tsx` | estado `provedorEscolhido` (linha 149) e derivados `emFoco` (214) | Novo estado do provedor escolhido no seletor. O provedor em foco é o escolhido, senão o ativo do contexto, senão o primeiro do catálogo. |
| idem | bloco "Provedores disponíveis" (a partir da linha 454) | Os cartões foram substituídos por um **seletor em abas** (uma por provedor do catálogo, com a marca "Provedor ativo") e pela **subtela** do provedor escolhido. |
| idem | `rows` (356) e texto de lista vazia (491) | A tabela de credenciais mostra só as do provedor escolhido; a mensagem de lista vazia cita o provedor. |
| idem | formulário (566 a 612) | O seletor de provedor saiu do formulário (o provedor é o da subtela, mostrado como texto). Campos com `multilinha` usam o novo campo de texto grande (570). Provedores sem segredo de webhook e com endereços de notificação mostram o endereço no formulário (612). |
| idem | `SubtelaProvedor` (812) — **novo componente** | Situação do provedor no contexto (ativo, credenciais configuradas, pendentes, credenciais arquivadas), métodos suportados, ações "Configurar credenciais" e "Definir como provedor", e o endereço de notificação quando existe. |
| idem | `EnderecoNotificacao` (856) — **novo componente** | Mostra, com botão copiar, o endereço (base da API + caminho do catálogo) a configurar no portal dos provedores que assinam as notificações (PayPay). |
| idem | `MultilineField` (881) — **novo componente** | Campo de texto grande para chaves RSA; se secreto, fica escondido por omissão, com botão Mostrar/Ocultar. |
| `src/components/paineis/financeiroShared.tsx` | `ReferenciaPagamento` (316) — **novo** | Mostra **Entidade** e **Referência** quando o provedor as devolve (PayPay); nos outros mantém a resposta como sempre foi mostrada. |
| idem | lista de cobranças (801, 806) e detalhe (981, 987) | Selos "Pago em duplicidade" e "Valor divergente" e um aviso no detalhe de cada caso. |
| `src/components/paineis/EstudantePagamentosPainel.tsx` | import (23) e bloco de REF (434) | Usa `ReferenciaPagamento` no lugar do JSON cru. |
| `src/components/paineis/ServicoExtraPagamento.tsx` | import (5) e resultado de REF (10) | Idem, para o pagamento de serviços extras. |
| `src/types/api.ts` | `FinanceiroCampoCredencial` (1440) e `CobrancaResumo` (1823 a 1832) | Campos opcionais novos: `multilinha`; `pago_em_duplicidade`, `duplicidade_com`, `pagamento_divergente`, `valor_pago_provedor`. |

**Comportamento resultante (em linguagem simples):**
- A academia (ou o admin FPP, no contexto Spuri) abre Finanças → Configurações → Provedor e vê, no topo, uma aba por provedor. Escolhe **PayPay** e vê os quatro campos (Partner ID, Sale Product Code, chave privada, chave pública do PayPay), as ações e o **endereço de notificação** para colar no portal do PayPay. **AppyPay** mostra o que já mostrava, incluindo o texto de adesão e o segredo do webhook.
- O PayPay não tem manual: a nota de adesão mostra só o texto geral, sem as linhas específicas da AppyPay.
- O estudante que paga por referência no PayPay vê **Entidade** e **Referência**; na AppyPay continua a ver o que via.
- A academia vê, nas cobranças, os selos de **pagamento em duplicidade** (devolver o valor ao pagador) e de **valor divergente** (a cobrança não foi quitada; confirmar com o provedor).
- Os métodos oferecidos ao pagador já vinham filtrados pelo backend e não mudam.

## Validação realizada

Ambiente: Node (o do sandbox), dependências por `npm ci`; `next` 16.0.10.

- **Baseline (`main` @ `3b2b75c`):** `npx tsc --noEmit` sem erros; `npx eslint .` com **10 problemas (2 erros, 8 avisos)**, todos antigos: `verificar-email/[token]/page.tsx` (erro), `calendar/Calendar.tsx` (erro) e avisos em `SelecaoContextoMassa.tsx`, `CategoriasServicoPainel.tsx`, `MinhasInscricoesServicoExtraPainel.tsx`, `ServicosExtrasPainel.tsx`, `ServicosExtrasSolicitacoesPainel.tsx` e `AppSidebar.tsx`.
- **Com a mudança**, num clone novo de `main` com a pasta copiada por cima: `npx tsc --noEmit` **sem erros** (saída vazia, código 0) e `npx eslint .` com os **mesmos 10 problemas**, idênticos ao baseline (comparação feita ignorando só as posições de linha e coluna): nenhum problema novo, nenhum nos arquivos desta tarefa.
- **`next build`:** falha só por `fonts.googleapis.com` (Outfit) estar bloqueado no sandbox. Para provar o restante, repeti o build com a fonte trocada por uma local **apenas no ambiente de teste (revertido, não faz parte da entrega)**: compilou, passou o TypeScript e gerou todas as rotas.
- **Não validado:** a tela **não foi aberta num navegador** nem contra um backend real (o backend com o PayPay precisa estar publicado); o aspecto visual das abas, o campo mascarado das chaves (usa `-webkit-text-security`, que alguns navegadores ignoram, caso em que a chave fica visível enquanto digita) e o botão copiar ficam por conferir à mão.

## Como aplicar

1. **Confirme que a base não mudou:** `git fetch origin && git diff --stat 3b2b75c origin/main -- src/components/paineis/ProvedorPagamentoPainel.tsx src/components/paineis/financeiroShared.tsx src/components/paineis/EstudantePagamentosPainel.tsx src/components/paineis/ServicoExtraPagamento.tsx src/types/api.ts`. Vazio = pode substituir; se aparecer algum arquivo, ele mudou depois da base — não substitua e avise.
2. **Copie** a pasta `rastreio-frontend/` para a raiz do repositório, mantendo os caminhos.
3. **Verifique** (abaixo).
4. **Marque como feito** (já está neste documento).

## Verificação

```bash
npm install
npx tsc --noEmit
npx eslint .
```

Esperado: `tsc` sem erros; `eslint` com exatamente os 10 problemas antigos listados acima. Se `npm install` alterar `yarn.lock` ou `package-lock.json`, descarte essa alteração (`git checkout yarn.lock package-lock.json`).

## Fora de escopo

- **Manual do PayPay** (decisão do plano: não existe ainda). A subtela dele só tem o texto geral de adesão.
- **Teste de conexão** antes de ativar um provedor (sugestão do plano; não implementada nesta Parte, ver Tarefa 136 do `rastreio-backend`).
- Qualquer ação nova sobre cobranças duplicadas ou divergentes (devolver, forçar a quitação): hoje só há o **aviso**. Fica para a Parte 8.
- Aviso por e-mail ou SMS à academia sobre duplicidade ou divergência: a Parte 25 (notificações financeiras).
- Telas de reembolso, transferências, Kwik e agente do PayPay.
- A parte de back-end do mesmo pedido: **Tarefa 136 do `rastreio-backend`**.

## Marcar como feito

Já feito: `**Estado:** feito` e documento em `src/docs/Tarefas feitas/`.

## Checklist

- [ ] Base conferida
- [ ] Pasta copiada por inteiro (5 alterados, 1 novo)
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx eslint .` sem problemas novos
- [ ] `package.json`, `package-lock.json` e `yarn.lock` intactos

## Resultado

Seletor de provedor em abas e subtela por provedor na tela de credenciais; campos de chave em texto grande; endereço de notificação do PayPay com botão copiar; entidade e referência legíveis para o pagador; selos e avisos de pagamento em duplicidade e de valor divergente. Validado com `tsc`, `eslint` e `next build` (este com fonte local só no teste); sem teste em navegador.
