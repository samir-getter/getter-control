# Auditoria de uso — Getter Control

Data: 28 de outubro de 2026, America/Manaus (UTC−04:00). Fase 1, sem desenho ou alteração da aplicação. Base de código: `208d05cb6a00d7a76312f066d29e3a4ed77e81b6`. Inventário autoritativo: `route-map.json`, produzido pela auditoria de rotas.

## Resultado

**Não existe uma amostra acessível e classificada de uso humano que permita medir ou ordenar páginas por popularidade.** Visitas, duração, rage clicks, dead clicks e participação telefone/desktop estão não observáveis para todas as páginas inventariadas. Isso não significa zero visitas, zero problemas ou zero uso em telefone. Um ranking real de páginas permanece pendente; a seleção de mockups deve ser rotulada como prioridade operacional provisória.

O aplicativo local não estava escutando em 3120, nem o PostgreSQL em 54349. A configuração persistente tem telemetry.enabled=false. A exportação datada de 28/10 contém zero empresas; não contém sessões humanas ou eventos de navegação capazes de satisfazer a auditoria. O catálogo global e o histórico de QA são evidência de conteúdo e verificação técnica, não de adoção do produto.

## Fontes procuradas e o que elas realmente medem

| Fonte | Evidência, janela ou referência | O que permite concluir | O que não permite concluir |
| --- | --- | --- | --- |
| Configuração local | `.getter-control/instances/gettercontrol/config.json:48`: telemetry.enabled=false | Emissão first-party desativada nessa configuração | Não demonstra ausência histórica de usuários nem estado de outra instância |
| Telemetria first-party | `server/src/telemetry.ts:12` retorna null se enabled=false; `packages/shared/src/telemetry/generated/paperclip-telemetry.ts:105` enumera15 eventos de instalação/empresa/agente/task/routine/skill/interaction/error | Contrato de eventos de negócio e execução | O contrato atual não inclui page_view, dwell, rage/dead clicks ou device share; habilitar esses eventos existentes não produz a auditoria solicitada |
| Analytics externos | `packages/shared/src/app-definitions/posthog.json:3`, `:28`; `packages/shared/src/app-definitions.generated.ts:14`; `ui/src/pages/apps/app-detail/SetupPanel.tsx:53` | PostHog é um conector disponível no catálogo | Não prova conector instalado, acesso a projeto, app instrumentado nem exportação PostHog disponível. Não foi encontrada instrumentação de navegação GA/PostHog no código da UI inspecionado |
| HTTP local | `server/src/middleware/logger.ts:147` monta mensagens método/path/status; `server/src/middleware/http-log-policy.ts:3` silencia GET/HEAD de health, dashboard, activity, issues, live-runs e outros; `:30` silencia /index.html e / | Logs de diagnóstico e algumas requisições HTTP | Pedidos API, polling, assets, sessão e QA não equivalem a visitas. Silence/polling impedem tratar contagem de requests como frequência de páginas. Duração HTTP não é duração na página |
| Logs de execução dos agentes / observabilidade | `packages/shared/src/telemetry/README.md`, seção Other Data Paths; heartbeat_run_events e traces têm contratos separados | Operação de agentes e backend, caso a fonte esteja acessível | Não são sessões humanas de interface, rage/dead clicks ou share de dispositivos |
| Backup SQL existente | `paperclip-20261028-041427.sql.gz`, criado08:14:27.309Z, completo ao COMMIT; tabela companies sem dados exportados; detalhes em `3-numbers-audit.md` | Estado empresarial vazio na exportação datada | Não é medição de uso; zero empresas não implica zero visitas ao onboarding ou zero usuários |
| Contexto e automação desta sessão | Provas/logs locais de verificação Hallmark e navegador do agente | Tráfego conhecido de testes/provas técnicas | Não classifica pessoas, dispositivos ou popularidade de telas |

Não foram lidas credenciais, payloads privados de clientes, prompts, tabelas de autenticação ou configurações de conexão. Nenhuma integração, banco ou servidor foi iniciado para produzir números.

## Separação do tráfego de QA

A inspeção extraiu apenas método, caminho sanitizado, status e horário reconhecível de duas saídas locais existentes. Foram encontrados **15 registros HTTP reconhecidos**, em arquivos com180 linhas no conjunto. Este número é uma contagem do parser, não todas as requisições, visitas ou sessões. Não possui amostra humana verificada.

