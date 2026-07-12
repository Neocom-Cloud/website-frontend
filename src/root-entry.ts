import "./styles/global.css";
import { getRootRedirectPath } from "./lib/locale";

const shell = document.getElementById("locale-shell");
const nextPath = getRootRedirectPath(new URL(window.location.href));

if (shell) {
  shell.setAttribute("data-ready", "true");
}

window.location.replace(nextPath);

