/**
 * Removes a solid black frame baked into a raster icon and re-exports it.
 *
 * `Icon_NeoHealth_Concept.png` shipped as a 1254x1254 fully opaque image whose
 * rounded tile sits inside a ~78px band of pure black. On a light surface that
 * band reads as a black square around the icon. There is no source SVG, so the
 * frame is removed from the pixels instead.
 *
 * A flood fill from the image border clears every connected near-black pixel,
 * which follows the tile's corner radius exactly and leaves dark pixels inside
 * the artwork untouched. The result is cropped to the tile and written twice:
 *
 *   .webp  full resolution, transparent corners, used on the page
 *   .jpg   downscaled and flattened onto the tile's own colour, used as the
 *          og:image, because several link-preview crawlers render transparency
 *          as black and a lossless export of a gradient is needlessly large
 *
 * Decoding and encoding run in headless Chromium so the repository needs no
 * native image dependency.
 *
 * Usage: node scripts/crop-icon-frame.mjs <source.png> <output-basename>
 */

import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

/** A pixel counts as frame when every channel is at or below this value. */
const BLACK_THRESHOLD = 14;
const WEBP_QUALITY = 0.9;
/** og:image only needs to survive a crawler's thumbnail, not the page. */
const SOCIAL_SIZE = 640;
const SOCIAL_QUALITY = 0.92;

async function cropIconFrame(sourcePath, outputBase) {
  const source = await readFile(sourcePath);
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    const result = await page.evaluate(runInPage, {
      dataUrl: `data:image/png;base64,${source.toString("base64")}`,
      threshold: BLACK_THRESHOLD,
      quality: WEBP_QUALITY,
      socialSize: SOCIAL_SIZE,
      socialQuality: SOCIAL_QUALITY
    });

    await writeFile(`${outputBase}.webp`, decode(result.webp));
    await writeFile(`${outputBase}.jpg`, decode(result.social));

    return result;
  } finally {
    await browser.close();
  }
}

function decode(dataUrl) {
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

/* eslint-env browser */
async function runInPage({ dataUrl, threshold, quality, socialSize, socialQuality }) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const source = document.createElement("canvas");
  source.width = image.width;
  source.height = image.height;

  const sourceContext = source.getContext("2d");
  sourceContext.drawImage(image, 0, 0);

  const pixels = sourceContext.getImageData(0, 0, source.width, source.height);
  const { data, width, height } = pixels;
  const isFrame = (index) =>
    data[index] <= threshold && data[index + 1] <= threshold && data[index + 2] <= threshold;

  // Flood fill inward from every border pixel, clearing connected frame pixels.
  const seen = new Uint8Array(width * height);
  const stack = [];

  for (let x = 0; x < width; x += 1) {
    stack.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    stack.push(y * width, y * width + width - 1);
  }

  while (stack.length > 0) {
    const position = stack.pop();

    if (seen[position]) {
      continue;
    }

    seen[position] = 1;

    if (!isFrame(position * 4)) {
      continue;
    }

    data[position * 4 + 3] = 0;

    const x = position % width;
    const y = (position - x) / width;

    if (x > 0) stack.push(position - 1);
    if (x < width - 1) stack.push(position + 1);
    if (y > 0) stack.push(position - width);
    if (y < height - 1) stack.push(position + width);
  }

  // Bounding box of what survived.
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] === 0) {
        continue;
      }

      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }

  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;

  sourceContext.putImageData(pixels, 0, 0);

  const cropped = document.createElement("canvas");
  cropped.width = cropWidth;
  cropped.height = cropHeight;
  cropped
    .getContext("2d")
    .drawImage(source, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  // Tile colour, sampled just inside the left edge at mid height.
  const sample = sourceContext.getImageData(left + 6, top + (cropHeight >> 1), 1, 1).data;
  const tileColour = `rgb(${sample[0]}, ${sample[1]}, ${sample[2]})`;

  const scale = Math.min(1, socialSize / Math.max(cropWidth, cropHeight));
  const flattened = document.createElement("canvas");
  flattened.width = Math.round(cropWidth * scale);
  flattened.height = Math.round(cropHeight * scale);

  const flattenedContext = flattened.getContext("2d");
  flattenedContext.imageSmoothingQuality = "high";
  flattenedContext.fillStyle = tileColour;
  flattenedContext.fillRect(0, 0, flattened.width, flattened.height);
  flattenedContext.drawImage(cropped, 0, 0, flattened.width, flattened.height);

  return {
    frame: { left, top, right, bottom },
    size: [cropWidth, cropHeight],
    tileColour,
    socialSize: [flattened.width, flattened.height],
    webp: cropped.toDataURL("image/webp", quality),
    social: flattened.toDataURL("image/jpeg", socialQuality)
  };
}

const [sourcePath, outputBase] = process.argv.slice(2);

if (!sourcePath || !outputBase) {
  console.error("Usage: node scripts/crop-icon-frame.mjs <source.png> <output-basename>");
  process.exitCode = 1;
} else {
  const result = await cropIconFrame(sourcePath, outputBase);

  console.log(
    `Cropped to ${result.size[0]}x${result.size[1]} from [${result.frame.left}, ${result.frame.top}] ` +
      `- [${result.frame.right}, ${result.frame.bottom}], tile ${result.tileColour}, ` +
      `og:image ${result.socialSize[0]}x${result.socialSize[1]}`
  );
}