| Arquivo local | Horários reconhecidos, Manaus | Registros reconhecidos | Classe e limite |
| --- | --- | --- | --- |
| `D:/Gettet/tools/getter-control-runtime/getter-control-running.log` | 00:33:34–01:07:55; mtime28/10 01:07:55 |14 em108 linhas | Sessão de desenvolvimento/QA anterior; diagnóstico incompleto, sem session/page lifecycle |
| `D:/Gettet/tools/getter-control-runtime/getter-control-running-hallmark.log` |01:15:34; mtime28/10 04:14:32 |1 em62 linhas | Verificação técnica Hallmark; outras linhas são operação/diagnóstico, não navegação medida |

Caminhos reconhecidos, todos GET: /skills/catalog2, /get-session3, /fonts/InterVariable.woff2 2, /getter-control.svg2, /instance/settings/experimental2, /onboarding1, /adapters1, /agent-avatars/cap-v1/muted-dream/sleepy.png1 e /node_modules/.vite/deps/react-i18next.js1 (504). Os demais registros reconhecidos foram200. O caminho mostrado pelo logger pode ser relativo ao router montado. A única requisição /onboarding não pode ser atribuída a uma pessoa nem convertida em visita humana. Fontes/API/assets não entraram na tabela de visitas.

**Janela de uso humano auditável: indisponível.** As janelas de QA acima são apenas proveniência dos arquivos; não fornecem um intervalo contínuo de captura. Bots, agentes e sistema não foram agrupados como humanos. Não foram inferidos rage clicks a partir de falhas504 nem dead clicks a partir de pedidos sem resposta.

## Métricas por padrão de rota

O inventário tem250 registros, sendo175 no board e75 globais, com234 padrões de caminho únicos. Há129 registros do tipo page; variantes condicionais, redirects, aliases, labs, rotas públicas e plugins impedem usar esse número como quantidade de páginas únicas visitadas. A tabela abaixo cobre **todos os234 padrões**; registros com a mesma fullPath foram unidos, preservando IDs/tipos no inventário original. Para páginas reais, todas as cinco medidas solicitadas e o ranking são U.

Legenda: **U = desconhecido/não observável**, nunca0. **N/A = redirect/compatibilidade/controle sem uma página própria visitável**; deve herdar o destino somente depois de deduplicar navegação em analytics. Misturas de registros page/redirect permanecem U. O share telefone/desktop seria uma proporção de visitas humanas classificada por viewport/dispositivo, não pelo fato de o teste ocorrer em desktop.

