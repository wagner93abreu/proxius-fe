# SharePoint Embedded no front-end React

Guia de implementação e operação da área de arquivos do cliente (SharePoint Embedded, SPE) no front-end `rh-sem-complicacoes` (CRA + TypeScript + MUI + axios). A configuração Microsoft/backend está em `docs/sharepoint-embedded-setup.md` do repositório `rhsemcomplicacoesAPI`.

## 1. Arquitetura

```
React (localhost:3000 / rhintegrado.com.br)
   │  JWT da API (localStorage.authToken)
   ▼
API Spring (localhost:8080 / api.rhintegrado.com.br)  /sharepoint/clifor/{cliforId}/files/**
   │  token app-only (client credentials) — nunca exposto ao navegador
   ▼
Microsoft Graph → SharePoint Embedded (1 container por Clifor)
```

Regras fundamentais:

- O navegador **nunca** fala com o Graph nem recebe tokens Microsoft. Toda operação passa pela API, que valida o JWT e o acesso ao `Clifor`.
- Não use MSAL no front-end: não há login Microsoft para o cliente. Os clientes usam contas externas (Gmail/Hotmail), por isso a edição usa links `anonymous` com expiração curta gerados sob demanda.
- O container é criado automaticamente no primeiro acesso (listagem/upload). A primeira chamada de um cliente novo pode levar alguns segundos.

## 2. Arquivos no front-end

| Arquivo | Responsabilidade |
| --- | --- |
| `src/types/ISharePointFile.ts` | Tipos do contrato (`ISharePointFile`, `IShareLink`, `ISharePointPreview`, `ISharePointCapabilities`) |
| `src/http/sharepoint.ts` | Chamadas HTTP, feature flag `isSharePointEnabled()`, download por blob, parser de `Content-Disposition`, mensagens de erro pt-BR |
| `src/hooks/useSharePointFiles.ts` | Estado da lista, capabilities, loading, erro, progresso de upload, `refresh/upload/remove` |
| `src/components/ArquivosCliente/index.tsx` | UI: navegar/criar pastas, enviar, visualizar (Dialog + iframe), editar no Office (nova aba), baixar, excluir (só staff) |
| `src/components/ArquivosCliente/CopiarModeloCliente.tsx` | Copia manual para Clifor validado, chave persistida, polling e navegacao para destino; somente ADMIN/ATENDIMENTO |
| `src/http/modelosArquivo.ts` | Contrato do catalogo e operacoes de copia, com headers de autenticacao compartilhados |
| `src/pages/GestaoModelosArquivo/index.tsx` | CRUD administrativo do catalogo, pastas SharePoint reais e envio de originais editaveis |
| `src/components/ArquivosCliente/ArquivosCliente.test.tsx` | Testes RTL do componente |
| `src/components/PastasCliente/index.tsx` | Mantém os botões da seção Arquivos; com as flags ativas, abre `ArquivosCliente` e `BibliotecaCliente` em modais independentes, montados somente ao abrir |
| `src/components/AtalhosAreaCliente/index.tsx` | Modal "Pastas" no mobile; sempre permite acessar a biblioteca padrão, mesmo sem `linkDrive` |
| `src/pages/AreaCliente` / `src/pages/AreaClienteAtendente` | Passam `cliforId` e `sharePointEmbeddedEnabled` da API (cliente: filtro por usuario; atendente: detalhe com fallback do ID da rota) |
| `package.json` → `jest.moduleNameMapper` | Mapeia `axios` para o build CJS (axios 1.x é ESM e o Jest do CRA não o transforma) |

### Apresentação da gestão de bibliotecas

A gestão administrativa em `/painelDeControle/bibliotecas` utiliza o tema claro
(bege, superfícies brancas e vinho) da Área do Cliente, login e checkout.
O tema MUI é local à página e também se aplica aos diálogos de publicação,
produtos, concessões e pré-visualização. O explorador recebe a apresentação
de gestão documental apenas em `mode="admin"`; a consulta do cliente e as
regras de acesso, armazenamento e publicação permanecem inalteradas.

