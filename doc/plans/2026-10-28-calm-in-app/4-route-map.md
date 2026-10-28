# Phase 1 — Route and action inventory, Getter Control

Data: 2026-10-28. Escopo: D:/Gettet/getter-control, fork separado Getter Control. Evidência estática; nenhuma rota, menu, teste, flag, API ou dado foi alterado. Lista estruturada completa: [route-map.json](route-map.json). Uso humano é desconhecido; não classificar estas rotas por visitas sem analytics.

## Autoridade e contagens

- Runtime real: ui/src/main.tsx importa App (linha 8) e monta <App /> (linha 94) dentro de BrowserRouter/providers. App.tsx define boardRoutes (linha 145) e App (linha 755). Não há productionApp/App.production alternativo como router principal.
- Shell streamlined é default: hooks/useStreamlinedUiEnabled.ts:7-15 aceita tudo exceto enableStreamlinedUi=false. Quando explicitamente desabilitado, App usa Layout.production e selected pages *.production. Arquivos de teste/harness/preview não decidem o runtime principal.
- boardRoutes fica dentro de /:companyPrefix. lib/router.tsx resolve Links/Navigate/useNavigate para a empresa corrente, preservando números de history Back.
- 242 nós Route com path/index, expandidos para **250 registros**: **175 board + 75 globais**, **234 padrões URL únicos**. Há **129 registros page**, que incluem variantes na mesma URL; não são 129 páginas distintas. Gating Route sem path não é contado como página, mas seus wrappers estão registrados. Container e fallbacks também estão explícitos.
- Há **1.701 callsites API em 299 arquivos não-testes** de ui/src/pages e ui/src/components. São referência de leitura/comando e não contagem de botões ou ações humanas distintas. O JSON preserva API, método, handler, arquivo/linha e IDs de rota diretamente associados. Componentes aninhados/compartilhados/legacy podem ter route IDs vazios e precisam continuar no baseline.
- A revisão não iniciou API/Postgres/app. Plugins podem adicionar nomes de páginas e ações via registry dinâmico; os catch-alls/slots são enumerados, instâncias de plugins não puderam ser consultadas.

## Acesso e variantes que não podem desaparecer

Public/auth/system: OAuth handoff, auth, board claim, invite, MCP/device/Dot/CLI pairing e assistant connections. Endpoints ainda impõem autorização por token/sessão; não equivaler rota pública a mutação pública. Chat identity fica atrás de CloudAccessGate com allowMembershipRequest e ShellConfigurationGate.

Company routes: CloudAccessGate + ShellConfigurationGate + shell/company resolution. Gates específicos preservados no JSON: HiddenSettingsPageGate (hidden keys), CloudManagedPageGate (import), ChatConnectorsExperimentalGate, IsolatedWorkspacesRouteGate, ExecutionWorkspaceCompanyGate, CasesExperimentalGate, StatusCardsExperimentalGate e ConferenceRoomChatGate. Hidden setting não substitui autorização de servidor.

Flags relevantes: streamlined; enableCombinedInboxTasks (somente combinado com streamlined); chat/connectors; isolated workspaces; cases; status; decisions; goals sidebar; conference room; file viewer; plugins. sidebar.tsx:66-136 e App.tsx guardam o acesso de descoberta e rota; ambos têm de ser preservados.

