import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateStaticFiles } from "./static-site.mjs";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFile);

await generateStaticFiles(resolve(currentDirectory, ".."));