Na Área do Cliente e na Área do Cliente Atendente, os botões
**Biblioteca RH sem Complicações** e **Arquivos Editáveis** abrem seus respectivos
conteúdos em modais com o mesmo tema claro compartilhado em `src/styles/lightTheme.ts`.
Fechar o modal desmonta o explorador; abrir novamente atualiza a listagem.
No celular, os mesmos botões continuam disponíveis no atalho **Pastas**.
Com cada integração desabilitada, seu botão preserva o link externo anterior
(biblioteca estática ou `linkDrive`). Sem `linkDrive` e sem SharePoint disponível
para o cliente, o botão de arquivos editáveis permanece desabilitado.
O cabeçalho e o rodapé dessas áreas seguem a paleta clara da gestão, sem
alterar a navegação administrativa ou a saída da conta do cliente.

Links externos da biblioteca aceitam qualquer site com URL absoluta HTTP ou
HTTPS, incluindo links de edição do Canva. O front-end exige título e URL
válida, sem credenciais na URL, e bloqueia esquemas executáveis como `javascript:`.
O acesso depende das permissões do site de destino; os links abrem em nova aba.
A API continua responsável por sua própria validação no cadastro e na edição.

## 3. Variáveis de ambiente

### Opt-in por cliente/fornecedor

No cadastro e na edição de `/cliFor`, **Usar SharePoint Embedded** controla
individualmente **Arquivos Editáveis** e **Biblioteca RH sem Complicações**.
O campo da API é `sharePointEmbeddedEnabled` (booleano); a migration backend V29
cria `sharepoint_embedded_enabled BOOLEAN NOT NULL DEFAULT FALSE`.
Todos os cadastros antigos e novos ficam desmarcados por padrão.
A grade exibe Sim/Não. Atualizações que omitem o campo preservam seu valor.

`true` só usa cada integração se sua flag global também estiver ativa:
`REACT_APP_SHAREPOINT_ENABLED` para editáveis e `REACT_APP_LIBRARY_ENABLED` para
biblioteca. `false`, campo ausente ou cadastro ainda não carregado mantém
o `linkDrive` antigo e a biblioteca estática padrão. Vale para cliente/atendente,
desktop/celular. Sem `linkDrive`, somente editáveis ficam desabilitados.
Trocar cliente limpa a opção anterior até a nova resposta chegar.

Desativar não remove containers, arquivos ou direitos de produtos nem altera
login/validade. As ações Embedded e de copiar modelo ficam ocultas nessa área.
O catálogo, gestão de bibliotecas e fluxo administrativo de cópia não mudam.
O servidor mantém as flags globais e bloqueia CLIENTE sem opt-in, mas preserva
as permissões administrativas de staff para preparar conteúdo.

| Variável | Onde | Valor |
| --- | --- | --- |
| `REACT_APP_SHAREPOINT_ENABLED` | `.env.development.local` (local, ignorado pelo git) e variáveis do build de produção | `true` ativa a área SPE; qualquer outro valor mantém o comportamento antigo (`linkDrive`) |
| `REACT_APP_LIBRARY_ENABLED` | Variáveis do build | `true` disponibiliza a biblioteca Embedded para os cadastros com opt-in |
| `REACT_APP_MODEL_CATALOG_ENABLED` | `.env` e variaveis do build | `true` habilita o catalogo completo; a area de arquivos depende tambem de `REACT_APP_SHAREPOINT_ENABLED=true` |

- Variáveis `REACT_APP_*` são embutidas **no build**. Mudar o valor exige novo `npm run build`/deploy; reiniciar o `npm start` localmente.
- Nunca coloque credenciais Microsoft (tenant, client id, secret, container type) no front-end. Veja `.env.example`.
- Backend correspondente: `SHAREPOINT_ENABLED=true`, `SHAREPOINT_LINKS_ENABLED=true`, `SHAREPOINT_LINK_SCOPE=anonymous`, `SHAREPOINT_LINK_EXPIRATION_MINUTES=60`.

## 4. Contrato da API

Base: `sharepoint/clifor/{cliforId}/files` (relativo ao `baseURL` do `src/http`). Todas as chamadas levam `Authorization: Bearer <authToken>`.

### Listar — `GET /`

```json
[
  {
    "id": "01ABCDEF...",
    "name": "Contrato.docx",
    "size": 20480,
    "webUrl": "https://....sharepoint.com/.../Doc.aspx?...",
    "contentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "lastModifiedDateTime": "2026-09-25T18:00:00Z"
  }
]
```

`webUrl` só abre para usuários do tenant Microsoft 365 — **não use no front-end**; use `preview`/`link`.

### Capabilities — `GET /capabilities`

