import { UI_SplashManager } from "./UI_SplashManager.js";
import { instrumentTemplateUrl } from "../util/package_urls.js";

export { UI_InfoManager };

class UI_InfoManager extends UI_SplashManager {
  constructor(url = "", copyright = "") {
    super(
      instrumentTemplateUrl("template_info.html"),
      "info-overlay",
      "PB_info",
      "PB_info_close",
      true,
      false,
    );
    this.url = url;
    this.copyright = copyright;
  }

  async _create_page() {
    this.version = await window.api_app.get_version();
    document.getElementById("info_version").textContent = `v${this.version}`;
    document.getElementById("info_url").textContent = this.url;
    document.getElementById("info_copyright").textContent = this.copyright;
  }
}
