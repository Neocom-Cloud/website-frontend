/**
 * Renders a vector brand asset to a raster social preview image.
 *
 * Open Graph and Twitter cards accept JPEG, GIF and PNG. SVG is not in either
 * contract, so a crawler handed an `og:image` that points at one may show no
 * preview at all. The site's artwork is SVG-first by policy, so the vectors
 * stay authoritative and this script derives the raster copies that only the
 * crawlers consume.
 *
 * The asset is drawn onto an opaque square, because transparency is rendered
 * as black by several link-preview clients.
 *
 * Rendering runs in headless Chromium so the repository needs no native image
 * dependency.
 *
 * Usage: node scripts/rasterize-social-image.mjs <source.svg> <output.jpg> [background]
 */

import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { chromium } from "@playwright/test";

/** Square edge in pixels. A `summary` card only needs to stay above 144. */
const SIZE = 640;
const QUALITY = 0.92;
/** The light ground the design model uses behind the brand marks. */
const DEFAULT_BACKGROUND = "#f4f1ea";

const MEDIA_TYPES = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

async function rasterize(sourcePath, outputPath, background) {
  const source = await readFile(sourcePath);
  const mediaType = MEDIA_TYPES[extname(sourcePath).toLowerCase()];

  if (!mediaType) {
    throw new Error(`Unsupported source type: ${sourcePath}`);
  }

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    const encoded = await page.evaluate(
      async ({ dataUrl, size, background, quality }) => {
        const image = new Image();
        image.src = dataUrl;
        await image.decode();

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext("2d");
        context.fillStyle = background;
        context.fillRect(0, 0, size, size);
        context.imageSmoothingQuality = "high";

        // Contain the artwork in the square without distorting it.
        const scale = size / Math.max(image.width, image.height);
        const width = image.width * scale;
        const height = image.height * scale;

        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);

        return canvas.toDataURL("image/jpeg", quality);
      },
      {
        dataUrl: `data:${mediaType};base64,${source.toString("base64")}`,
        size: SIZE,
        background,
        quality: QUALITY
      }
    );

    await writeFile(outputPath, Buffer.from(encoded.split(",")[1], "base64"));
  } finally {
    await browser.close();
  }
}

const [sourcePath, outputPath, background = DEFAULT_BACKGROUND] = process.argv.slice(2);

if (!sourcePath || !outputPath) {
  console.error(
    "Usage: node scripts/rasterize-social-image.mjs <source.svg> <output.jpg> [background]"
  );
  process.exitCode = 1;
} else {
  await rasterize(sourcePath, outputPath, background);

  const { size } = await readFile(outputPath).then((buffer) => ({ size: buffer.length }));

  console.log(`${outputPath} — ${SIZE}x${SIZE}, ${(size / 1024).toFixed(0)} KB on ${background}`);
}
