export function instrumentAssetUrl(path) {
  return new URL(`../../../assets/${path}`, import.meta.url).href;
}

export function instrumentTemplateUrl(path) {
  return new URL(`../../templates/${path}`, import.meta.url).href;
}

export function applyInstrumentAssetUrls(root) {
  root.querySelectorAll("[data-instrument-asset]").forEach((element) => {
    element.src = instrumentAssetUrl(element.dataset.instrumentAsset);
  });
}
