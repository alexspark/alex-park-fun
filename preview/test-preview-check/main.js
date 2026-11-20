// Entry point. This is an ES module. Import other files with relative paths, for example:
//   import { thing } from "./thing.js";

const status = document.getElementById("status");
if (location.pathname.includes("/preview/")) {
  status.textContent = "This is a branch preview.";
}
