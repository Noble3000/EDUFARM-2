// Generates the iOS AppIcon.appiconset from our 1024 master icon.
// Run: node web/scripts/make-ios-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, downscale, encodePng } from "./png.mjs";

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..");
const SET = join(WEB, "ios", "App", "Assets.xcassets", "AppIcon.appiconset");
mkdirSync(SET, { recursive: true });

const master = decodePng(readFileSync(join(WEB, "public", "icons", "icon-1024.png")));
if (master.width !== 1024) throw new Error("master must be 1024");

// [points, scale, idiom, filename]
const SIZES = [
  [20, 2, "iphone", "AppIcon-20@2x.png"],
  [20, 3, "iphone", "AppIcon-20@3x.png"],
  [29, 2, "iphone", "AppIcon-29@2x.png"],
  [29, 3, "iphone", "AppIcon-29@3x.png"],
  [40, 2, "iphone", "AppIcon-40@2x.png"],
  [40, 3, "iphone", "AppIcon-40@3x.png"],
  [60, 2, "iphone", "AppIcon-60@2x.png"],
  [60, 3, "iphone", "AppIcon-60@3x.png"],
  [20, 1, "ipad", "AppIcon-20@1x.png"],
  [29, 1, "ipad", "AppIcon-29@1x.png"],
  [40, 1, "ipad", "AppIcon-40@1x.png"],
  [76, 1, "ipad", "AppIcon-76@1x.png"],
  [76, 2, "ipad", "AppIcon-76@2x.png"],
  [83.5, 2, "ipad", "AppIcon-83.5@2x.png"],
  [1024, 1, "ios-marketing", "AppIcon-1024.png"],
];

const images = [];
for (const [pt, scale, idiom, file] of SIZES) {
  const pxSize = Math.round(pt * scale);
  const px = downscale(master.px, 1024, pxSize);
  writeFileSync(join(SET, file), encodePng(pxSize, pxSize, px));
  images.push({ size: `${pt}x${pt}`, idiom, filename: file, scale: `${scale}x` });
  console.log(`wrote ${file} (${pxSize}px)`);
}

const contents = { images, info: { version: 1, author: "xcode" } };
writeFileSync(join(SET, "Contents.json"), JSON.stringify(contents, null, 2));
console.log("wrote Contents.json");
