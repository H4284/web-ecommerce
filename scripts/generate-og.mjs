import fs from "node:fs";
import sharp from "sharp";

const width = 1200;
const height = 630;

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5f7f9"/>
      <stop offset="100%" stop-color="#e8ecf0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect x="0" y="0" width="18" height="100%" fill="#6d5a3d"/>
  <text x="96" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="96" fill="#12161c">Sanem</text>
  <text x="96" y="360" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="#6d5a3d">Quiet luxury in a bottle</text>
  <text x="96" y="540" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#5a6270">Prishtinë · Kosovo</text>
</svg>`);

const info = await sharp(svg).png().toFile("public/og.png");
console.log("og.png", info);
if (fs.existsSync("public/og-REPLACE.txt")) {
  fs.unlinkSync("public/og-REPLACE.txt");
}