DEV: board tests/perf/long-thread e dev/task-chat-lab têm import.meta.env.DEV. Global /tests/perf/long-thread e os três /ux-lab/* estão registrados sem guard DEV no router. Registrar e validar separadamente; não descartar por parecerem testes. /design-guide e /instance/settings/adapters também são rotas existentes.

## Menu atual, tabs e comandos globais

| Superfície | Descoberta atual e ações de navegação | Fonte |
|---|---|---|
| Shell | Empresa selecionada/company switcher; settings/account; sidebar abrir/fechar/colapsar; painel; breadcrumbs; anúncios/toasts; browser controls quando standalone | components/Layout.tsx:1-60; SidebarAccountMenu; CompanyContext; SidebarContext |
| Primary | New Task, Search, Dashboard; Inbox quando separado; Chat conforme flags; Decisions/Status/Conference Room experimentais | components/Sidebar.tsx:141-203 |
| Work | Chat contextual; Tasks; Projects + starred; Routines; Artifacts; Cases; Goals; Workspaces condicionado a flags; slots e launchers de plugin | components/Sidebar.tsx:207-264 |
| Org streamlined | Agents, Skills, Connectors, Audit; secondary agents e recent tasks | components/Sidebar.tsx:267-294 |
| Organization legacy | Org, Connectors, Timeline, Costs, Activity, Commentary, Settings; project/agent groups antigos | components/Sidebar.tsx:295-315 |
| Mobile dock | Home, Tasks/Chat, New Task, Agents, Inbox conforme flags; badge vai para Tasks quando merged | components/MobileBottomNav.tsx:48-98 |
| Settings | General, Export, Import, Members, Secrets, Profile, Environments, Connections, Access, Experimental, Plugins, Adapters; hidden keys filtram descoberta | components/access/CompanySettingsNav.tsx:8-20 |
| Agents detail | Overview/config/instructions/skills/permissions/project access/runs/history, built-in resources e plugin:<key>:<slot>; URL /:tab ou /runs/:runId | pages/AgentDetail.tsx; AgentDetailPage.tsx:12-41 |
| Projects | Overview, Tasks com :filter, Workspaces e workspace detail, Configuration, Budget | App.tsx boardRoutes; pages/ProjectDetail.tsx |
| Routines | Lista/pastas, detalhe/sections, triggers, execução e secrets; variants *.production | pages/Routines.tsx; RoutineDetail.tsx |
| Skills | Installed/Discover/My Skills; Company Skills authored em Studio, editor/fork/new, Sources/detalhe, imports/scans/versions/attachments/folders | pages/CompanySkills.tsx:5383-5395; SkillStudio.tsx; SkillSources.tsx |
| Connectors | Browse, connect/BYO/Vercel, app permissions/tabs, review; chat endpoint setup/settings/reviews; gateways tabs; Advanced profiles/new/edit | App.tsx boardRoutes; components/AppsSidebar.tsx |
| Audit | Activity, Commentary, Runs, Costs, Budgets, Timeline; scoped agents/routine and action domain via URL | pages/audit/AuditHub.tsx:22-75,158-159 |
| Approvals | Pending/All, detalhe, linked task/agent/requester e resolução; há links no Inbox/Task, não item primário fixo | pages/Approvals.tsx:23-25,87; ApprovalDetail.tsx |
| Dynamic plugins | sidebar/sidebarPanel/detailTab/page/settings slots e launcher zones; catch-all /plugins/:pluginId, /:pluginRoutePath/*, /company/settings/:settingsRoutePath/* | components/Sidebar.tsx; pages/PluginPage.tsx; App.tsx:287,442 |

**More atual:** não existe uma config global de áreas/More dirigindo tudo. Recursos menos comuns hoje estão em contextual sidebars, settings, menus de card, Advanced e direct links. Esta tabela documenta os destinos atuais; não propõe IA nova na fase de evidência.

## Busca Cmd K e Search — baseline obrigatório

- Cmd/Ctrl K abre CommandPalette e fecha o sidebar no celular (CommandPalette.tsx:85-106). Busca q usa API de tasks incluindo routine executions (linha 171); promove até cinco projetos por nome/descrição (linha 199) e lista agentes. Manter filtros/operadores definidos em lib/search-query-parser.ts.
- Actions existentes: Create new task, Create new agent, Create new project (leva a Projects), Open file in this issue quando habilitado. Pages: Dashboard, Inbox/My work, Tasks, Projects, Goals, Agents, Costs, Activity (CommandPalette.tsx:316-405).
- Full search é caminho próprio via Enter, Cmd/Ctrl+Enter ou Search all, incluindo ausência de quick matches. Search.tsx:57-68 enumera Tasks, Comments, Documents, Artifacts, Agents, Projects e All. Query, scope, filtros e sort fazem parte do contrato de URL; lib/search-query-parser.ts é a autoridade dos operadores.
- Não afirmar que skills/routines/cases já são tipos de resultado de Search. Se surgirem na nova IA, isso é extensão futura aprovada, sem reduzir a busca que já existe.

## Inventário de ações e risco

Além de navegação acima, cada chamada nomeada de API está na seção actions do JSON. São incluídos páginas e componentes legacy/production/dev; o arquivo/método permite conferir o efeito antes da migração. categoria read-or-preview/potential-mutation-or-command é triagem lexical, não prova de semântica HTTP ou segurança.

| Família | Ações existentes a manter | Risco e revisão |
|---|---|---|
| Onboarding/company | criar empresa, agente, conectar modelo/key, starter task, resume/reentry; selecionar/arquivar/restaurar empresa, export/import | companhia/lifecycle/credentials; preservar gates Cloud e fluxo sem escrita de demonstração |
| Tasks/conversations | criar/editar status/assignee/projeto/work mode, comentários/anexos/documentos, queued edit/reorder/steer/discard, retry/stop/interromper, archive Inbox e Undo | operação e dados; Undo observado só para arquivo Inbox; queued continuation pode já ter iniciado |
| Agents | criar, configurar/icon/permissions, lifecycle/aprovar/pause/resume, builtin reset/recursos, skills sync, instructions/files/candidates/history/rollback, run/cancel/retry, keys/conexões | executor/credentials/orçamento; target/revision/hash e pending state existentes devem sobreviver |
| Projects/workspaces | criar/editar/star/archive projeto, tarefas, configuração/budget, workspaces/isolated execution/services/runtime logs | dados/lifecycle/execução, gates e escopo de empresa/projeto |
| Routines | criar/editar/archive/activate, manual run/variables, folder create/edit/delete/move, create/update/delete trigger, rotate webhook secret | execução periódica e secrets; revisão base no detalhe; delete handler não oferece Undo próprio |
| Skills | catálogo install/update/inspect, sources add/edit/scan/import, new/fork/edit/version, files/folders create/delete, sharing/move, attach/detach e sync a agentes, test inputs e runs | execução/import/code; usedByAgents bloqueia remove; arquivo dirty/conflict preservation |
| Connectors | conectar/desconectar, credentials/scopes/permissions/profile/test/probe, gateways, app review, BYO/Vercel, chat endpoints, GitHub review, aggregator/Composio | integração/credentials/autorização; confirmar no endpoint a permissão real |
| Approvals/decisions | approve/reject/request revision/resubmit/comment, eliminar agente reprovado, agir em decision queues | resolução operacional e delete irreversível; lista resolve direto, native confirm para remove |
| Costs/budgets | escolher período/tab/provider/biller, refresh subscription, upsert policy, resolve incident | preço/limite/financeiro; nenhuma mutação executada; query original em numbers audit |
| Settings/plugins/access | membership/invite/access/auth, secrets, environments, instance flags/plugins/adapters, plugin settings/actions | administração; hidden discovery não equivale autorização de servidor |
| Outras páginas | goals/status/cases/artifacts/profile e conference room: criar/editar/ações de detalhe nos callsites próprios | manter URLs, slots, tipos de entidade e permissões antes de regrouping |

**Limite explícito:** esta fase fecha toda a declaração de rota do runtime principal e registra todos os callsites API nomeados em páginas/componentes. Não fecha uma enumeração executada de cada botão, shortcut, schema/server command, plugin runtime action ou permissão efetiva. Shared API service calls fora desses arquivos e callbacks indiretos exigem follow-up ao migrar a respectiva área. Nenhum item desconhecido pode ser usado como justificativa de remoção.

## Registro completo — nada desaparece

Cada linha é uma definição preservada; linhas repetidas por URL mantêm branch/gate. Para a expressão inteira, dados de acesso e componentsources consulte o JSON. Campos :param e * são padrões, não IDs reais.

| ID | URL/padrão | Tipo / implementação | Condição | Gate adicional | Placement atual | Fonte |
|---|---|---|---|---|---|---|
| R001 | /:companyPrefix | redirect-or-compatibility: Navigate | always registered | — | Shell / direct route / fallback | ui/src/App.tsx:151 |
| R002 | /:companyPrefix/dashboard | page: Dashboard | always registered | — | Primary Dashboard | ui/src/App.tsx:152 |
| R003 | /:companyPrefix/dashboard/live | page: DashboardLive | always registered | — | Primary Dashboard | ui/src/App.tsx:153 |
| R004 | /:companyPrefix/timeline | redirect-or-compatibility: AuditCompatibilityRedirect, Timeline | always registered | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:154 |
| R005 | /:companyPrefix/onboarding | page: OnboardingRoutePage | always registered | — | Onboarding route / global wizard | ui/src/App.tsx:158 |
| R006 | /:companyPrefix/companies | page: Companies | always registered | — | Company switcher/account menu | ui/src/App.tsx:159 |
| R007 | /:companyPrefix/company/settings | page: CompanySettings | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:160 |
| R008 | /:companyPrefix/company/settings/connections | page: CompanyConnections | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:161 |
| R009 | /:companyPrefix/company/settings/environments | redirect-or-compatibility: Navigate | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:162 |
| R010 | /:companyPrefix/company/settings/cloud-upstream | redirect-or-compatibility: Navigate | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:163 |
| R011 | /:companyPrefix/company/settings/members | page: CompanyAccess | always registered | {<HiddenSettingsPageGate pageKey="company.members" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:165 |
| R012 | /:companyPrefix/company/settings/access | page: CompanyAccessLegacyRoute | always registered | {<HiddenSettingsPageGate pageKey="company.members" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:166 |
| R013 | /:companyPrefix/company/settings/invites | redirect-or-compatibility: Navigate | always registered | {<HiddenSettingsPageGate pageKey="company.invites" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:171 |
| R014 | /:companyPrefix/company/export/* | page: Suspense, PaperclipLoading, CompanyExport | always registered | {<HiddenSettingsPageGate pageKey="company.export" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:177 |
| R015 | /:companyPrefix/company/import | page: CompanyImport | always registered | {<CloudManagedPageGate />}; {<HiddenSettingsPageGate pageKey="company.import" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:188 |
| R016 | /:companyPrefix/company/settings/secrets | page: Secrets | always registered | {<HiddenSettingsPageGate pageKey="company.secrets" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:192 |
| R017 | /:companyPrefix/company/settings/tools | redirect-or-compatibility: LegacyToolsSettingsRedirect | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:194 |
| R018 | /:companyPrefix/company/settings/tools/:tab | redirect-or-compatibility: LegacyToolsSettingsRedirect | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:195 |
| R019 | /:companyPrefix/tools | redirect-or-compatibility: LegacyToolsRedirect | always registered | — | Shell / direct route / fallback | ui/src/App.tsx:196 |
| R020 | /:companyPrefix/tools/:tab | redirect-or-compatibility: LegacyToolsRedirect | always registered | — | Shell / direct route / fallback | ui/src/App.tsx:197 |
| R021 | /:companyPrefix/apps | page: Browse | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:198 |
| R022 | /:companyPrefix/apps/assistant-connection | page: AssistantConnection | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:199 |
| R023 | /:companyPrefix/apps/browse | redirect-or-compatibility: Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:200 |
| R024 | /:companyPrefix/apps/connections | redirect-or-compatibility: Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:201 |
| R025 | /:companyPrefix/apps/byo | page: AppsConnect | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:202 |
| R026 | /:companyPrefix/apps/vercel-connect | page: AppsConnectEntryRoute | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:203 |
| R027 | /:companyPrefix/apps/connect | page: AppsConnectEntryRoute | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:207 |
| R028 | /:companyPrefix/apps/chat/connect | page: ChatConnectorsExperimentalGate, ChatEndpointSetup | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:208 |
| R029 | /:companyPrefix/apps/chat/:endpointId | redirect-or-compatibility: ChatConnectorsExperimentalGate, Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:211 |
| R030 | /:companyPrefix/apps/chat/:endpointId/reviews/:reviewId | page: ChatConnectorsExperimentalGate, ChatEndpointDetail | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:214 |
| R031 | /:companyPrefix/apps/chat/:endpointId/:tab | page: ChatConnectorsExperimentalGate, ChatEndpointDetail | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:217 |
| R032 | /:companyPrefix/apps/connect/:appKey | redirect-or-compatibility: Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:220 |
| R033 | /:companyPrefix/apps/connect/:appKey/:stage | redirect-or-compatibility: Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:221 |
| R034 | /:companyPrefix/apps/review | page: AppsReview | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:222 |
| R035 | /:companyPrefix/apps/attention | redirect-or-compatibility: Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:224 |
| R036 | /:companyPrefix/apps/gateways | page: GatewaysList | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:225 |
| R037 | /:companyPrefix/apps/gateways/:gatewayId | redirect-or-compatibility: Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:226 |
| R038 | /:companyPrefix/apps/gateways/:gatewayId/:tab | page: GatewayDetail | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:227 |
| R039 | /:companyPrefix/apps/advanced | page: AdvancedToolsRoute | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:228 |
| R040 | /:companyPrefix/apps/advanced/gateways | page: GatewaysList | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:229 |
| R041 | /:companyPrefix/apps/advanced/profiles/new | page: ProfileWizardRoute | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:230 |
| R042 | /:companyPrefix/apps/advanced/profiles/:profileId/edit | page: ProfileWizardRoute | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:231 |
| R043 | /:companyPrefix/apps/advanced/profiles/:profileId | page: ProfileDetailRoute | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:232 |
| R044 | /:companyPrefix/apps/advanced/audit | redirect-or-compatibility: Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:233 |
| R045 | /:companyPrefix/apps/advanced/run-your-own | redirect-or-compatibility: Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:234 |
| R046 | /:companyPrefix/apps/advanced/:tab | page: AdvancedToolsRoute | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:235 |
| R047 | /:companyPrefix/apps/app/:applicationId | page: AppNotConnected | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:236 |
| R048 | /:companyPrefix/apps/app/:applicationId/:tab | page: AppNotConnected | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:237 |
| R049 | /:companyPrefix/apps/:connectionId | redirect-or-compatibility: Navigate | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:238 |
| R050 | /:companyPrefix/apps/:connectionId/:tab | page: AppDetail | always registered | — | Org / Organization > Connectors; contextual sidebar and Advanced | ui/src/App.tsx:239 |
| R051 | /:companyPrefix/company/settings/instance | redirect-or-compatibility: Navigate | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:240 |
| R052 | /:companyPrefix/company/settings/instance/profile | page: ProfileSettings | always registered | {<HiddenSettingsPageGate pageKey="instance.profile" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:242 |
| R053 | /:companyPrefix/company/settings/instance/general | redirect-or-compatibility: Navigate | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:244 |
| R054 | /:companyPrefix/company/settings/instance/heartbeats | redirect-or-compatibility: Navigate | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:245 |
| R055 | /:companyPrefix/company/settings/instance/environments | page: CompanyEnvironments | always registered | {<HiddenSettingsPageGate pageKey="instance.environments" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:247 |
| R056 | /:companyPrefix/company/settings/instance/environments/new | page: CompanyEnvironments | always registered | {<HiddenSettingsPageGate pageKey="instance.environments" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:248 |
| R057 | /:companyPrefix/company/settings/instance/environments/:environmentId/edit | page: CompanyEnvironments | always registered | {<HiddenSettingsPageGate pageKey="instance.environments" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:249 |
| R058 | /:companyPrefix/company/settings/instance/access | page: InstanceAccess | always registered | {<HiddenSettingsPageGate pageKey="instance.access" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:252 |
| R059 | /:companyPrefix/company/settings/instance/experimental | page: InstanceExperimentalSettings | always registered | {<HiddenSettingsPageGate pageKey="instance.experimental" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:255 |
| R060 | /:companyPrefix/company/settings/instance/plugins | page: PluginManager | always registered | {<HiddenSettingsPageGate pageKey="instance.plugins" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:258 |
| R061 | /:companyPrefix/company/settings/instance/plugins/:pluginId | page: PluginSettings | always registered | {<HiddenSettingsPageGate pageKey="instance.plugins" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:259 |
| R062 | /:companyPrefix/company/settings/instance/adapters | page: AdapterManager | always registered | {<HiddenSettingsPageGate pageKey="instance.adapters" />} | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:262 |
| R063 | /:companyPrefix/company/settings/:settingsRoutePath/* | page: CompanySettingsPluginPage | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:264 |
| R064 | /:companyPrefix/skills/sources | page: SkillSources | always registered | — | Org > Skills; Installed/Discover/My Skills; Sources and Studio | ui/src/App.tsx:265 |
| R065 | /:companyPrefix/skills/sources/:sourceId | page: SkillSources | always registered | — | Org > Skills; Installed/Discover/My Skills; Sources and Studio | ui/src/App.tsx:266 |
| R066 | /:companyPrefix/skills/studio | page: CompanySkills, SkillStudio | always registered | — | Org > Skills; Installed/Discover/My Skills; Sources and Studio | ui/src/App.tsx:267 |
| R067 | /:companyPrefix/skills/studio/new | page: SkillStudio | always registered | — | Org > Skills; Installed/Discover/My Skills; Sources and Studio | ui/src/App.tsx:268 |
| R068 | /:companyPrefix/skills/studio/:skillId | page: SkillStudio | always registered | — | Org > Skills; Installed/Discover/My Skills; Sources and Studio | ui/src/App.tsx:269 |
| R069 | /:companyPrefix/skills/:skillId/studio | redirect-or-compatibility: LegacySkillStudioRedirect | always registered | — | Org > Skills; Installed/Discover/My Skills; Sources and Studio | ui/src/App.tsx:270 |
| R070 | /:companyPrefix/skills/* | page: CompanySkills, ProductionSurface, ProductionCompanySkills | always registered | — | Org > Skills; Installed/Discover/My Skills; Sources and Studio | ui/src/App.tsx:271 |
| R071 | /:companyPrefix/settings | redirect-or-compatibility: LegacySettingsRedirect | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:275 |
| R072 | /:companyPrefix/settings/* | redirect-or-compatibility: LegacySettingsRedirect | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:276 |
| R073 | /:companyPrefix/plugins/:pluginId | page: PluginPage | always registered | — | Runtime plugin sidebar/launcher slots | ui/src/App.tsx:277 |
| R074 | /:companyPrefix/org | redirect-or-compatibility: Navigate, ProductionSurface, ProductionOrgChart | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:278 |
| R075 | /:companyPrefix/agents | redirect-or-compatibility: Navigate | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:282 |
| R076 | /:companyPrefix/agents/all | page: Agents, ProductionSurface, ProductionAgents | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:284 |
| R077 | /:companyPrefix/agents/active | page: Agents, ProductionSurface, ProductionAgents | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:284 |
| R078 | /:companyPrefix/agents/paused | page: Agents, ProductionSurface, ProductionAgents | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:284 |
| R079 | /:companyPrefix/agents/error | page: Agents, ProductionSurface, ProductionAgents | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:284 |
| R080 | /:companyPrefix/agents/builtin | page: Agents, ProductionSurface, ProductionAgents | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:284 |
| R081 | /:companyPrefix/agents/new | page: NewAgent | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:290 |
| R082 | /:companyPrefix/agents/:agentId | page: AgentDetail | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:291 |
| R083 | /:companyPrefix/agents/:agentId/:tab | page: AgentDetail | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:292 |
| R084 | /:companyPrefix/agents/:agentId/runs/:runId | page: AgentDetail | always registered | — | Org > Agents; legacy Organization / Org; detail tabs | ui/src/App.tsx:293 |
| R085 | /:companyPrefix/projects | page: Projects | always registered | — | Work > Projects; legacy project section; detail tabs | ui/src/App.tsx:294 |
| R086 | /:companyPrefix/projects/:projectId | page: ProjectDetail | always registered | — | Work > Projects; legacy project section; detail tabs | ui/src/App.tsx:295 |
| R087 | /:companyPrefix/projects/:projectId/overview | page: ProjectDetail | always registered | — | Work > Projects; legacy project section; detail tabs | ui/src/App.tsx:296 |
| R088 | /:companyPrefix/projects/:projectId/issues | page: ProjectDetail | always registered | — | Work > Projects; legacy project section; detail tabs | ui/src/App.tsx:297 |
| R089 | /:companyPrefix/projects/:projectId/issues/:filter | page: ProjectDetail | always registered | — | Work > Projects; legacy project section; detail tabs | ui/src/App.tsx:298 |
| R090 | /:companyPrefix/projects/:projectId/workspaces/:workspaceId | page: ProjectWorkspaceDetail | always registered | {<IsolatedWorkspacesRouteGate />} | Work > Projects; legacy project section; detail tabs | ui/src/App.tsx:300 |
| R091 | /:companyPrefix/projects/:projectId/workspaces | page: ProjectDetail | always registered | — | Work > Projects; legacy project section; detail tabs | ui/src/App.tsx:302 |
| R092 | /:companyPrefix/projects/:projectId/configuration | page: ProjectDetail | always registered | — | Work > Projects; legacy project section; detail tabs | ui/src/App.tsx:303 |
| R093 | /:companyPrefix/projects/:projectId/budget | page: ProjectDetail | always registered | — | Work > Projects; legacy project section; detail tabs | ui/src/App.tsx:304 |
| R094 | /:companyPrefix/workspaces | page: Workspaces | always registered | {<IsolatedWorkspacesRouteGate />} | Work > Workspaces conditional; project/agent links | ui/src/App.tsx:306 |
| R095 | /:companyPrefix/issues | page: Issues | always registered | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:308 |
| R096 | /:companyPrefix/tasks | redirect-or-compatibility: Navigate | always registered | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:309 |
| R097 | /:companyPrefix/search | page: Search | always registered | — | Sidebar Search / Cmd K | ui/src/App.tsx:310 |
| R098 | /:companyPrefix/issues/all | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:314 |
| R099 | /:companyPrefix/issues/active | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:315 |
| R100 | /:companyPrefix/issues/backlog | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:316 |
| R101 | /:companyPrefix/issues/done | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:317 |
| R102 | /:companyPrefix/issues/recent | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:318 |
| R103 | /:companyPrefix/issues/all | redirect-or-compatibility: Navigate | mergedTasks [false] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:322 |
| R104 | /:companyPrefix/issues/active | redirect-or-compatibility: Navigate | mergedTasks [false] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:323 |
| R105 | /:companyPrefix/issues/backlog | redirect-or-compatibility: Navigate | mergedTasks [false] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:324 |
| R106 | /:companyPrefix/issues/done | redirect-or-compatibility: Navigate | mergedTasks [false] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:325 |
| R107 | /:companyPrefix/issues/recent | redirect-or-compatibility: Navigate | mergedTasks [false] | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:326 |
| R108 | /:companyPrefix/chats | page: AgentChats | always registered | — | Chat primary or Work; agent secondary rail | ui/src/App.tsx:329 |
| R109 | /:companyPrefix/chats/:agentRef | page: AgentChat | always registered | — | Chat primary or Work; agent secondary rail | ui/src/App.tsx:330 |
| R110 | /:companyPrefix/issues/:issueId | page: IssueDetail | always registered | — | Work > Tasks; merged view tabs when enabled | ui/src/App.tsx:331 |
| R111 | /:companyPrefix/tests/perf/long-thread | page: IssueChatLongThreadPerf | import.meta.env.DEV [true] | — | Direct development/design surface | ui/src/App.tsx:333 |
| R112 | /:companyPrefix/routines | page: Routines, ProductionSurface, ProductionRoutines | always registered | — | Work > Routines; contextual detail sections | ui/src/App.tsx:335 |
| R113 | /:companyPrefix/cases | page: CasesExperimentalGate, Cases | always registered | — | Work > Cases experimental | ui/src/App.tsx:336 |
| R114 | /:companyPrefix/cases/:caseIdentifier | page: CasesExperimentalGate, CaseDetail | always registered | — | Work > Cases experimental | ui/src/App.tsx:340 |
| R115 | /:companyPrefix/status | page: StatusCardsExperimentalGate, StatusCards | always registered | — | Primary Status experimental | ui/src/App.tsx:344 |
| R116 | /:companyPrefix/status/:cardId | page: StatusCardsExperimentalGate, StatusCards | always registered | — | Primary Status experimental | ui/src/App.tsx:348 |
| R117 | /:companyPrefix/status-cards | redirect-or-compatibility: StatusCardsLegacyRedirect | always registered | — | Primary Status experimental | ui/src/App.tsx:353 |
| R118 | /:companyPrefix/status-cards/:cardId | redirect-or-compatibility: StatusCardsLegacyRedirect | always registered | — | Primary Status experimental | ui/src/App.tsx:354 |
| R119 | /:companyPrefix/routines/:routineId | page: RoutineDetail, ProductionSurface, ProductionRoutineDetail | always registered | — | Work > Routines; contextual detail sections | ui/src/App.tsx:355 |
| R120 | /:companyPrefix/routines/:routineId/:section | page: RoutineDetail, ProductionSurface, ProductionRoutineDetail | always registered | — | Work > Routines; contextual detail sections | ui/src/App.tsx:356 |
| R121 | /:companyPrefix/execution-workspaces/:workspaceId | page: ExecutionWorkspaceDetail | always registered | {<IsolatedWorkspacesRouteGate />}; {<ExecutionWorkspaceCompanyGate />} | Work > Workspaces conditional; project/agent links | ui/src/App.tsx:359 |
| R122 | /:companyPrefix/execution-workspaces/:workspaceId/services | page: ExecutionWorkspaceDetail | always registered | {<IsolatedWorkspacesRouteGate />}; {<ExecutionWorkspaceCompanyGate />} | Work > Workspaces conditional; project/agent links | ui/src/App.tsx:360 |
| R123 | /:companyPrefix/execution-workspaces/:workspaceId/configuration | page: ExecutionWorkspaceDetail | always registered | {<IsolatedWorkspacesRouteGate />}; {<ExecutionWorkspaceCompanyGate />} | Work > Workspaces conditional; project/agent links | ui/src/App.tsx:361 |
| R124 | /:companyPrefix/execution-workspaces/:workspaceId/runtime-logs | page: ExecutionWorkspaceDetail | always registered | {<IsolatedWorkspacesRouteGate />}; {<ExecutionWorkspaceCompanyGate />} | Work > Workspaces conditional; project/agent links | ui/src/App.tsx:362 |
| R125 | /:companyPrefix/execution-workspaces/:workspaceId/issues | page: ExecutionWorkspaceDetail | always registered | {<IsolatedWorkspacesRouteGate />}; {<ExecutionWorkspaceCompanyGate />} | Work > Workspaces conditional; project/agent links | ui/src/App.tsx:363 |
| R126 | /:companyPrefix/execution-workspaces/:workspaceId/routines | page: ExecutionWorkspaceDetail | always registered | {<IsolatedWorkspacesRouteGate />}; {<ExecutionWorkspaceCompanyGate />} | Work > Workspaces conditional; project/agent links | ui/src/App.tsx:364 |
| R127 | /:companyPrefix/goals | page: Goals | always registered | — | Work > Goals experimental; Cmd K Goals | ui/src/App.tsx:367 |
| R128 | /:companyPrefix/goals/:goalId | page: GoalDetail | always registered | — | Work > Goals experimental; Cmd K Goals | ui/src/App.tsx:368 |
| R129 | /:companyPrefix/artifacts | page: Artifacts | always registered | — | Work > Artifacts | ui/src/App.tsx:369 |
| R130 | /:companyPrefix/approvals | redirect-or-compatibility: Navigate | always registered | — | Inbox/task approval links; direct route, no top-level sidebar | ui/src/App.tsx:370 |
| R131 | /:companyPrefix/approvals/pending | page: Approvals | always registered | — | Inbox/task approval links; direct route, no top-level sidebar | ui/src/App.tsx:371 |
| R132 | /:companyPrefix/approvals/all | page: Approvals | always registered | — | Inbox/task approval links; direct route, no top-level sidebar | ui/src/App.tsx:372 |
| R133 | /:companyPrefix/approvals/:approvalId | page: ApprovalDetail | always registered | — | Inbox/task approval links; direct route, no top-level sidebar | ui/src/App.tsx:373 |
| R134 | /:companyPrefix/activity | page: CompanyActivity, ProductionSurface, ProductionCompanyActivity | always registered | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:374 |
| R135 | /:companyPrefix/activity/commentary | page: AuditHub | always registered | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:375 |
| R136 | /:companyPrefix/activity/runs | page: AuditHub | always registered | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:376 |
| R137 | /:companyPrefix/activity/costs | page: AuditHub | always registered | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:377 |
| R138 | /:companyPrefix/activity/budgets | page: AuditHub | always registered | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:378 |
| R139 | /:companyPrefix/activity/timeline | page: AuditHub | always registered | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:379 |
| R140 | /:companyPrefix/audit | redirect-or-compatibility: AuditCompatibilityRedirect | streamlinedUiEnabled [true] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:382 |
| R141 | /:companyPrefix/audit/activity | redirect-or-compatibility: AuditCompatibilityRedirect | streamlinedUiEnabled [true] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:383 |
| R142 | /:companyPrefix/audit/runs | redirect-or-compatibility: AuditCompatibilityRedirect | streamlinedUiEnabled [true] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:384 |
| R143 | /:companyPrefix/audit/costs | redirect-or-compatibility: AuditCompatibilityRedirect | streamlinedUiEnabled [true] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:385 |
| R144 | /:companyPrefix/audit/budgets | redirect-or-compatibility: AuditCompatibilityRedirect | streamlinedUiEnabled [true] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:386 |
| R145 | /:companyPrefix/audit/timeline | redirect-or-compatibility: AuditCompatibilityRedirect | streamlinedUiEnabled [true] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:387 |
| R146 | /:companyPrefix/runs | redirect-or-compatibility: AuditCompatibilityRedirect | streamlinedUiEnabled [true] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:388 |
| R147 | /:companyPrefix/costs | redirect-or-compatibility: AuditCompatibilityRedirect | streamlinedUiEnabled [true] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:389 |
| R148 | /:companyPrefix/budgets | redirect-or-compatibility: AuditCompatibilityRedirect | streamlinedUiEnabled [true] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:390 |
| R149 | /:companyPrefix/costs | page: Costs | streamlinedUiEnabled [false] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:394 |
| R150 | /:companyPrefix/audit | redirect-or-compatibility: Navigate | streamlinedUiEnabled [false] | — | Org > Audit tabs; legacy Organization > Activity/Commentary/Costs/Timeline | ui/src/App.tsx:395 |
| R151 | /:companyPrefix/board-chat | page: BoardChat | always registered | {<ConferenceRoomChatGate />} | Primary Conference Room experimental | ui/src/App.tsx:404 |
| R152 | /:companyPrefix/artifacts | page: Artifacts | always registered | {<ConferenceRoomChatGate />} | Work > Artifacts | ui/src/App.tsx:405 |
| R153 | /:companyPrefix/dev/task-chat-lab | page: TaskChatLab | import.meta.env.DEV [true] | — | Direct development/design surface | ui/src/App.tsx:409 |
| R154 | /:companyPrefix/decisions | page: WhatNeedsMe | always registered | — | Primary Decisions experimental; queue links | ui/src/App.tsx:411 |
| R155 | /:companyPrefix/decisions/queues/:key | page: DecisionQueuePage | always registered | — | Primary Decisions experimental; queue links | ui/src/App.tsx:412 |
| R156 | /:companyPrefix/inbox | redirect-or-compatibility: InboxRootRedirect | mergedTasks [true] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:419 |
| R157 | /:companyPrefix/inbox/mine | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:420 |
| R158 | /:companyPrefix/inbox/recent | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:421 |
| R159 | /:companyPrefix/inbox/unread | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:422 |
| R160 | /:companyPrefix/inbox/blocked | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:423 |
| R161 | /:companyPrefix/inbox/all | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:424 |
| R162 | /:companyPrefix/inbox/new | redirect-or-compatibility: TaskViewRedirect | mergedTasks [true] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:425 |
| R163 | /:companyPrefix/inbox | redirect-or-compatibility: InboxRootRedirect | mergedTasks [false] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:429 |
| R164 | /:companyPrefix/inbox/mine | page: Inbox | mergedTasks [false] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:430 |
| R165 | /:companyPrefix/inbox/recent | page: Inbox | mergedTasks [false] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:431 |
| R166 | /:companyPrefix/inbox/unread | page: Inbox | mergedTasks [false] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:432 |
| R167 | /:companyPrefix/inbox/blocked | page: Inbox | mergedTasks [false] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:433 |
| R168 | /:companyPrefix/inbox/all | page: Inbox | mergedTasks [false] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:434 |
| R169 | /:companyPrefix/inbox/new | redirect-or-compatibility: Navigate | mergedTasks [false] | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:435 |
| R170 | /:companyPrefix/inbox/requests | page: JoinRequestQueue | always registered | — | Primary Inbox when separate; Tasks view when merged | ui/src/App.tsx:438 |
| R171 | /:companyPrefix/u/:userSlug | page: UserProfile | always registered | — | User identity links | ui/src/App.tsx:439 |
| R172 | /:companyPrefix/design-guide | page: DesignGuide | always registered | — | Direct development/design surface | ui/src/App.tsx:440 |
| R173 | /:companyPrefix/instance/settings/adapters | page: AdapterManager | always registered | — | Account Settings / contextual company settings nav; gated sections | ui/src/App.tsx:441 |
| R174 | /:companyPrefix/:pluginRoutePath/* | page: PluginPage | always registered | — | Runtime plugin sidebar/launcher slots | ui/src/App.tsx:442 |
| R175 | /:companyPrefix/* | fallback: NotFoundPage | always registered | — | Shell / direct route / fallback | ui/src/App.tsx:443 |
| R176 | /oauth-handoff | page: PaperclipCloudOAuthHandoffPage | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:777 |
| R177 | /auth | page: AuthPage | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:778 |
| R178 | /board-claim/:token | page: BoardClaimPage | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:779 |
| R179 | /mcp-connect/:id | page: McpConnectPage | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:780 |
| R180 | /dot-connect/:id | page: McpConnectPage | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:781 |
| R181 | /mcp-device | page: McpDevicePage | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:782 |
| R182 | /assistant-connections | page: AssistantConnectionsPage | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:783 |
| R183 | /cli-auth/:id | page: CliAuthPage | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:784 |
| R184 | /invite/:token | page: InviteLandingPage | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:785 |
| R185 | /chat-identity/confirm | page: ChatIdentityConfirm | always registered | {<CloudAccessGate allowMembershipRequest />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:790 |
| R186 | /tests/perf/long-thread | page: IssueChatLongThreadPerf | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:793 |
| R187 | /ux-lab/bootstrap-setup | page: BootstrapSetupUxLab | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:794 |
| R188 | /ux-lab/responsible-user-denial | page: ResponsibleUserDenialUxLab | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:795 |
| R189 | /ux-lab/cross-issue-collaboration | page: CrossIssueCollaborationUxLab | always registered | — | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:796 |
| R190 | / | redirect-or-compatibility: CompanyRootRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:800 |
| R191 | /onboarding | page: OnboardingRoutePage | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:801 |
| R192 | /instance | redirect-or-compatibility: LegacySettingsRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:802 |
| R193 | /instance/settings | redirect-or-compatibility: LegacySettingsRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:803 |
| R194 | /instance/settings/* | redirect-or-compatibility: LegacySettingsRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:804 |
| R195 | /companies | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:805 |
| R196 | /issues | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:806 |
| R197 | /tasks | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:807 |
| R198 | /issues/:issueId | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:808 |
| R199 | /routines | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:809 |
| R200 | /routines/:routineId | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:810 |
| R201 | /cases | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:811 |
| R202 | /cases/:caseIdentifier | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:812 |
| R203 | /status | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:813 |
| R204 | /status/:cardId | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:814 |
| R205 | /status-cards | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:815 |
| R206 | /status-cards/:cardId | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:816 |
| R207 | /artifacts | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:817 |
| R208 | /audit | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:818 |
| R209 | /audit/* | redirect-or-compatibility: UnprefixedBoardRedirect | streamlinedUiEnabled [true] | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:821 |
| R210 | /activity | redirect-or-compatibility: UnprefixedBoardRedirect | streamlinedUiEnabled [true] | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:822 |
| R211 | /activity/* | redirect-or-compatibility: UnprefixedBoardRedirect | streamlinedUiEnabled [true] | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:823 |
| R212 | /runs | redirect-or-compatibility: UnprefixedBoardRedirect | streamlinedUiEnabled [true] | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:824 |
| R213 | /costs | redirect-or-compatibility: UnprefixedBoardRedirect | streamlinedUiEnabled [true] | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:825 |
| R214 | /budgets | redirect-or-compatibility: UnprefixedBoardRedirect | streamlinedUiEnabled [true] | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:826 |
| R215 | /decisions | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:829 |
| R216 | /u/:userSlug | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:830 |
| R217 | /skills/studio | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:831 |
| R218 | /skills/studio/new | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:832 |
| R219 | /skills/studio/:skillId | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:833 |
| R220 | /skills/:skillId/studio | redirect-or-compatibility: LegacySkillStudioRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:834 |
| R221 | /skills/* | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:835 |
| R222 | /settings | redirect-or-compatibility: LegacySettingsRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:836 |
| R223 | /settings/* | redirect-or-compatibility: LegacySettingsRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:837 |
| R224 | /agents | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:838 |
| R225 | /agents/all | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:840 |
| R226 | /agents/active | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:840 |
| R227 | /agents/paused | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:840 |
| R228 | /agents/error | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:840 |
| R229 | /agents/builtin | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:840 |
| R230 | /agents/new | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:842 |
| R231 | /agents/:agentId | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:843 |
| R232 | /agents/:agentId/:tab | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:844 |
| R233 | /agents/:agentId/runs/:runId | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:845 |
| R234 | /projects | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:846 |
| R235 | /projects/:projectId | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:847 |
| R236 | /projects/:projectId/overview | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:848 |
| R237 | /projects/:projectId/issues | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:849 |
| R238 | /projects/:projectId/issues/:filter | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:850 |
| R239 | /projects/:projectId/workspaces | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:851 |
| R240 | /projects/:projectId/workspaces/:workspaceId | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:852 |
| R241 | /projects/:projectId/configuration | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:853 |
| R242 | /workspaces | redirect-or-compatibility: UnprefixedBoardRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:854 |
| R243 | /execution-workspaces/:workspaceId | redirect-or-compatibility: UnprefixedExecutionWorkspaceRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:855 |
| R244 | /execution-workspaces/:workspaceId/services | redirect-or-compatibility: UnprefixedExecutionWorkspaceRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:856 |
| R245 | /execution-workspaces/:workspaceId/configuration | redirect-or-compatibility: UnprefixedExecutionWorkspaceRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:857 |
| R246 | /execution-workspaces/:workspaceId/runtime-logs | redirect-or-compatibility: UnprefixedExecutionWorkspaceRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:858 |
| R247 | /execution-workspaces/:workspaceId/issues | redirect-or-compatibility: UnprefixedExecutionWorkspaceRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:859 |
| R248 | /execution-workspaces/:workspaceId/routines | redirect-or-compatibility: UnprefixedExecutionWorkspaceRedirect | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:860 |
| R249 | /:companyPrefix | container: Layout, ProductionLayout | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:861 |
| R250 | /* | fallback: NotFoundPage | always registered | {<CloudAccessGate />}; {<ShellConfigurationGate loaded={streamlinedUiLoaded} />} | Outside board menu: public/auth/system, compatibility alias or shell | ui/src/App.tsx:864 |

## Sobreposições e compatibilidade

- /:companyPrefix: R001 @151, R249 @861
- /:companyPrefix/issues/all: R098 @314, R103 @322
- /:companyPrefix/issues/active: R099 @315, R104 @323
- /:companyPrefix/issues/backlog: R100 @316, R105 @324
- /:companyPrefix/issues/done: R101 @317, R106 @325
- /:companyPrefix/issues/recent: R102 @318, R107 @326
- /:companyPrefix/artifacts: R129 @369, R152 @405
- /:companyPrefix/audit: R140 @382, R150 @395
- /:companyPrefix/costs: R147 @389, R149 @394
- /:companyPrefix/inbox: R156 @419, R163 @429
- /:companyPrefix/inbox/mine: R157 @420, R164 @430
- /:companyPrefix/inbox/recent: R158 @421, R165 @431
- /:companyPrefix/inbox/unread: R159 @422, R166 @432
- /:companyPrefix/inbox/blocked: R160 @423, R167 @433
- /:companyPrefix/inbox/all: R161 @424, R168 @434
- /:companyPrefix/inbox/new: R162 @425, R169 @435

Muitas sobreposições são ramos mutuamente exclusivos (merged Inbox/Tasks e streamlined/legacy). Artifacts é declarado tanto sem ConferenceRoomChatGate quanto dentro dele; o registro ungated já oferece a página, portanto o segundo gate não deve ser presumido como requisito de acesso da primeira definição. O JSX original está preservado no JSON.

Aliases unprefixed, LegacySettingsRedirect, LegacyToolsRedirect, LegacySkillStudioRedirect, StatusCardsLegacyRedirect, TaskViewRedirect e AuditCompatibilityRedirect devem manter target, query/search/hash e scoping onde já preservados. UnprefixedBoardRedirect em App.tsx:688 e TaskViewRedirect em App.tsx:470 são autoridade do comportamento, não o título do novo menu.

## Contrato da fase seguinte, após escolha dos mockups

A Fase 3 deve dar uma casa aprovada a cada ID/padrão acima, conservar aliases e registry dynamic, e então adicionar teste que falha para rota órfã. Ainda não há esse teste nesta auditoria. A Fase 4 deve preservar auth/company API/query keys, usar feature flag OFF produção/ON staging e um PR por área. Nenhuma implementação dessas fases foi iniciada.
