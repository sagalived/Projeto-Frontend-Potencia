# README Financeiro

## 1. Objetivo do modulo

Este documento cobre somente o modulo Financeiro do sistema.
Ele explica:
- quais dados entram do Sienge,
- quais campos aparecem na tela,
- onde cada campo e preenchido no codigo,
- quais formulas sao usadas nos calculos.

## 2. Onde o modulo e renderizado

- Tela principal: aba Financeiro
- Componente: src/components/FinancialDashboard.tsx
- Montagem dos dados na tela: src/App.tsx

Fluxo de dados da aba:
1. App monta o objeto data da aba Financeiro em src/App.tsx.
2. Esse objeto vem de buildDashboardDataFromSnapshot(snapshot, filters) em src/bancoData.ts.
3. Algumas secoes sao sobrescritas por funcoes especificas:
   - buildFinanceResults
   - buildFluxoCaixaDetalhado
   - buildIndicadoresFinanceiros
   - buildUltimasMovimentacoes
   - buildFinanceiroMensal

## 3. Fontes de dados (entrada)

As principais entradas do Financeiro em src/bancoData.ts sao:
- compras.items
- financeiro.datasets.extratoContas.items
- financeiro.datasets.contasCorrentes.items
- financeiro.datasets.saldosContas.items
- financeiro.datasets.notasFiscaisCompra.items
- financeiro.datasets.contasPagarParcelas.items
- financeiro.datasets.movimentacoesCaixaBancos.items

Dados de backup local usados no filtro/atualizacao:
- /api/nfpg/data e /api/nfpg/sync
- /api/rfaturada/data e /api/rfaturada/sync

## 4. Dicionario de campos da tela Financeiro

### 4.1 KPIs (topo)

Campos exibidos (tipo KPIData):
- receitaContratada
- receitaContratadaVsMesAnterior
- receitaFaturada
- custoReal
- margemReal
- fluxoCaixaProjetado
- fluxoCaixaReal
- desvioOrcamentario

Preenchimento no codigo:
- Montados em src/bancoData.ts, dentro do retorno de buildDashboardDataFromSnapshot (objeto kpis).
- Enviados para a tela em src/App.tsx no bloco activeTab === 'financeiro'.

### 4.2 Grafico Curva S - Fisico x Financeiro

Campos da serie (CurvaSData):
- mes
- previstoFisico
- realizadoFisico
- realizadoFinanceiro

Preenchimento:
- Calculado em src/bancoData.ts na variavel curvaSData.

### 4.3 Grafico Fluxo de Caixa Mensal (Projetado x Realizado)

Campos da serie (FluxoCaixaMensalData):
- mes
- projetado
- realizado

Preenchimento:
- Base em buildFinanceiroMensal(snapshot) em src/bancoData.ts.
- Adaptacao para milhoes no envio da aba Financeiro em src/App.tsx.

### 4.4 Composicao de Custos

Campos:
- name
- value
- percentage

Preenchimento:
- Gerado em src/bancoData.ts na variavel custoDist, a partir de comprasCategoria.

### 4.5 Analise de Desvio por Etapa

Observacao:
- No estado atual, essa tabela do componente FinancialDashboard.tsx usa linhas locais fixas no proprio componente.
- Nao vem do Sienge nesse bloco especifico.

### 4.6 Demonstrativo de Resultado

Campos (FinanceResultRow):
- descricao
- previsto
- realizado
- desvio
- percentualDesvio

Preenchimento:
- Funcao buildFinanceResults(snapshot) em src/bancoData.ts.
- Aplicado na aba Financeiro em src/App.tsx.

### 4.7 Fluxo de Caixa Detalhado

Campos (FluxoCaixaDetalhadoRow):
- mes
- entradas
- saidas
- saldoProjetado
- saldoReal
- isProjection (opcional)

Preenchimento:
- Funcao buildFluxoCaixaDetalhado(snapshot) em src/bancoData.ts.
- Aplicado na aba Financeiro em src/App.tsx.

### 4.8 Indicadores Financeiros

Campos (FinanceIndicator):
- name
- value
- metaLabel
- status

Preenchimento:
- Funcao buildIndicadoresFinanceiros(snapshot) em src/bancoData.ts.
- Aplicado na aba Financeiro em src/App.tsx.

### 4.9 Ultimas Movimentacoes

Campos (FinanceTransaction):
- id
- data
- descricao
- valor
- tipo

