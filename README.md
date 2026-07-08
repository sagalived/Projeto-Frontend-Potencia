<div align="center">
<img width="1200" height="475" alt="GHBanner"/>
</div>


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Indice Mestre de Documentacao (Executivo)

Use este indice para navegar rapidamente pela documentacao segmentada por modulo:

- [README Financeiro](README%20Financeiro.md)
- [README Obras](README%20Obras.md)
- [README 5D Obra](README%205D%20Obra.md)
- [README Suprimentos](README%20Suprimentos.md)
- [README Compras](README%20Compras.md)

Escopo de cada documento:
- Financeiro: KPIs, fluxo de caixa, receita contratada/faturada, formulas e origem dos dados.
- Obras: cards de obra, status, progresso, regras de atraso e navegacao para 5D.
- 5D Obra: detalhamento de Escopo (1D), Planta (2D), Modelo (3D), Tempo (4D) e Custos (5D).
- Suprimentos: abastecimento, risco de ruptura, alertas operacionais e pedidos.
- Compras: desempenho de compras, fornecedores, categorias, status e indicadores de economia.

## Documentacao de Dados e Calculos (NFpg e Rfaturada)

Este documento explica de onde os dados sao baixados, onde ficam salvos localmente e como os KPIs principais sao calculados no dashboard.

### Visao Geral do Fluxo

1. O frontend aplica filtro de datas e consulta apenas APIs locais do Vite:
    - `GET /api/nfpg/data`
    - `GET /api/rfaturada/data`
2. Ao clicar em **Atualizar**, o frontend dispara sincronizacao incremental:
    - `POST /api/nfpg/sync`
    - `POST /api/rfaturada/sync`
3. O backend local (middleware em `vite.config.ts`) busca no Sienge, faz merge com cache local, e grava JSON + Excel em `public/banco/backup/*`.

---

## 1) NFpg (Notas Fiscais Pagas/Compra)

### Endpoints de origem (Sienge)

- Prioridade:
   - `/subsystems/suprimentos/notas-fiscais-compra`
- Fallback:
   - `/purchase-invoices`

Parametros usados no sync:
- `startDate`
- `endDate`
- paginacao interna (`limit`, `offset`)

### Regra de atualizacao incremental

- Primeira carga: usa janela completa do projeto (`2026-01-01` ate data atual, com clamp em `2027-01-01`).
- Proximas cargas: usa apenas os **ultimos 3 dias** para reduzir volume.
- Os dados novos sao mesclados com cache local por chave de nota (`billId` ou combinacao de campos).

### Onde os dados ficam salvos

Pasta:
- `public/banco/backup/NFpg`

Arquivos:
- `nfpg-cache.json` (cache consolidado)
- `sync-state.json` (estado da ultima sincronizacao)
- `NFpg.xlsx` (ultimo Excel consolidado)
- `NFpg-YYYYMMDD_HHMM.xlsx` (snapshot historico)

### Campos principais persistidos no Excel

- `billId`, `companyId`, `supplierId`, `documentId`, `number`
- `issueDate`, `movementDate`, `accountingDate`
- `itemsTotalAmount`, `discount`, `freightAmount`
- `notes`, `createdAt`, `modifiedAt`

---

## 2) Rfaturada (Receita Faturada / Recebimentos)

### Endpoints candidatos de origem (Sienge)

Prioridade configurada:
- `/subsystems/financeiro/contas-a-receber/parcelas?withBankMovements=true&updatedAfter=...`

Fallbacks configurados:
- `/subsystems/financeiro/contas-a-receber/parcelas` com `startDate/endDate`
- `/accounts-receivable/installments` com `withBankMovements=true`
- `/subsystems/financeiro/contas-a-receber/liquidacoes`
- `/subsystems/financeiro/contas-a-receber/baixas`

Observacao importante:
- O sync tenta extrair baixas reais de banco a partir de `bankMovements` (ou variacoes de nomenclatura) e normaliza para uma estrutura unica de movimentacao.

### Regra de atualizacao incremental

- Primeira carga: janela completa (`2026-01-01` ate data atual).
- Proximas cargas: apenas **ultimos 3 dias**, usando `updatedAfter` quando disponivel.
- Merge por chave de movimentacao (`id` ou chave composta).

### Onde os dados ficam salvos

Pasta:
- `public/banco/backup/Rfaturada`

Arquivos:
- `rfaturada-cache.json` (cache consolidado)
- `sync-state.json` (estado da ultima sincronizacao)
- `Rfaturada.xlsx` (ultimo Excel consolidado)
- `Rfaturada-YYYYMMDD_HHMM.xlsx` (snapshot historico)

### Campos principais persistidos no Excel

- `id`, `companyId`
- `accountNumber`, `accountName`
- `date`
- `documentNumber`
- `description`
- `type`
- `value`
- `createdAt`, `modifiedAt`

### Resiliencia quando endpoint nao responde

Se todos os endpoints candidatos retornarem erro (ex.: 404 no tenant):
- o sync registra `syncError` nos JSONs
- ainda gera/atualiza os arquivos locais de backup
- o frontend continua lendo da pasta local (`/api/rfaturada/data`)

---

## 3) Como o Frontend usa os backups

No `src/App.tsx`:
- ao mudar o filtro de datas, o app chama **somente**:
   - `loadNfpgBackupData(range)`
   - `loadRfaturadaBackupData(range)`
