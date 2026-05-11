# instrument-ui

Shared UI and Electron infrastructure for instrument control applications.

This package is intended to live in the private GitHub repository:

```text
git@github.com:sukhsung/instrument-ui.git
```

During local development, a consuming Electron app can depend on a sibling checkout:

```json
"instrument-ui": "file:../instrument-ui"
```

For standalone app repositories or CI, switch the dependency to the private GitHub repo after this package has been pushed:

```json
"instrument-ui": "git+ssh://git@github.com/sukhsung/instrument-ui.git#main"
```

The consuming app must provide `serialport` because the shared connection adapters use it as a peer dependency.

Shared renderer assets are available under `src/assets`, and shared renderer templates are loaded package-relative by the exported UI managers.

Common IPC channel groups and preload bridge helpers are exported from `instrument-ui/common/ipcChannels.js` and `instrument-ui/preload/common.js`. Consuming apps can compose their app-specific channel groups with `createIpcChannels()` and then register the shared preload APIs with `registerCommonPreloadApis()`.

Shared renderer CSS is available under `src/renderer/css`. Consuming apps should define their own `--color-brand-*` theme tokens before relying on the shared base, component, and keyboard styles.