Preenchimento:
- Funcao buildUltimasMovimentacoes(snapshot) em src/bancoData.ts.
- Aplicado na aba Financeiro em src/App.tsx.

## 5. Regras de calculo (detalhadas)

### 5.1 Receita Contratada

Origem:
- notasFiscaisCompra + contasPagarParcelas (documentos tipo NF)

Regra:
1. Soma total de notas no periodo filtrado.
2. Soma total de parcelas liquidadas de NF no periodo.
3. Se houver parcelas liquidadas, usa parcelas.
4. Se nao houver, usa total de notas.
5. Converte para milhoes no KPI:
   - receitaContratada = reciboContratado / 1_000_000

### 5.2 Receita Contratada vs Mes Anterior

Regra:
- ((reciboAtual - reciboMesAnterior) / reciboMesAnterior) * 100
- Se reciboMesAnterior = 0, retorna null.

### 5.3 Custo Previsto

Origem:
- parcelas em aberto/parcial com vencimento no mes atual

Regra:
1. Soma saldo restante dessas parcelas.
2. Fallback se vazio:
   - totalComprado * 1.06
3. KPI em milhoes:
   - custoPrevisto = estimatedPlannedCost / 1_000_000

### 5.4 Custo Real

Origem:
- compras filtradas (totalAmount)

Regra:
- soma totalAmount da selecao
- KPI em milhoes:
  - custoReal = totalComprado / 1_000_000

### 5.5 Receita Faturada

Origem principal:
- movimentacoesCaixaBancos

Regra:
1. Filtra movimentacoes no periodo selecionado.
2. Considera apenas entradas.
3. Soma abs(value/amount).
4. Se nao houver movimentacao valida, fallback:
   - parcelas liquidadas NF no periodo, ou
   - notas fiscais no periodo * 0.96
5. KPI em milhoes:
   - receitaFaturada = valorBase / 1_000_000

### 5.6 Margem Prevista e Margem Real

Variaveis base:
- estimatedRevenue = reciboContratado > 0 ? reciboContratado : totalComprado * 1.18
- estimatedPlannedCost = custoPrevistoMesAtual > 0 ? custoPrevistoMesAtual : totalComprado * 1.06

Formulas:
- margemPrevista = ((estimatedRevenue - estimatedPlannedCost) / estimatedRevenue) * 100
- margemReal = ((estimatedRevenue - totalComprado) / estimatedRevenue) * 100

### 5.7 Fluxo de Caixa Projetado e Real (KPI)

Base:
- monthlySeries em src/bancoData.ts

Formulas:
- fluxoCaixaProjetado = soma(item.total * 1.08)
- fluxoCaixaReal = soma(item.total)

### 5.8 Desvio Orcamentario

Formula:
- ((totalComprado - estimatedPlannedCost) / estimatedPlannedCost) * 100
- Com protecao para divisor:
  - Math.max(1, estimatedPlannedCost)

## 6. Campos com fallback e resiliencia

Quando endpoint financeiro nao responde:
- sistema tenta fallback de base local (snapshot em /banco)
- modulo Rfaturada registra syncError no backup local e mantem leitura local

Arquivos de backup financeiro relevantes:
- public/banco/backup/NFpg/nfpg-cache.json
- public/banco/backup/NFpg/sync-state.json
- public/banco/backup/Rfaturada/rfaturada-cache.json
- public/banco/backup/Rfaturada/sync-state.json

## 7. Mapa rapido: campo -> onde e preenchido

- kpis.* (financeiro): src/bancoData.ts, funcao buildDashboardDataFromSnapshot
- financeResults: src/bancoData.ts, funcao buildFinanceResults
- fluxoCaixaDetalhado: src/bancoData.ts, funcao buildFluxoCaixaDetalhado
- indicadoresFinanceiros: src/bancoData.ts, funcao buildIndicadoresFinanceiros
- ultimasMovimentacoes: src/bancoData.ts, funcao buildUltimasMovimentacoes
- fluxoCaixaMensal exibido na aba Financeiro: src/App.tsx (mapeamento de buildFinanceiroMensal)

## 8. Observacao para apresentacao

Para a equipe, a mensagem principal e:
- Os cards e graficos financeiros sao derivados de uma unica cadeia de dados do Sienge.
- O sistema usa leitura local por filtro e sincronizacao incremental para estabilidade.
- As formulas de receita, custo, margem e fluxo estao centralizadas no backend de transformacao (bancoData.ts), garantindo consistencia da tela.
