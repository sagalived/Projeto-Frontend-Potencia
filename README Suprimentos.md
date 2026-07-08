# README Suprimentos

## 1. Objetivo do modulo Suprimentos

A aba Suprimentos acompanha o abastecimento da obra, status de pedidos, fornecedores e risco de falta de material.

## 2. Onde aparece no sistema

- Renderizacao em src/App.tsx (bloco activeTab === 'suprimentos')
- Componente visual principal: src/components/PurchasingDashboard.tsx
- Dados entregues para essa tela: dashboardData.suprimentos

## 3. Estrutura de dados do modulo

Tipo principal em src/types.ts:
- SuprimentosData

Campos principais:
- kpis
- comprasCategoria
- comprasStatus
- topFornecedores
- pedidosEmAberto
- comprasEtapa
- itensCriticos
- alertas

## 4. Onde cada campo e preenchido

Preenchimento central:
- src/bancoData.ts
- funcao buildSuprimentosData(snapshot, filters)

### 4.1 kpis

Calculado em buildSuprimentosData com base em pedidos filtrados:
- totalCompradoMes
- totalCompradoAcumulado
- economiaObtidaAcumulada
- percentualEconomia
- pedidosEmAberto
- atrasosEntrega
- comprasEmergenciais

Regras:
- totalCompradoMes = soma de pedidos do mes filtrado
- totalCompradoAcumulado = soma total no periodo
- economia = valorOrcado - valorComprado (quando positivo)
- percentualEconomia = economia / valorOrcado
- pedidosEmAberto = status != delivered
- atrasosEntrega = deliveryLate
- comprasEmergenciais = priority == high

### 4.2 comprasCategoria

Fonte:
- agrupamento de pedidos por categoria

Campos:
- name
- value
- percentage

### 4.3 comprasStatus

Fonte:
- agrupamento de pedidos por status

Campos:
- name
- value
- percentage

### 4.4 topFornecedores

Fonte:
- agregacao por fornecedor

Campos:
- fornecedor
- comprado
- participacao
- economia
- economiaPercentual

### 4.5 pedidosEmAberto

Fonte:
- pedidos filtrados com status nao entregue

Campos:
- pedido
- data
- fornecedor
- categoria
- valor
- prevEntrega
- status

### 4.6 comprasEtapa

Fonte:
- distribuicao de compras por etapa da obra

Campos:
- etapa
- previsto
- comprado
- executado
- desvio
- desvioPercentual

### 4.7 itensCriticos

Fonte:
- materiais com risco de ruptura/baixo estoque

Campos:
- item
- estoque
- minimo
- status

### 4.8 alertas

Fonte:
- regras de risco sobre atrasos, alta urgencia e itens criticos

Campos:
- id
- text
- severity

## 5. Regras de negocio relevantes

- O periodo (inicio/fim) filtra os pedidos usados nos calculos.
- A selecao de obra filtra pedidos por enterpriseId/project.
- Se faltar base real suficiente, ha fallback para mock (src/data.ts) para nao quebrar a tela.

## 6. Integração com Financeiro e Compras

- O total comprado alimenta tambem KPIs financeiros (custo real).
- A qualidade do preenchimento em Suprimentos impacta indicadores de desvio orcamentario.

## 7. Mapa rapido: campo -> origem

- dashboardData.suprimentos: src/bancoData.ts -> buildSuprimentosData
- fallback de listas e estruturas: src/data.ts -> getDashboardData
- exibicao dos blocos: src/components/PurchasingDashboard.tsx
