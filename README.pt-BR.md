🇬🇧 [English](README.md) • 🇻🇳 [Tiếng Việt](README.vi.md) • 🇪🇸 [Español](README.es.md) • 🇧🇷 **Português** • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 [Français](README.fr.md) • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  Deixe suas abas descansar, libere memória - uma extensão Chrome que descarrega automaticamente as abas inativas.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/v/agajndkecodedlklmpnjgikglkpeopib?label=chrome&style=flat-square&logo=googlechrome&logoColor=white&color=4285F4" alt="Chrome Web Store Version">
  </a>
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/users/agajndkecodedlklmpnjgikglkpeopib?style=flat-square&color=6ee7b7" alt="Chrome Web Store Users">
  </a>
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/rating/agajndkecodedlklmpnjgikglkpeopib?style=flat-square&color=facc15" alt="Chrome Web Store Rating">
  </a>
  <a href="https://github.com/lamngockhuong/tabrest/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?style=flat-square&label=CI&color=22c55e" alt="CI">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/lamngockhuong/tabrest?style=flat-square&color=60a5fa" alt="MIT License">
  </a>
  <a href="https://github.com/lamngockhuong/tabrest/stargazers">
    <img src="https://img.shields.io/github/stars/lamngockhuong/tabrest?style=flat-square&color=f59e0b" alt="GitHub Stars">
  </a>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/badge/Install_from-Chrome_Web_Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store">
  </a>
  <a href="https://tabrest.ohnice.app">
    <img src="https://img.shields.io/badge/Visit-Website-8957e5?style=for-the-badge&logo=astro&logoColor=white" alt="Website">
  </a>
</p>

<p align="center">
  <a href="https://unikorn.vn/p/tabrest?ref=embed-tabrest" target="_blank"><img src="https://unikorn.vn/api/widgets/badge/tabrest?theme=light" alt="TabRest on Unikorn.vn" width="200" height="50" /></a>
  &nbsp;
  <a href="https://launch.j2team.dev/products/tabrest?utm_source=badge-launched&utm_medium=badge&utm_campaign=badge-tabrest" target="_blank" rel="noopener noreferrer"><img src="https://launch.j2team.dev/badge/tabrest/neutral" alt="TabRest - Launched on J2TEAM Launch" width="200" height="43" /></a>
</p>

## Funcionalidades

- **Descarregar abas inativas automaticamente** - Temporizador de inatividade configurável (5min a 4h)
- **Limiar de memória** - Descarregar quando o RAM exceder 60-95%
- **Limite de memória por aba** - Descarregar abas que usam >100MB-1GB de JS heap
- **Descarregar na inicialização** - Liberar memória ao abrir o navegador
- **Controles manuais** - Descarregar a aba atual/esquerda/direita/outras
- **Fechar abas duplicadas** - Deduplicação com um clique na janela atual
- **Busca de abas** - Filtrar a lista de abas por título ou URL em tempo real
- **Grupos de abas** - Descarregar grupos de abas inteiros
- **Modo painel lateral** - Abrir o TabRest no painel lateral do Chrome (opt-in)
- **Adiar abas/sites** - Proteger temporariamente abas ou domínios (30min-2h)
- **Aviso antes de descartar** - Toast de 3s na página antes do descarte automático
- **Indicador visual** - Prefixo personalizável (💤) nos títulos das abas descartadas
- **Lista branca** - Proteger sites do descarregamento automático (suporta localhost e IP)
- **Importar/Exportar** - Fazer backup de listas brancas, listas negras e sessões em JSON
- **Sessões** - Salvar e restaurar conjuntos de abas
- **Restaurar rolagem** - Restaurar a posição de rolagem ao recarregar as abas
- **Timestamp do YouTube** - Retomar vídeos de onde parou após recarregar
- **Ignorar quando offline** - Não descartar abas quando a rede estiver indisponível
- **Modo somente inativo** - Descarregar automaticamente apenas quando o computador estiver ocioso
- **Modo de energia** - Perfis de economia de bateria, normal ou desempenho
- **Notificações de descarregamento automático** - Receber notificações quando as abas forem descarregadas
- **Tooltip de memória** - Passe o mouse nas estatísticas para ver o RAM estimado economizado por aba
- **Assistente de configuração** - Configuração interativa em várias etapas na primeira execução
- **Relatório de erros opcional** - Relatórios de falha anônimos via Sentry (desativado por padrão) mais envio manual de bug
- **Abertura automática do registro de alterações** - Abre as notas de versão em atualizações menores/maiores
- **Permissões de host opcionais** - A proteção de formulários só solicita acesso quando ativada
- **Exibição de uso de RAM** - Percentual de RAM ao vivo no cabeçalho do popup
- **Estatísticas** - Acompanhar abas descarregadas e memória economizada
- **Multilíngue** - 11 idiomas suportados