```json
{ "linksEnabled": true, "canDelete": false, "canUpload": true, "maxFileSizeBytes": 10485760 }
```

Use para decidir o que mostrar (botão excluir, editar, limite de tamanho). A API continua validando tudo; a UI só esconde ações.

`canManageFolders` (opcional, ausente = `false`) controla renomear/excluir **pastas** (ver seção 12). É verdadeiro para staff ou para o próprio cliente com opt-in habilitado e é independente de `canDelete`, que continua sendo a permissão de staff para excluir **arquivos**.

### Upload — `POST /` (`multipart/form-data`)

- Campo obrigatório: `file`.
- **Não defina `Content-Type` manualmente**: o axios gera o `boundary` a partir do `FormData`. Definir `multipart/form-data` à mão (ou manter o `application/json` usado nas outras páginas) quebra a requisição (`400 Required part 'file' is not present` ou `415`).
- Resposta: um `ISharePointFile`. Um arquivo com o mesmo nome é substituído.

### Download — `GET /{itemId}/content`

- Use `responseType: "blob"` e leia o nome do arquivo em `Content-Disposition` (header exposto via CORS pela API).
- O header vem como `attachment; filename="=?UTF-8?Q?...?="; filename*=UTF-8''Relat%C3%B3rio.pdf`; priorize `filename*` (feito por `fileNameFromContentDisposition`).
- Não use `<a href>` direto para a URL da API: o navegador não envia o header `Authorization`.

### Visualizar — `POST /{itemId}/preview`

```json
{ "url": "https://....sharepoint.com/..._layouts/15/embed.aspx?...&nb=true" }
```

URL de curta duração, incorporável em `<iframe>`. Solicite uma nova a cada abertura.

### Link de edição/leitura — `POST /{itemId}/link?type=edit|view`

```json
{ "webUrl": "https://....sharepoint.com/:w:/g/...", "type": "edit", "scope": "anonymous", "expirationDateTime": "2026-09-25T19:00:00Z" }
```

Para `type=edit` a API acrescenta `action=edit` ao link, então o Word/Excel/PowerPoint online abre **direto no modo de edição** (sem login para links `anonymous`). Abra em **nova aba**. Não armazene o link; gere um novo a cada clique.

Na UI, clicar no **nome** de um arquivo Office (docx, xlsx, pptx...) abre o editor online; nos demais formatos abre a visualização.

### Excluir — `DELETE /{itemId}` → `204`

Somente staff. O item vai para a lixeira do container.

## 5. Regras de acesso

| Papel | Listar/enviar/baixar/visualizar/editar | Excluir | Outros Clifor |
| --- | --- | --- | --- |
| CLIENTE | Somente o próprio `Clifor` com opt-in individual | Não (`403`) | `403` |
| ADMIN, ATENDIMENTO, COLABORADOR | Qualquer `Clifor` | Sim | Permitido |

## 6. Código de referência

Upload com progresso (já em `src/http/sharepoint.ts`):

```ts
const form = new FormData();
form.append("file", file, file.name);
await http.post(`sharepoint/clifor/${cliforId}/files`, form, {
  headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }, // sem Content-Type!
  onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded * 100) / e.total)),
});
```

Editar no Office sem ser bloqueado pelo navegador:

```ts
const tab = window.open("", "_blank");        // síncrono, dentro do clique
try {
  const link = await createLink(cliforId, itemId, "edit");
  if (tab) { tab.opener = null; tab.location.href = link.webUrl; }
  else window.location.assign(link.webUrl);
} catch (e) { tab?.close(); throw e; }
```

Uso do componente:

```tsx
<ArquivosCliente cliforId={cliforID} titulo="Arquivos Editáveis" />
```

## 7. Armadilhas conhecidas

