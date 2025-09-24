import fs from "fs/promises";
import sharp from "sharp";

const brandBg = "#D97A66"; // terracota
const brandText = "#FFFFFF"; // texto claro

function svgIcon(size, { maskable = false } = {}) {
  const r = Math.round(size * 0.18); // radio de borde redondeado
  const fontSize = Math.round(size * 0.52); // tamaño letra "S"
  // Para maskable, el arte debe ser "full-bleed". Centramos el contenido igual.
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${brandBg}"/>
  <g transform="translate(${size / 2},${size / 2})">
    <text x="0" y="${fontSize / 3}" text-anchor="middle"
      font-family="Poppins, Lato, system-ui, sans-serif"
      font-size="${fontSize}" font-weight="700" fill="${brandText}">
      S
    </text>
  </g>
</svg>
`.trim();
}

async function generate() {
  await fs.mkdir("public/icons", { recursive: true });

  // 192x192
  await sharp(Buffer.from(svgIcon(192)))
    .png()
    .toFile("public/icons/icon-192.png");

  // 512x512
  await sharp(Buffer.from(svgIcon(512)))
    .png()
    .toFile("public/icons/icon-512.png");

  // Maskable 512x512 (mismo arte, válido para "maskable")
  await sharp(Buffer.from(svgIcon(512, { maskable: true })))
    .png()
    .toFile("public/icons/maskable-512.png");

  console.log("✅ Icons escritos en public/icons/");
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