## Atalhos de Teclado

| Atalho        | Ação                        |
| ------------- | --------------------------- |
| `Alt+Shift+D` | Descarregar a aba atual     |
| `Alt+Shift+O` | Descarregar outras abas     |
| `Alt+Shift+→` | Descarregar abas à direita  |
| `Alt+Shift+←` | Descarregar abas à esquerda |

## Instalação

### A partir do código fonte

1. Clone este repositório
2. Abra `chrome://extensions` no Chrome
3. Ative o "Modo do desenvolvedor" (canto superior direito)
4. Clique em "Carregar sem compactação"
5. Selecione a pasta do projeto

### Pela Chrome Web Store

[Instale o TabRest na Chrome Web Store](https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib).

## Como Funciona

O TabRest usa a API nativa `chrome.tabs.discard()` do Chrome para descarregar abas. Abas descartadas:

- Continuam visíveis na barra de abas
- Preservam a posição de rolagem e os dados de formulário
- Recarregam instantaneamente ao serem clicadas
- Liberam memória enquanto estão inativas

## Estrutura do Projeto

```text
tabrest/
├── manifest.json           # Configuração da extensão (MV3)
├── _locales/               # Traduções i18n (en, vi)
├── src/
│   ├── background/         # Módulos do service worker
│   ├── content/            # Form checker, YouTube tracker
│   ├── popup/              # UI do popup / painel lateral
│   ├── options/            # Página de configurações
│   ├── pages/              # Onboarding, changelog
│   └── shared/             # Utilitários compartilhados
├── icons/                  # Ícones da extensão
├── website/                # Site de documentação Astro (tabrest.ohnice.app)
└── docs/                   # Documentação do projeto
```

## Desenvolvimento

```bash
pnpm install          # Instalar dependências
pnpm run lint         # Verificar código com Biome
pnpm run lint:fix     # Corrigir problemas de lint automaticamente
pnpm run format       # Formatar código
pnpm run ci           # Executar CI completo (validate + lint)
```

## Recursos Promocionais

As imagens promocionais da Chrome Web Store estão em `assets/` como arquivos fonte SVG.

```bash
./scripts/generate-promo-images.sh   # Gerar arquivos PNG
```

## Privacidade

- Sem coleta de dados
- Sem servidores externos
- Todas as configurações armazenadas localmente
- Veja a [Política de Privacidade](docs/privacy-policy.md)

## Apoie o Projeto

Se você achar esta extensão útil, considere apoiar o seu desenvolvimento:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Apoiar-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Apoiar-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Apoiar-ae2070)](https://me.momo.vn/khuong)

## Outros Projetos

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - Extensão entre navegadores que aprimora a interface do GitHub com funcionalidades de produtividade
- [Termote](https://github.com/lamngockhuong/termote) - Ferramentas CLI de controle remoto (Claude Code, GitHub Copilot, qualquer terminal) a partir de dispositivos móveis/desktop via PWA

## Licença

MIT