1. **Pop-up bloqueado** ao editar: `window.open` após um `await` é bloqueado. Abra a aba antes da chamada (seção 6).
2. **Office em iframe**: o modo de edição não funciona incorporado. Use iframe apenas para `preview`.
3. **`Content-Type` manual no upload** → `400`/`415`. Deixe o axios definir.
4. **Nome do arquivo no download vazio/estranho**: o `Content-Disposition` só é legível se exposto no CORS (já configurado) e deve-se decodificar `filename*`.
5. **Jest: `Cannot use import statement outside a module` (axios)** → `moduleNameMapper` no `package.json`.
6. **Flag não muda nada**: `REACT_APP_*` exige reiniciar `npm start` / novo build.
7. **`cliforId` vazio**: `AreaCliente` só conhece o Clifor após `clifor/filter`; o componente não renderiza até existir.
8. **Primeiro acesso lento**: criação + ativação do container. Não dispare chamadas em paralelo repetidas; o hook descarta respostas antigas.
9. **Links expirados**: após `SHAREPOINT_LINK_EXPIRATION_MINUTES` o link para de funcionar; clique em editar novamente.
10. **`webUrl` da listagem** abre tela de login Microsoft para clientes externos — não use.
11. **Limite de 10 MB**: validado no cliente com `maxFileSizeBytes`; o backend retorna `413` se ultrapassar.

## 8. Tabela de erros

| HTTP | Mensagem exibida | Causa comum | Ação |
| --- | --- | --- | --- |
| 400 | Requisição inválida | Sem campo `file`, multipart malformado | Verificar `FormData` |
| 401 | Sessão expirada | JWT inválido/expirado | Novo login |
| 403 | Sem permissão | Cliente acessando outro Clifor ou tentando excluir | Esperado; conferir papel |
| 404 | Não encontrado | Item removido / Clifor inexistente | Atualizar lista |
| 413 | Arquivo excede o limite | > `maxFileSizeBytes` | Reduzir arquivo |
| 415 | Formato de envio não suportado | `Content-Type` manual errado | Remover header |
| 502 | Falha ao comunicar com o SharePoint | Erro do Graph (permissões do Container Type, container inativo) | Ver logs da API e `docs/sharepoint-embedded-setup.md` |
| 503 | Serviço indisponível | Graph limitando (429) ou links desabilitados | Tentar novamente / `SHAREPOINT_LINKS_ENABLED` |
| sem resposta | Não foi possível conectar | API fora do ar ou CORS | Conferir API e origem permitida |

## 9. Segurança

- Tokens Microsoft e credenciais ficam só no backend.
- Links `anonymous` dão acesso a quem tiver a URL até expirar: gere sob demanda, mantenha expiração curta, não registre em logs/analytics, abra com `opener = null`.
- O iframe de preview usa `sandbox` e `referrerPolicy="no-referrer"`.
- A UI esconde ações conforme `capabilities`, mas a autorização real é da API.
- O JWT continua em `localStorage` (padrão atual do sistema); evite exibir conteúdo HTML de arquivos fora do iframe do SharePoint.

## 10. Checklist de testes

Automatizados: `CI=true npx react-scripts test --watchAll=false src/components/ArquivosCliente` (lista, upload, limite, 413, editar, preview, excluir só staff, parser de nome, renomear/excluir pastas com `canManageFolders`).
Renomear/excluir pastas também são cobertos em `src/pages/GestaoModelosArquivo` e `src/components/BibliotecaCliente`.

Manual (backend 8080 + `npm start` com a flag):

- [ ] Cliente: vê "Arquivos Editáveis" com a lista; sem botão excluir.
- [ ] Upload de PDF e DOCX com barra de progresso; arquivo > 10 MB bloqueado.
- [ ] Visualizar PDF/DOCX abre no diálogo.
- [ ] Editar DOCX abre o Word online em nova aba, sem login, e salva.
- [ ] Baixar mantém nome com acentos.
- [ ] Mobile: ícone "Pastas" abre o modal com a lista.
- [ ] Atendente em `/AreaClienteAtendente/{id}`: vê/excluí arquivos do cliente.
- [ ] Flag `false`: volta o botão `linkDrive` original.

## 11. Troubleshooting

| Sintoma | Verificar |
| --- | --- |
| Área não aparece | Flag no build, `cliforId` preenchido, papel `CLIENTE` na `AreaCliente` |
| Botão editar não aparece | `linksEnabled=false` no `/capabilities` → `SHAREPOINT_LINKS_ENABLED` no backend; extensão não Office |
| 502 em tudo | Grants do Container Type (`read`, `write`, ...), secret expirado; logs da API |
| 502 ao editar | Falta `addPermissions` no Container Type |
| Link pede login Microsoft | `SHAREPOINT_LINK_SCOPE=organization`; usar `anonymous` e liberar "Qualquer pessoa" no tenant |
| Erro de CORS | Origem em `SecurityConfigurations` (`http://localhost:3000`, `https://rhintegrado.com.br`) |
| Preview em branco | URL expirou (reabrir) ou bloqueio de cookies de terceiros no navegador |

