# Banco Sienge

Esta pasta recebe os datasets brutos sincronizados do Sienge.

Arquivos esperados:

- clientes.json
- empresas.json
- obras.json
- compras.json
- insumos.json
- financeiro.json
- usuarios.json
- manifest.json

Comando de sincronização:

```powershell
$env:SIENGE_SUBDOMAIN="seu-subdominio"
$env:SIENGE_API_USER="seu-usuario-api"
$env:SIENGE_API_PASSWORD="seu-token-ou-senha"
npm run sync:sienge
```

Observações:

- `insumos.json` é derivado dos itens encontrados em pedidos de compra para manter apenas produtos comprados.
- `public/banco` recebe uma cópia dos mesmos arquivos para consumo no frontend quando a aplicação passar a carregar snapshots reais.
- Se o subdomínio estiver incorreto, a API do Sienge responde com `404`.