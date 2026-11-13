# SpuriPainel

As regras gerais (gatilho "Nova tarefa", documento de tarefa, segurança e relatório) estão em `../CLAUDE.md`.

## Leitura obrigatória

Antes de editar, leia por inteiro as páginas, os componentes, os serviços, os tipos e os guards de rota que a mudança toca.

## Validação

- Baseline: rode `tsc` e `eslint` do projeto inteiro antes de editar.
- Depois da mudança: `tsc`, `eslint` do projeto inteiro e, se o ambiente permitir, `next build`.
- Se o `next build` falhar só por rede (Google Fonts), diga isso no relatório.
- Ao testar, aponte o frontend para um backend local. Nunca para a API de produção.
