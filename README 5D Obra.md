# README 5D Obra

## 1. Objetivo do modulo 5D

A aba 5D apresenta a obra em cinco dimensoes:
- 1D Escopo
- 2D Planta
- 3D Modelo
- 4D Tempo
- 5D Custos

## 2. Onde aparece no sistema

- Componente: src/components/Project5DPanel.tsx
- Renderizado em:
  - src/App.tsx (aba activeTab === '5d_obra')
  - src/components/GeneralDashboard.tsx (painel embutido)

## 3. Contrato de dados

O componente recebe um objeto Project5DDetails (src/types.ts):
- id, name, cliente, tipo, contrato
- valorContratado, prazoContratual, gerenteObra
- descricaoEscopo
- quantitativos[]
- cronograma[]
- datas { terminoPrevisto, terminoReprogramado, atrasoDias }
- custosEtapa[]

## 4. Onde cada campo e preenchido

### 4.1 Fluxo real

Em src/bancoData.ts, funcao buildProjectDetails(enterprise, relatedOrders):
- valorContratado = totalCompradoRelacionados * 1.18
- cronograma por etapa com base em deriveProgress
- atrasoDias = pedidos com deliveryLate * 3
- custosEtapa por peso de etapa e fator de realizado
- descricaoEscopo = enterpriseObservation/adress/fallback
- gerenteObra = modifiedBy/createdBy

### 4.2 Fluxo fallback

Em src/data.ts:
- OBRAS_DETAILS possui valores estaticos completos para todas as propriedades de Project5DDetails.

## 5. Regras de cada sub-aba

### 5.1 1D Escopo

Campos usados:
- descricaoEscopo
- quantitativos[]

Origem:
- buildProjectDetails (real) ou OBRAS_DETAILS (fallback)

### 5.2 2D Planta

Campo visual:
- VISUAL_ASSETS.planta

Origem:
- src/data.ts (import de imagem local)

### 5.3 3D Modelo

Campo visual:
- VISUAL_ASSETS.modelo3d

Origem:
- src/data.ts (import de imagem local)

### 5.4 4D Tempo

Campos usados:
- cronograma[].etapa
- cronograma[].concluido
- cronograma[].color
- datas.terminoPrevisto
- datas.terminoReprogramado
- datas.atrasoDias

Regras:
- Barra por etapa com percentual concluido
- Indicador de atraso: atrasoDias > 0

### 5.5 5D Custos

Campos usados:
- custosEtapa[].etapa
- custosEtapa[].previsto
- custosEtapa[].realizado
- custosEtapa[].desvio
- custosEtapa[].percentualDesvio

Calculos de resumo no componente:
- totalPrevisto = soma(previsto)
- totalRealizado = soma(realizado)
- totalDesvio = totalRealizado - totalPrevisto
- percentualTotal = (totalDesvio / totalPrevisto) * 100

## 6. Mapa rapido: campo -> origem

- projectDetails inteiro: src/bancoData.ts -> buildProjectDetails
- fallback projectDetails: src/data.ts -> OBRAS_DETAILS
- imagens 2D/3D/render: src/data.ts -> VISUAL_ASSETS
- exibicao das 5 abas: src/components/Project5DPanel.tsx