## 12. Pastas de cliente e acervo de modelos

A navegação de pastas preserva o contrato raiz: os métodos `GET` e `POST`
para `sharepoint/clifor/{cliforId}/files` sem `parentId` continuam significando raiz.
Para pastas, a UI envia `parentId` como query parameter na listagem e no upload.
Cada pasta aparece com `id`, `name` e o campo `folder` (objeto do driveItem com
`childCount` opcional); uma resposta vazia significa pasta vazia. O backend
confirma que o pai e uma pasta no drive do Clifor ja autorizado antes de listar
ou enviar. As operacoes de preview, edicao, download e exclusao continuam
disponiveis para arquivos; pastas sao renomeadas/excluidas pelos endpoints de
`pastas` descritos abaixo.

### Renomear e excluir pastas (cliente, modelos e bibliotecas)

As tres superficies usam os mesmos dialogos (`src/components/FolderActions`):
botoes de icone acessiveis por pasta ("Renomear pasta X" / "Excluir pasta X"),
tambem disponiveis para a pasta aberta na trilha de navegacao.

| Superficie | Renomear (`{nome}`) | Excluir (corpo `{confirmacao: "excluir"}`) | Quem ve |
| --- | --- | --- | --- |
| Arquivos Editaveis | `PUT /sharepoint/clifor/{cliforId}/pastas/{itemId}` | `DELETE` mesmo caminho | `canManageFolders` |
| Gestao de modelos | `PUT /sharepoint/modelos/{modelId}/pastas/{itemId}` | `DELETE` mesmo caminho | ADMIN |
| Gestao de bibliotecas | `PUT /bibliotecas/{bibliotecaId}/pastas/{pastaId}` | `DELETE` mesmo caminho | ADMIN (modo admin) |

- Helpers: `renameFolder`/`deleteFolder` (`http/sharepoint.ts`),
  `renameModeloFolder`/`deleteModeloFolder` (`http/modelosArquivo.ts`),
  `renameLibraryFolder`/`deleteLibraryFolder` (`http/bibliotecas.ts`); corpos tipados
  em `types/IFolderActions.ts`. O `DELETE` envia o corpo JSON via `data` do axios.
- Renomear abre com o nome exibido (no cliente, `folderDisplayName`, sem o sufixo UUID oculto;
  no catalogo e bibliotecas, o nome completo, preservando sufixos hexadecimais legitimos)
  e envia exatamente o nome visivel digitado (com `trim`); a UI nao acrescenta
  sufixo. Conflitos de nome sao rejeitados explicitamente pela API e exibidos no dialogo.
- Excluir e recursivo: o dialogo avisa que todas as subpastas e arquivos serao
  removidos. Quando `folder.childCount` existe, e mostrado apenas como contagem
  de itens diretos. O botao so habilita com o texto exato `excluir`.
- Durante a requisicao, cancelar/fechar ficam bloqueados; erros permanecem no
  dialogo com o valor digitado. Apos sucesso a lista e recarregada; se a pasta
  excluida estiver aberta (ou for ancestral), a UI volta para o pai. Renomear a
  pasta aberta atualiza a trilha.
- Nenhuma flag global ou individual do SharePoint Embedded e alterada por esses fluxos.
- O backend valida a confirmacao literal, o pertencimento real ao drive/arvore autorizados
  e protege raizes e destinos de copias em andamento. No cliente, renomear uma copia concluida
  atualiza seu nome persistido; o dialogo da copia reconsulta o nome ao abrir.
- Bibliotecas usam pastas logicas: excluir apaga os documentos Graph planos cadastrados
  e os metadados de arquivos/links, sem apagar outras bibliotecas ou copias de clientes.
  A migracao V30 registra exclusao em andamento e tentativas por documento. Em falha
  parcial, o acesso e retirado, a pasta permanece para repetir a exclusao e o erro
  informa que a purga ainda nao foi concluida. Desativar biblioteca/retirar um item
  individual mantem a semantica anterior, sem purga fisica.

### Criacao de pastas comuns (staff e cliente)