- no botao **Atualizar**, chama:
   - `syncNfpgBackup()`
   - `syncRfaturadaBackup()`

Depois injeta os datasets no snapshot em memoria:
- `notasFiscaisCompra`
- `movimentacoesCaixaBancos`

---

## 4) Regras de Calculo dos KPIs Financeiros

As regras abaixo estao centralizadas em `src/bancoData.ts`.

### Receita Contratada

- Base principal: `reciboContratado` (calculado por `computeReciboForRange`).
- Valor exibido em milhoes:
   - `receitaContratada = reciboContratado / 1_000_000`

### Receita Contratada vs Mes Anterior

- Se houver base no mes anterior:
   - `((reciboAtual - reciboMesAnterior) / reciboMesAnterior) * 100`
- Caso contrario: retorna `null` (sem base comparativa).

### Custo Previsto

- Preferencia: soma das parcelas planejadas no periodo (`custoPrevistoMesAtual`).
- Fallback: `totalComprado * 1.06`.

### Custo Real

- `totalComprado` agregado no periodo filtrado.

### Margem Prevista

- `((estimatedRevenue - estimatedPlannedCost) / estimatedRevenue) * 100`

### Margem Real

- `((estimatedRevenue - totalComprado) / estimatedRevenue) * 100`

### Receita Faturada

Regra atual:
1. Se existir `movimentacoesCaixaBancos` (Rfaturada), soma entradas do periodo:
    - `receitaFaturadaPeriodo = sum(abs(value))` para movimentos de entrada.
2. Se nao existir movimentacao valida, fallback para regra anterior:
    - usa parcelas liquidadas de NF no periodo, ou
    - total de notas no periodo com fator `0.96`.
3. Valor final exibido em milhoes:
    - `receitaFaturada = valorBase / 1_000_000`

---

## 5) Mapa rapido de arquivos tecnicos

- `vite.config.ts`
   - middleware local (`/api/nfpg/*`, `/api/rfaturada/*`)
   - sync incremental
   - geracao de Excel
- `src/App.tsx`
   - orquestracao de filtro de datas
   - chamada das APIs locais
   - aplicacao dos datasets no snapshot
- `src/bancoData.ts`
   - transformacoes e calculos dos KPIs
- `src/api/nfpgBackupApi.ts`
   - cliente frontend da API local NFpg
- `src/api/rfaturadaBackupApi.ts`
   - cliente frontend da API local Rfaturada

---

## 6) Como auditar rapidamente se os dados estao sendo localizados

1. Verifique se existem arquivos nas pastas:
    - `public/banco/backup/NFpg`
    - `public/banco/backup/Rfaturada`
2. Abra os JSONs de estado:
    - `sync-state.json` para conferir `lastSyncAt`, `incrementalWindow`, `endpointUsed` e `syncError`.
3. Confira os cache files:
    - `nfpg-cache.json` e `rfaturada-cache.json` (`total` e `items`).
4. Abra os Excel:
    - `NFpg.xlsx` e `Rfaturada.xlsx` para auditoria operacional.

---

## 7) Proposito dos 2 Graficos (Financeiro)

Esta secao documenta os dois graficos mostrados no painel Financeiro:
- `CURVA S - FISICO X FINANCEIRO`
- `FLUXO DE CAIXA MENSAL (PROJETADO X REALIZADO)`

### 7.1 Curva S - Fisico x Financeiro

Objetivo:
- Mostrar a evolucao mensal acumulada da obra, comparando:
   - curva prevista,
   - fisico realizado,
   - financeiro realizado.

Proposito para negocio:
- Identificar antecipadamente descolamento entre andamento fisico e desembolso financeiro.
- Ajudar na leitura de eficiencia de execucao (obra fisicamente atrasada/adiantada em relacao ao financeiro).

Origem dos dados (Sienge + consolidacao local):
- Base financeira consolidada do snapshot local alimentado pelo Sienge.
- O dashboard gera a serie `curvaSData` no processamento de `src/bancoData.ts`.

Como interpretar:
- `Prev` acima de `Fin`: execucao financeira abaixo do planejado.
- `Fin` acima de `Fis`: desembolso mais acelerado que a entrega fisica.

### 7.2 Fluxo de Caixa Mensal (Projetado x Realizado)

Objetivo:
- Comparar, mes a mes, o valor projetado versus o valor efetivamente realizado no caixa.

Proposito para negocio:
- Dar visibilidade de aderencia de caixa ao planejamento.
- Apoiar decisao de curto prazo sobre liquidez, necessidade de ajuste de desembolso e priorizacao.

Origem dos dados (Sienge + consolidacao local):
- Serie mensal `fluxoCaixaMensal` montada a partir da consolidacao financeira em `src/bancoData.ts`.
- Entradas e saidas sao derivadas dos dados sincronizados do Sienge (com leitura local via backup/json no frontend).

Como interpretar:
- `Realizado` menor que `Projetado`: possivel friccao de recebimento/execucao.
- `Realizado` maior que `Projetado`: caixa acima do esperado no periodo.

Observacao:
- O frontend consulta somente APIs locais (`/api/nfpg/data` e `/api/rfaturada/data`) para aplicar filtro; o botao Atualizar aciona a sincronizacao com Sienge e atualiza os arquivos locais.
