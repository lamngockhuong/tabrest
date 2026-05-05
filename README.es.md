🇬🇧 [English](README.md) • 🇻🇳 [Tiếng Việt](README.vi.md) • 🇪🇸 **Español** • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 [Français](README.fr.md) • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  Dé descanso a sus pestañas, libere su memoria - una extensión de Chrome que descarga automáticamente las pestañas inactivas.
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

- **Descarga automática de pestañas inactivas** - Temporizador de inactividad configurable (5 min a 4 horas)
- **Umbral de memoria** - Descargar cuando el RAM supera el 60-95%
- **Límite de memoria por pestaña** - Descargar pestañas que usen >100 MB-1 GB de JS heap
- **Descarga al inicio** - Liberar memoria cuando se abre el navegador
- **Controles manuales** - Descargar la pestaña actual/izquierda/derecha/otras
- **Cerrar pestañas duplicadas** - Deduplicación con un clic en la ventana actual
- **Búsqueda de pestañas** - Filtrar la lista de pestañas por título o URL
- **Grupos de pestañas** - Descargar grupos de pestañas completos
- **Modo panel lateral** - Abrir TabRest en el panel lateral de Chrome (opcional)
- **Posponer pestañas/sitios** - Proteger temporalmente pestañas o dominios (30 min-2 horas)
- **Aviso antes de descartar** - Notificación en pantalla de 3 s antes del descarte automático
- **Indicador visual** - Prefijo personalizable (💤) en los títulos de las pestañas descartadas
- **Lista blanca** - Proteger sitios del descarte automático (compatible con localhost e IP)
- **Importar/Exportar** - Hacer copia de seguridad de listas blancas, listas negras y sesiones en JSON
- **Sesiones** - Guardar y restaurar conjuntos de pestañas
- **Restaurar posición de desplazamiento** - Restaurar la posición de desplazamiento al recargar pestañas
- **Marca de tiempo de YouTube** - Reanudar videos en la última posición tras recargar
- **Omitir sin conexión** - No descartar pestañas cuando la red no está disponible
- **Modo solo inactivo** - Descargar automáticamente solo cuando el equipo está inactivo
- **Modo de energía** - Perfiles de ahorro de batería, normal o rendimiento
- **Notificaciones de descarga automática** - Recibir notificaciones cuando se descargan pestañas
- **Información sobre herramientas de memoria** - Ver el RAM estimado ahorrado por pestaña al pasar el cursor
- **Asistente de configuración** - Configuración interactiva de varios pasos en el primer inicio
- **Informe de errores opcional** - Informes de fallos anónimos a través de Sentry (desactivado por defecto) y envío manual de errores
- **Apertura automática del registro de cambios** - Abre las notas de la versión en actualizaciones menores/mayores
- **Permisos de host opcionales** - La protección de formularios solo solicita acceso cuando está habilitada
- **Visualización del uso de RAM** - Porcentaje de RAM en tiempo real en la cabecera de la ventana emergente
- **Estadísticas** - Seguimiento de pestañas descargadas y memoria ahorrada
- **Multiidioma** - Compatible con 11 idiomas

## Atajos de teclado

| Atajo         | Acción                            |
| ------------- | --------------------------------- |
| `Alt+Shift+D` | Descargar la pestaña actual       |
| `Alt+Shift+O` | Descargar las otras pestañas      |
| `Alt+Shift+→` | Descargar pestañas a la derecha   |
| `Alt+Shift+←` | Descargar pestañas a la izquierda |

## Instalación

### Desde el código fuente

1. Clone este repositorio
2. Abra `chrome://extensions` en Chrome
3. Active el "Modo desarrollador" (arriba a la derecha)
4. Haga clic en "Cargar descomprimida"
5. Seleccione la carpeta del proyecto

### Desde Chrome Web Store

[Instala TabRest desde Chrome Web Store](https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib).

## Cómo funciona

TabRest utiliza la API nativa `chrome.tabs.discard()` de Chrome para descargar pestañas. Las pestañas descartadas:

- Permanecen visibles en la barra de pestañas
- Conservan su posición de desplazamiento y los datos de formulario
- Se recargan al instante al hacer clic en ellas
- Liberan memoria mientras están inactivas

## Estructura del proyecto

```text
tabrest/
├── manifest.json           # Configuración de la extensión (MV3)
├── _locales/               # Traducciones i18n (en, vi)
├── src/
│   ├── background/         # Módulos del service worker
│   ├── content/            # Form checker, YouTube tracker
│   ├── popup/              # UI de ventana emergente / panel lateral
│   ├── options/            # Página de configuración
│   ├── pages/              # Onboarding, changelog
│   └── shared/             # Utilidades compartidas
├── icons/                  # Iconos de la extensión
├── website/                # Sitio de documentación Astro (tabrest.ohnice.app)
└── docs/                   # Documentación del proyecto
```

## Desarrollo

```bash
pnpm install          # Instalar dependencias
pnpm run lint         # Revisar el código con Biome
pnpm run lint:fix     # Corregir automáticamente los problemas de lint
pnpm run format       # Formatear el código
pnpm run ci           # Ejecutar CI completo (validate + lint)
```

## Recursos promocionales

Las imágenes promocionales de Chrome Web Store se encuentran en `assets/` como fuentes SVG.

```bash
./scripts/generate-promo-images.sh   # Generar archivos PNG
```

## Privacidad

- Sin recopilación de datos
- Sin servidores externos
- Toda la configuración se almacena localmente
- Consulte la [Política de privacidad](docs/privacy-policy.md)

## Patrocinio

Si esta extensión le resulta útil, considere apoyar su desarrollo:

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Support-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Support-ae2070)](https://me.momo.vn/khuong)

## Otros proyectos

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - Extensión multinavegador que mejora la interfaz de GitHub con funciones de productividad
- [Termote](https://github.com/lamngockhuong/termote) - Herramientas CLI de control remoto (Claude Code, GitHub Copilot, cualquier terminal) desde dispositivos móviles/de escritorio a través de PWA

## Licencia

MIT