A UI utiliza `POST /sharepoint/clifor/{cliforId}/files/folders` com `{ "name": "Nome" }`
e `parentId` opcional na query. Sem pai, cria na raiz. Este e o contrato de
integracao adotado para pastas comuns, que nao foi especificado junto ao
contrato de modelos; o backend deve disponibiliza-lo no container autorizado,
validando tambem o pai. A UI respeita `canCreateFolder` quando retornado nas
capabilities; na ausencia desse campo, usa `canUpload`. Nao vincula criacao
de pastas a `canDelete`, portanto clientes podem organizar seus arquivos.
Falhas permanecem visiveis no dialogo; uma criacao bem-sucedida atualiza a pasta.

### Catalogo administrativo

Rota: `/painelDeControle/modelos-arquivo`. Apenas ADMIN pode acessar a manutencao.
A tela segue o mesmo layout de gestao documental de `/painelDeControle/bibliotecas`
(tema claro, cabecalho e rodape claros, catalogo em cards e arquivos com trilha de navegacao):

| Operacao | Endpoint |
| --- | --- |
| Listar/criar | `GET/POST /sharepoint/modelos` |
| Editar nome/descricao | `PUT /sharepoint/modelos/{id}` |
| Desativar | `POST /sharepoint/modelos/{id}/desativar` |
| Listar pasta real | `GET /sharepoint/modelos/{id}/arquivos?parentId=...` |
| Criar pasta real | `POST /sharepoint/modelos/{id}/pastas?parentId=...` com `{nome}` |
| Enviar original | `POST /sharepoint/modelos/{id}/arquivos?parentId=...`, multipart `file` |

Originais suportados: DOCX, DOCM, XLSX, XLSM, PPTX, PPSX, ODT, ODS e ODP,
com limite de 10 MB na UI. Nao se envia PDF/imagem como original editavel.
Desativar nao remove nem altera copias entregues.

### Copia manual na area Arquivos Editaveis

ADMIN e ATENDIMENTO veem **Copiar modelo para cliente** na area normal.
Antes de apresentar o controle, a UI verifica o papel pelo endpoint de usuario
e consulta o Clifor autenticado, exigindo que o ID retornado corresponda ao
destino. CLIENTE e COLABORADOR nao recebem controles de modelos nem consultam
seu catalogo. A autorizacao definitiva de todas as operacoes permanece na API.

O usuario seleciona um modelo ativo e confirma explicitamente a copia para o
cliente exibido, sem sobrescrever arquivos existentes. A API deve criar uma
pasta independente, inclusive quando ja existir uma pasta com o mesmo nome:

- `POST /sharepoint/clifor/{cliforId}/copias-modelo`, corpo `{modeloId}`,
  header `Idempotency-Key`, resposta `202`.
- `GET /sharepoint/copias-modelo/{operationId}` retorna `id`, `estado`
  (`PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA`, `FALHOU`), `progresso` opcional
  (percentual de 0 a 100), `pastaDestinoId`, `nomePastaDestino`, `erro` opcional.

A chave, modelo e ultima operacao sao persistidos em localStorage, separados
por usuario e Clifor. A chave e salva **antes** do POST: se a resposta se perder,
**Tentar novamente com a mesma chave** repete exatamente a solicitacao anterior,
inclusive apos reabrir o modal ou recarregar a pagina. Apenas metadados do
contrato sao persistidos; nao ha tokens Microsoft ou URLs de monitoramento Graph.
O frontend consulta somente o endpoint de operacao da aplicacao.

O polling ocorre a cada 3 segundos enquanto o explorador estiver montado,
mesmo com o dialogo de copia fechado. Desmontar interrompe o polling; reabrir
Arquivos Editaveis recupera o registro e retoma a consulta. Falha de consulta
e apresentada com botao de nova tentativa, sem reenviar o POST. O estado
`FALHOU` apresenta o erro da operacao. `CONCLUIDA` disponibiliza
**Abrir pasta de destino**, que navega no proprio explorador do cliente.
**Iniciar outra copia** somente aparece apos um estado terminal e exige
confirmacao adicional para gerar uma nova chave e uma nova pasta.

`REACT_APP_MODEL_CATALOG_ENABLED=true` esta habilitado em `.env` e `.env.example`.
Configuracoes locais/variaveis do ambiente tem precedencia no CRA; qualquer
override `false` deve ser atualizado para habilitar o catalogo naquele build.
O frontend esta coberto por testes de contrato/UI; esta entrega nao executa
piloto Graph nem acessa configuracoes Microsoft ou documentos reais. O backend
correspondente deve estar implantado antes de disponibilizar o fluxo em producao.
