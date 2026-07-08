# README Compras

## 1. Objetivo do modulo Compras

A aba Compras consolida desempenho de aquisicoes, distribuicao por categoria/status, fornecedores e pedidos em aberto.

## 2. Onde aparece no sistema

- Renderizacao em src/App.tsx (bloco activeTab === 'compras')
- Componente: src/components/PurchasingDashboard.tsx
- Dados enviados: dashboardData.compras

## 3. Estrutura de dados do modulo

Tipo principal em src/types.ts:
- ComprasData

Campos:
- kpis
- comprasCategoria
- comprasStatus
- topFornecedores
- pedidosEmAberto
- comprasEtapa

## 4. Onde cada campo e preenchido

Preenchimento central:
- src/bancoData.ts
- buildDashboardDataFromSnapshot(snapshot, filters)
- buildComprasKpisReais(orders, ordersInPeriod, monthKey)

### 4.1 KPIs de Compras

Campos:
- totalCompradoMes
- totalCompradoAcumulado
- economiaObtidaAcumulada
- percentualEconomia
- pedidosEmAberto
- atrasosEntrega
- comprasEmergenciais

Fonte e calculo:
- buildComprasKpisReais usa lista de pedidos filtrados
- soma de amount/totalAmount
- contagem por status, atraso e prioridade

### 4.2 Compras por Categoria

Campos:
- name
- value
- percentage

Fonte:
- groupBy categoria dos pedidos

### 4.3 Compras por Status

Campos:
- name
- value
- percentage

Fonte:
- groupBy status dos pedidos

### 4.4 Top Fornecedores

Campos:
- fornecedor
- comprado
- participacao
- economia
- economiaPercentual

Fonte:
- agregacao por supplierName/vendor

### 4.5 Pedidos em Aberto

Campos:
- pedido
- data
- fornecedor
- categoria
- valor
- prevEntrega
- status

Fonte:
- subconjunto de pedidos nao entregues no periodo

### 4.6 Compras por Etapa

Campos:
- etapa
- previsto
- comprado
- executado
- desvio
- desvioPercentual

Fonte:
- consolidacao por etapa/centro de custo com comparativo previsto x comprado

## 5. Regras e formulas

### 5.1 Total comprado no mes

- Soma de valor dos pedidos com data no mes selecionado.

### 5.2 Total comprado acumulado

- Soma de valor de pedidos no range filtrado.

### 5.3 Economia acumulada

- Soma de (orcado - comprado) quando positivo.

### 5.4 Percentual de economia

- (economiaAcumulada / totalOrcado) * 100

### 5.5 Atrasos de entrega

- Conta pedidos com entrega vencida e nao concluida, ou flag deliveryLate.

### 5.6 Compras emergenciais

- Conta pedidos com prioridade alta/urgente.

## 6. Relacao com abas

- A aba Suprimentos usa blocos parecidos, mas com foco operacional.
- A aba Financeiro reaproveita o total comprado para custo real e margem.

## 7. Mapa rapido: campo -> origem

- KPIs compras: src/bancoData.ts -> buildComprasKpisReais
- Listas/tabelas compras: src/bancoData.ts -> buildDashboardDataFromSnapshot
- Exibicao: src/components/PurchasingDashboard.tsx
- Orquestracao de aba: src/App.tsx
