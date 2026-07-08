# README Obras

## 1. Objetivo do modulo Obras

A aba Obras apresenta um diretorio dos projetos ativos com status, progresso e dados principais da obra.

## 2. Onde aparece no sistema

- Renderizacao da aba em src/App.tsx (bloco activeTab === 'obras')
- Fonte de dados principal: availableProjects
- availableProjects vem de:
  - dashboardData.availableProjects (quando ha snapshot real)
  - OBRAS_DETAILS em src/data.ts (fallback/mock)

## 3. Campos exibidos na aba Obras

Cada card de obra usa:
- id
- name
- tipo
- datas.atrasoDias
- cronograma[] (para calcular progresso medio)
- cliente
- valorContratado
- gerenteObra

## 4. Onde cada campo e preenchido

### 4.1 Fluxo real (com snapshot)

Preenchimento ocorre em src/bancoData.ts:
- buildDashboardDataFromSnapshot(snapshot, filters)
- buildProjectDetails(enterprise, relatedOrders)

Mapeamento principal:
- id <- enterprise.id
- name <- enterprise.name
- cliente <- enterprise.companyName || enterprise.commercialName
- tipo <- classifyEnterpriseType(enterprise.name)
- contrato <- cnpj/companyId
- valorContratado <- totalCompradoRelacionados * 1.18
- gerenteObra <- enterprise.modifiedBy || enterprise.createdBy
- cronograma <- derivado por etapa (CATEGORY_LABELS) com base em deriveProgress
- datas.atrasoDias <- quantidade de pedidos com deliveryLate * 3
- custosEtapa <- calculado por pesos e progresso

### 4.2 Fluxo fallback (mock)

Preenchimento em src/data.ts:
- objeto OBRAS_DETAILS com dados estaticos por obra

## 5. Regras de calculo relevantes

### 5.1 Progresso do card

No componente da aba Obras (src/App.tsx):
- progresso = media de cronograma[].concluido

### 5.2 Selo de status

No componente da aba Obras (src/App.tsx):
- Se datas.atrasoDias > 0 -> Atenção
- Senao -> No Prazo

### 5.3 Tipo da obra

Em src/bancoData.ts:
- classifyEnterpriseType(name) classifica como Obra Publica, Obra Privada ou Operacao Interna.

## 6. Acao de navegacao para 5D

Botao no card:
- Ver Detalhes & Engenharia 5D

Efeito:
- chama handleViewProject5D(project.name) em src/App.tsx
- atualiza filtros
- muda para activeTab = '5d_obra'

## 7. Mapa rapido: campo -> origem

- name, cliente, tipo, gerenteObra, valorContratado: src/bancoData.ts -> buildProjectDetails
- cronograma e atrasoDias: src/bancoData.ts -> buildProjectDetails
- fallback completo das obras: src/data.ts -> OBRAS_DETAILS
- exibicao dos cards: src/App.tsx (aba obras)
