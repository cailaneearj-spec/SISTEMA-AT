// gerar-icones.js — rode com: node gerar-icones.js
const { createCanvas } = require('canvas');
const fs = require('fs');

function gerarIcone(tamanho, caminho) {
  const canvas = createCanvas(tamanho, tamanho);
  const ctx = canvas.getContext('2d');
  const r = tamanho * 0.18;

  // Fundo arredondado
  ctx.fillStyle = '#10141a';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(tamanho - r, 0);
  ctx.quadraticCurveTo(tamanho, 0, tamanho, r);
  ctx.lineTo(tamanho, tamanho - r);
  ctx.quadraticCurveTo(tamanho, tamanho, tamanho - r, tamanho);
  ctx.lineTo(r, tamanho);
  ctx.quadraticCurveTo(0, tamanho, 0, tamanho - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Gradiente do badge AT
  const grad = ctx.createLinearGradient(tamanho * 0.2, tamanho * 0.2, tamanho * 0.8, tamanho * 0.8);
  grad.addColorStop(0, '#4fb0a5');
  grad.addColorStop(1, '#3d9990');
  ctx.fillStyle = grad;
  const bx = tamanho * 0.2, by = tamanho * 0.2, bw = tamanho * 0.6, bh = tamanho * 0.6, br = tamanho * 0.12;
  ctx.beginPath();
  ctx.moveTo(bx + br, by);
  ctx.lineTo(bx + bw - br, by);
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
  ctx.lineTo(bx + bw, by + bh - br);
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
  ctx.lineTo(bx + br, by + bh);
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
  ctx.lineTo(bx, by + br);
  ctx.quadraticCurveTo(bx, by, bx + br, by);
  ctx.closePath();
  ctx.fill();

  // Texto AT
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${tamanho * 0.28}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AT', tamanho / 2, tamanho / 2);

  fs.writeFileSync(caminho, canvas.toBuffer('image/png'));
  console.log('Gerado:', caminho);
}

gerarIcone(192, 'icons/icon-192.png');
gerarIcone(512, 'icons/icon-512.png');