| Caminho completo | Registros / tipo | Visitas humanas | Tempo/página | Rage clicks | Dead clicks | Telefone/desktop | Rank uso | Fonte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/:companyPrefix` | R001, R249; container, redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:151` |
| `/:companyPrefix/dashboard` | R002; page | U | U | U | U | U | U | `ui/src/App.tsx:152` |
| `/:companyPrefix/dashboard/live` | R003; page | U | U | U | U | U | U | `ui/src/App.tsx:153` |
| `/:companyPrefix/timeline` | R004; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:154` |
| `/:companyPrefix/onboarding` | R005; page | U | U | U | U | U | U | `ui/src/App.tsx:158` |
| `/:companyPrefix/companies` | R006; page | U | U | U | U | U | U | `ui/src/App.tsx:159` |
| `/:companyPrefix/company/settings` | R007; page | U | U | U | U | U | U | `ui/src/App.tsx:160` |
| `/:companyPrefix/company/settings/connections` | R008; page | U | U | U | U | U | U | `ui/src/App.tsx:161` |
| `/:companyPrefix/company/settings/environments` | R009; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:162` |
| `/:companyPrefix/company/settings/cloud-upstream` | R010; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:163` |
| `/:companyPrefix/company/settings/members` | R011; page | U | U | U | U | U | U | `ui/src/App.tsx:165` |
| `/:companyPrefix/company/settings/access` | R012; page | U | U | U | U | U | U | `ui/src/App.tsx:166` |
| `/:companyPrefix/company/settings/invites` | R013; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:171` |
| `/:companyPrefix/company/export/*` | R014; page | U | U | U | U | U | U | `ui/src/App.tsx:177` |
| `/:companyPrefix/company/import` | R015; page | U | U | U | U | U | U | `ui/src/App.tsx:188` |
| `/:companyPrefix/company/settings/secrets` | R016; page | U | U | U | U | U | U | `ui/src/App.tsx:192` |
| `/:companyPrefix/company/settings/tools` | R017; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:194` |
| `/:companyPrefix/company/settings/tools/:tab` | R018; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:195` |
| `/:companyPrefix/tools` | R019; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:196` |
| `/:companyPrefix/tools/:tab` | R020; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:197` |
| `/:companyPrefix/apps` | R021; page | U | U | U | U | U | U | `ui/src/App.tsx:198` |
| `/:companyPrefix/apps/assistant-connection` | R022; page | U | U | U | U | U | U | `ui/src/App.tsx:199` |
| `/:companyPrefix/apps/browse` | R023; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:200` |
| `/:companyPrefix/apps/connections` | R024; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:201` |
| `/:companyPrefix/apps/byo` | R025; page | U | U | U | U | U | U | `ui/src/App.tsx:202` |
| `/:companyPrefix/apps/vercel-connect` | R026; page | U | U | U | U | U | U | `ui/src/App.tsx:203` |
| `/:companyPrefix/apps/connect` | R027; page | U | U | U | U | U | U | `ui/src/App.tsx:207` |
| `/:companyPrefix/apps/chat/connect` | R028; page | U | U | U | U | U | U | `ui/src/App.tsx:208` |
| `/:companyPrefix/apps/chat/:endpointId` | R029; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:211` |
| `/:companyPrefix/apps/chat/:endpointId/reviews/:reviewId` | R030; page | U | U | U | U | U | U | `ui/src/App.tsx:214` |
| `/:companyPrefix/apps/chat/:endpointId/:tab` | R031; page | U | U | U | U | U | U | `ui/src/App.tsx:217` |
| `/:companyPrefix/apps/connect/:appKey` | R032; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:220` |
| `/:companyPrefix/apps/connect/:appKey/:stage` | R033; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:221` |
| `/:companyPrefix/apps/review` | R034; page | U | U | U | U | U | U | `ui/src/App.tsx:222` |
| `/:companyPrefix/apps/attention` | R035; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:224` |
| `/:companyPrefix/apps/gateways` | R036; page | U | U | U | U | U | U | `ui/src/App.tsx:225` |
| `/:companyPrefix/apps/gateways/:gatewayId` | R037; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:226` |
| `/:companyPrefix/apps/gateways/:gatewayId/:tab` | R038; page | U | U | U | U | U | U | `ui/src/App.tsx:227` |
| `/:companyPrefix/apps/advanced` | R039; page | U | U | U | U | U | U | `ui/src/App.tsx:228` |
| `/:companyPrefix/apps/advanced/gateways` | R040; page | U | U | U | U | U | U | `ui/src/App.tsx:229` |
| `/:companyPrefix/apps/advanced/profiles/new` | R041; page | U | U | U | U | U | U | `ui/src/App.tsx:230` |
| `/:companyPrefix/apps/advanced/profiles/:profileId/edit` | R042; page | U | U | U | U | U | U | `ui/src/App.tsx:231` |
| `/:companyPrefix/apps/advanced/profiles/:profileId` | R043; page | U | U | U | U | U | U | `ui/src/App.tsx:232` |
| `/:companyPrefix/apps/advanced/audit` | R044; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:233` |
| `/:companyPrefix/apps/advanced/run-your-own` | R045; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:234` |
| `/:companyPrefix/apps/advanced/:tab` | R046; page | U | U | U | U | U | U | `ui/src/App.tsx:235` |
| `/:companyPrefix/apps/app/:applicationId` | R047; page | U | U | U | U | U | U | `ui/src/App.tsx:236` |
| `/:companyPrefix/apps/app/:applicationId/:tab` | R048; page | U | U | U | U | U | U | `ui/src/App.tsx:237` |
| `/:companyPrefix/apps/:connectionId` | R049; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:238` |
| `/:companyPrefix/apps/:connectionId/:tab` | R050; page | U | U | U | U | U | U | `ui/src/App.tsx:239` |
| `/:companyPrefix/company/settings/instance` | R051; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:240` |
| `/:companyPrefix/company/settings/instance/profile` | R052; page | U | U | U | U | U | U | `ui/src/App.tsx:242` |
| `/:companyPrefix/company/settings/instance/general` | R053; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:244` |
| `/:companyPrefix/company/settings/instance/heartbeats` | R054; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:245` |
| `/:companyPrefix/company/settings/instance/environments` | R055; page | U | U | U | U | U | U | `ui/src/App.tsx:247` |
| `/:companyPrefix/company/settings/instance/environments/new` | R056; page | U | U | U | U | U | U | `ui/src/App.tsx:248` |
| `/:companyPrefix/company/settings/instance/environments/:environmentId/edit` | R057; page | U | U | U | U | U | U | `ui/src/App.tsx:249` |
| `/:companyPrefix/company/settings/instance/access` | R058; page | U | U | U | U | U | U | `ui/src/App.tsx:252` |
| `/:companyPrefix/company/settings/instance/experimental` | R059; page | U | U | U | U | U | U | `ui/src/App.tsx:255` |
| `/:companyPrefix/company/settings/instance/plugins` | R060; page | U | U | U | U | U | U | `ui/src/App.tsx:258` |
| `/:companyPrefix/company/settings/instance/plugins/:pluginId` | R061; page | U | U | U | U | U | U | `ui/src/App.tsx:259` |
| `/:companyPrefix/company/settings/instance/adapters` | R062; page | U | U | U | U | U | U | `ui/src/App.tsx:262` |
| `/:companyPrefix/company/settings/:settingsRoutePath/*` | R063; page | U | U | U | U | U | U | `ui/src/App.tsx:264` |
| `/:companyPrefix/skills/sources` | R064; page | U | U | U | U | U | U | `ui/src/App.tsx:265` |
| `/:companyPrefix/skills/sources/:sourceId` | R065; page | U | U | U | U | U | U | `ui/src/App.tsx:266` |
| `/:companyPrefix/skills/studio` | R066; page | U | U | U | U | U | U | `ui/src/App.tsx:267` |
| `/:companyPrefix/skills/studio/new` | R067; page | U | U | U | U | U | U | `ui/src/App.tsx:268` |
| `/:companyPrefix/skills/studio/:skillId` | R068; page | U | U | U | U | U | U | `ui/src/App.tsx:269` |
| `/:companyPrefix/skills/:skillId/studio` | R069; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:270` |
| `/:companyPrefix/skills/*` | R070; page | U | U | U | U | U | U | `ui/src/App.tsx:271` |
| `/:companyPrefix/settings` | R071; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:275` |
| `/:companyPrefix/settings/*` | R072; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:276` |
| `/:companyPrefix/plugins/:pluginId` | R073; page | U | U | U | U | U | U | `ui/src/App.tsx:277` |
| `/:companyPrefix/org` | R074; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:278` |
| `/:companyPrefix/agents` | R075; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:282` |
| `/:companyPrefix/agents/all` | R076; page | U | U | U | U | U | U | `ui/src/App.tsx:284` |
| `/:companyPrefix/agents/active` | R077; page | U | U | U | U | U | U | `ui/src/App.tsx:284` |
| `/:companyPrefix/agents/paused` | R078; page | U | U | U | U | U | U | `ui/src/App.tsx:284` |
| `/:companyPrefix/agents/error` | R079; page | U | U | U | U | U | U | `ui/src/App.tsx:284` |
| `/:companyPrefix/agents/builtin` | R080; page | U | U | U | U | U | U | `ui/src/App.tsx:284` |
| `/:companyPrefix/agents/new` | R081; page | U | U | U | U | U | U | `ui/src/App.tsx:290` |
| `/:companyPrefix/agents/:agentId` | R082; page | U | U | U | U | U | U | `ui/src/App.tsx:291` |
| `/:companyPrefix/agents/:agentId/:tab` | R083; page | U | U | U | U | U | U | `ui/src/App.tsx:292` |
| `/:companyPrefix/agents/:agentId/runs/:runId` | R084; page | U | U | U | U | U | U | `ui/src/App.tsx:293` |
| `/:companyPrefix/projects` | R085; page | U | U | U | U | U | U | `ui/src/App.tsx:294` |
| `/:companyPrefix/projects/:projectId` | R086; page | U | U | U | U | U | U | `ui/src/App.tsx:295` |
| `/:companyPrefix/projects/:projectId/overview` | R087; page | U | U | U | U | U | U | `ui/src/App.tsx:296` |
| `/:companyPrefix/projects/:projectId/issues` | R088; page | U | U | U | U | U | U | `ui/src/App.tsx:297` |
| `/:companyPrefix/projects/:projectId/issues/:filter` | R089; page | U | U | U | U | U | U | `ui/src/App.tsx:298` |
| `/:companyPrefix/projects/:projectId/workspaces/:workspaceId` | R090; page | U | U | U | U | U | U | `ui/src/App.tsx:300` |
| `/:companyPrefix/projects/:projectId/workspaces` | R091; page | U | U | U | U | U | U | `ui/src/App.tsx:302` |
| `/:companyPrefix/projects/:projectId/configuration` | R092; page | U | U | U | U | U | U | `ui/src/App.tsx:303` |
| `/:companyPrefix/projects/:projectId/budget` | R093; page | U | U | U | U | U | U | `ui/src/App.tsx:304` |
| `/:companyPrefix/workspaces` | R094; page | U | U | U | U | U | U | `ui/src/App.tsx:306` |
| `/:companyPrefix/issues` | R095; page | U | U | U | U | U | U | `ui/src/App.tsx:308` |
| `/:companyPrefix/tasks` | R096; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:309` |
| `/:companyPrefix/search` | R097; page | U | U | U | U | U | U | `ui/src/App.tsx:310` |
| `/:companyPrefix/issues/all` | R098, R103; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:314` |
| `/:companyPrefix/issues/active` | R099, R104; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:315` |
| `/:companyPrefix/issues/backlog` | R100, R105; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:316` |
| `/:companyPrefix/issues/done` | R101, R106; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:317` |
| `/:companyPrefix/issues/recent` | R102, R107; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:318` |
| `/:companyPrefix/chats` | R108; page | U | U | U | U | U | U | `ui/src/App.tsx:329` |
| `/:companyPrefix/chats/:agentRef` | R109; page | U | U | U | U | U | U | `ui/src/App.tsx:330` |
| `/:companyPrefix/issues/:issueId` | R110; page | U | U | U | U | U | U | `ui/src/App.tsx:331` |
| `/:companyPrefix/tests/perf/long-thread` | R111; page | U | U | U | U | U | U | `ui/src/App.tsx:333` |
| `/:companyPrefix/routines` | R112; page | U | U | U | U | U | U | `ui/src/App.tsx:335` |
| `/:companyPrefix/cases` | R113; page | U | U | U | U | U | U | `ui/src/App.tsx:336` |
| `/:companyPrefix/cases/:caseIdentifier` | R114; page | U | U | U | U | U | U | `ui/src/App.tsx:340` |
| `/:companyPrefix/status` | R115; page | U | U | U | U | U | U | `ui/src/App.tsx:344` |
| `/:companyPrefix/status/:cardId` | R116; page | U | U | U | U | U | U | `ui/src/App.tsx:348` |
| `/:companyPrefix/status-cards` | R117; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:353` |
| `/:companyPrefix/status-cards/:cardId` | R118; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:354` |
| `/:companyPrefix/routines/:routineId` | R119; page | U | U | U | U | U | U | `ui/src/App.tsx:355` |
| `/:companyPrefix/routines/:routineId/:section` | R120; page | U | U | U | U | U | U | `ui/src/App.tsx:356` |
| `/:companyPrefix/execution-workspaces/:workspaceId` | R121; page | U | U | U | U | U | U | `ui/src/App.tsx:359` |
| `/:companyPrefix/execution-workspaces/:workspaceId/services` | R122; page | U | U | U | U | U | U | `ui/src/App.tsx:360` |
| `/:companyPrefix/execution-workspaces/:workspaceId/configuration` | R123; page | U | U | U | U | U | U | `ui/src/App.tsx:361` |
| `/:companyPrefix/execution-workspaces/:workspaceId/runtime-logs` | R124; page | U | U | U | U | U | U | `ui/src/App.tsx:362` |
| `/:companyPrefix/execution-workspaces/:workspaceId/issues` | R125; page | U | U | U | U | U | U | `ui/src/App.tsx:363` |
| `/:companyPrefix/execution-workspaces/:workspaceId/routines` | R126; page | U | U | U | U | U | U | `ui/src/App.tsx:364` |
| `/:companyPrefix/goals` | R127; page | U | U | U | U | U | U | `ui/src/App.tsx:367` |
| `/:companyPrefix/goals/:goalId` | R128; page | U | U | U | U | U | U | `ui/src/App.tsx:368` |
| `/:companyPrefix/artifacts` | R129, R152; page | U | U | U | U | U | U | `ui/src/App.tsx:369` |
| `/:companyPrefix/approvals` | R130; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:370` |
| `/:companyPrefix/approvals/pending` | R131; page | U | U | U | U | U | U | `ui/src/App.tsx:371` |
| `/:companyPrefix/approvals/all` | R132; page | U | U | U | U | U | U | `ui/src/App.tsx:372` |
| `/:companyPrefix/approvals/:approvalId` | R133; page | U | U | U | U | U | U | `ui/src/App.tsx:373` |
| `/:companyPrefix/activity` | R134; page | U | U | U | U | U | U | `ui/src/App.tsx:374` |
| `/:companyPrefix/activity/commentary` | R135; page | U | U | U | U | U | U | `ui/src/App.tsx:375` |
| `/:companyPrefix/activity/runs` | R136; page | U | U | U | U | U | U | `ui/src/App.tsx:376` |
| `/:companyPrefix/activity/costs` | R137; page | U | U | U | U | U | U | `ui/src/App.tsx:377` |
| `/:companyPrefix/activity/budgets` | R138; page | U | U | U | U | U | U | `ui/src/App.tsx:378` |
| `/:companyPrefix/activity/timeline` | R139; page | U | U | U | U | U | U | `ui/src/App.tsx:379` |
| `/:companyPrefix/audit` | R140, R150; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:382` |
| `/:companyPrefix/audit/activity` | R141; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:383` |
| `/:companyPrefix/audit/runs` | R142; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:384` |
| `/:companyPrefix/audit/costs` | R143; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:385` |
| `/:companyPrefix/audit/budgets` | R144; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:386` |
| `/:companyPrefix/audit/timeline` | R145; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:387` |
| `/:companyPrefix/runs` | R146; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:388` |
| `/:companyPrefix/costs` | R147, R149; page, redirect-or-compatibility | U | U | U | U | U | U | `ui/src/App.tsx:389` |
| `/:companyPrefix/budgets` | R148; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:390` |
| `/:companyPrefix/board-chat` | R151; page | U | U | U | U | U | U | `ui/src/App.tsx:404` |
| `/:companyPrefix/dev/task-chat-lab` | R153; page | U | U | U | U | U | U | `ui/src/App.tsx:409` |
| `/:companyPrefix/decisions` | R154; page | U | U | U | U | U | U | `ui/src/App.tsx:411` |
| `/:companyPrefix/decisions/queues/:key` | R155; page | U | U | U | U | U | U | `ui/src/App.tsx:412` |
| `/:companyPrefix/inbox` | R156, R163; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:419` |
| `/:companyPrefix/inbox/mine` | R157, R164; page, redirect-or-compatibility | U | U | U | U | U | U | `ui/src/App.tsx:420` |
| `/:companyPrefix/inbox/recent` | R158, R165; page, redirect-or-compatibility | U | U | U | U | U | U | `ui/src/App.tsx:421` |
| `/:companyPrefix/inbox/unread` | R159, R166; page, redirect-or-compatibility | U | U | U | U | U | U | `ui/src/App.tsx:422` |
| `/:companyPrefix/inbox/blocked` | R160, R167; page, redirect-or-compatibility | U | U | U | U | U | U | `ui/src/App.tsx:423` |
| `/:companyPrefix/inbox/all` | R161, R168; page, redirect-or-compatibility | U | U | U | U | U | U | `ui/src/App.tsx:424` |
| `/:companyPrefix/inbox/new` | R162, R169; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:425` |
| `/:companyPrefix/inbox/requests` | R170; page | U | U | U | U | U | U | `ui/src/App.tsx:438` |
| `/:companyPrefix/u/:userSlug` | R171; page | U | U | U | U | U | U | `ui/src/App.tsx:439` |
| `/:companyPrefix/design-guide` | R172; page | U | U | U | U | U | U | `ui/src/App.tsx:440` |
| `/:companyPrefix/instance/settings/adapters` | R173; page | U | U | U | U | U | U | `ui/src/App.tsx:441` |
| `/:companyPrefix/:pluginRoutePath/*` | R174; page | U | U | U | U | U | U | `ui/src/App.tsx:442` |
| `/:companyPrefix/*` | R175; fallback | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:443` |
| `/oauth-handoff` | R176; page | U | U | U | U | U | U | `ui/src/App.tsx:777` |
| `/auth` | R177; page | U | U | U | U | U | U | `ui/src/App.tsx:778` |
| `/board-claim/:token` | R178; page | U | U | U | U | U | U | `ui/src/App.tsx:779` |
| `/mcp-connect/:id` | R179; page | U | U | U | U | U | U | `ui/src/App.tsx:780` |
| `/dot-connect/:id` | R180; page | U | U | U | U | U | U | `ui/src/App.tsx:781` |
| `/mcp-device` | R181; page | U | U | U | U | U | U | `ui/src/App.tsx:782` |
| `/assistant-connections` | R182; page | U | U | U | U | U | U | `ui/src/App.tsx:783` |
| `/cli-auth/:id` | R183; page | U | U | U | U | U | U | `ui/src/App.tsx:784` |
| `/invite/:token` | R184; page | U | U | U | U | U | U | `ui/src/App.tsx:785` |
| `/chat-identity/confirm` | R185; page | U | U | U | U | U | U | `ui/src/App.tsx:790` |
| `/tests/perf/long-thread` | R186; page | U | U | U | U | U | U | `ui/src/App.tsx:793` |
| `/ux-lab/bootstrap-setup` | R187; page | U | U | U | U | U | U | `ui/src/App.tsx:794` |
| `/ux-lab/responsible-user-denial` | R188; page | U | U | U | U | U | U | `ui/src/App.tsx:795` |
| `/ux-lab/cross-issue-collaboration` | R189; page | U | U | U | U | U | U | `ui/src/App.tsx:796` |
| `/` | R190; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:800` |
| `/onboarding` | R191; page | U | U | U | U | U | U | `ui/src/App.tsx:801` |
| `/instance` | R192; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:802` |
| `/instance/settings` | R193; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:803` |
| `/instance/settings/*` | R194; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:804` |
| `/companies` | R195; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:805` |
| `/issues` | R196; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:806` |
| `/tasks` | R197; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:807` |
| `/issues/:issueId` | R198; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:808` |
| `/routines` | R199; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:809` |
| `/routines/:routineId` | R200; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:810` |
| `/cases` | R201; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:811` |
| `/cases/:caseIdentifier` | R202; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:812` |
| `/status` | R203; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:813` |
| `/status/:cardId` | R204; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:814` |
| `/status-cards` | R205; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:815` |
| `/status-cards/:cardId` | R206; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:816` |
| `/artifacts` | R207; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:817` |
| `/audit` | R208; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:818` |
| `/audit/*` | R209; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:821` |
| `/activity` | R210; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:822` |
| `/activity/*` | R211; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:823` |
| `/runs` | R212; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:824` |
| `/costs` | R213; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:825` |
| `/budgets` | R214; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:826` |
| `/decisions` | R215; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:829` |
| `/u/:userSlug` | R216; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:830` |
| `/skills/studio` | R217; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:831` |
| `/skills/studio/new` | R218; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:832` |
| `/skills/studio/:skillId` | R219; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:833` |
| `/skills/:skillId/studio` | R220; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:834` |
| `/skills/*` | R221; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:835` |
| `/settings` | R222; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:836` |
| `/settings/*` | R223; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:837` |
| `/agents` | R224; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:838` |
| `/agents/all` | R225; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:840` |
| `/agents/active` | R226; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:840` |
| `/agents/paused` | R227; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:840` |
| `/agents/error` | R228; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:840` |
| `/agents/builtin` | R229; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:840` |
| `/agents/new` | R230; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:842` |
| `/agents/:agentId` | R231; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:843` |
| `/agents/:agentId/:tab` | R232; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:844` |
| `/agents/:agentId/runs/:runId` | R233; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:845` |
| `/projects` | R234; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:846` |
| `/projects/:projectId` | R235; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:847` |
| `/projects/:projectId/overview` | R236; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:848` |
| `/projects/:projectId/issues` | R237; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:849` |
| `/projects/:projectId/issues/:filter` | R238; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:850` |
| `/projects/:projectId/workspaces` | R239; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:851` |
| `/projects/:projectId/workspaces/:workspaceId` | R240; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:852` |
| `/projects/:projectId/configuration` | R241; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:853` |
| `/workspaces` | R242; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:854` |
| `/execution-workspaces/:workspaceId` | R243; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:855` |
| `/execution-workspaces/:workspaceId/services` | R244; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:856` |
| `/execution-workspaces/:workspaceId/configuration` | R245; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:857` |
| `/execution-workspaces/:workspaceId/runtime-logs` | R246; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:858` |
| `/execution-workspaces/:workspaceId/issues` | R247; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:859` |
| `/execution-workspaces/:workspaceId/routines` | R248; redirect-or-compatibility | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:860` |
| `/*` | R250; fallback | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | N/A/U destino | U | `ui/src/App.tsx:864` |

## Prioridade provisória para mockups, sem ranking inventado

Enquanto não existe analytics confiável, a seleção abaixo representa relevância operacional e o conteúdo que pode ser mostrado com evidência. Não determina ainda o que mover para More nem autoriza remover páginas.

| Ordem provisória | Superfície | Motivo verificável | Dados disponíveis para comparação visual |
| --- | --- | --- | --- |
|1 | Onboarding / criar primeira empresa | Exportação persistente sem empresas; primeira ação necessária | Estado vazio real datado, catálogo existente, sem criar empresa para preencher a tela |
|2 | Dashboard | Resume agentes/tarefas/decisões/custos e próxima ação | Layout de estado sem empresa/indisponível; contratos de números em3-numbers-audit, sem KPIs falsos |
|3 | Tasks / issues | Unidade central de trabalho e revisão | Estado sem empresa e ações apresentadas como proposta; não inventar tarefas Jabil |
|4 | Agents | Pessoas precisam saber quem executa e qual agente requer atenção | Catálogo/estado vazio sem confundir disponibilidade com agente rodando |
|5 | Agent detail | Diagnóstico, próximo passo e operação com possíveis efeitos | Sem agente selecionado e detalhe indisponível; nenhum nome/spend/atividade empresarial inventado |
|6 | Skills / catálogo | Conteúdo efetivamente distribuído e já verificado |18 skills do manifesto:11 bundled,7 opcionais |
|7 | Skill detail / Hallmark | Primeiro skill explicitamente pedido pelo usuário | Hallmark2.0.0,165 arquivos, origem/pin/hash reais |
|8 | Routines ou approvals | Recorrência e revisão são prioridades do pedido original | Estado não configurado e fluxo de revisão proposto, sem executar rotina/decisão |

A ordem acima é reavaliável com dados humanos. As demais rotas permanecem no inventário e recebem uma casa na fase de IA; nenhuma é apagada por estar sem medição.

## Como fechar a auditoria real de uso

1. Confirmar uma instância/empresa e janela de análise reais com analytics exportável. Ler PostHog/GA se já houver instrumentação e acesso autorizado; não instalar/configurar providers para simular histórico.
2. Obter pageviews e sessões com tipo de ator, timestamp, rota normalizada, tenant e classificação telefone/desktop. Excluir QA, bots, agentes e polling por proveniência, não apenas user-agent. Deduplicar aliases, redirects e re-renders sem apagar a rota original do mapa.
3. Medir dwell com visibilidade/idle/saida ou eventos de sessão reais, distinguindo páginas abertas em background. Definir numerador/denominador e duração de sessão. Timestamp de um GET não demonstra permanência.
4. Medir rage/dead clicks por eventos reais e definição do analytics: sequência de cliques no mesmo alvo, janela temporal e ausência de ação/resposta. Apresentar amostra e taxas; não inferir do número de requests ou HTTP erros.
5. Publicar por página a janela, visitas, dwell mediano/distribuição, contadores/taxas de rage/dead e share telefone/desktop. Manter unknown para dados ausentes; separar humano/teste/sistema e destacar cobertura.
6. Ordenar páginas por uso e necessidade operacional com evidência. Só então definir prioridade definitiva, More e trabalho profundo por área. Baseline/snapshot deve excluir qualquer dado pessoal ou secreto não necessário.

A ausência de analytics acessível não bloqueia mockups da fase2 com estados verdadeiros, mas impede afirmar que as telas escolhidas são as mais usadas. A fase2 termina na aprovação humana solicitada; não implementa a aplicação.
