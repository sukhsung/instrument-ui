# instrument-ui

Shared UI and Electron infrastructure used by `mili` and `vivi`.

This package is intended to live in the private GitHub repository:

```text
git@github.com:sukhsung/instrument-ui.git
```

During local development, `mili` and `vivi` can depend on the sibling checkout:

```json
"instrument-ui": "file:../instrument-ui"
```

For standalone app repositories or CI, switch the dependency to the private GitHub repo after this package has been pushed:

```json
"instrument-ui": "git+ssh://git@github.com/sukhsung/instrument-ui.git#main"
```

The consuming app must provide `serialport` because the shared connection adapters use it as a peer dependency.
