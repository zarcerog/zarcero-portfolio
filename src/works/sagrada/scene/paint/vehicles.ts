// Painted flats for things that move or stand about: the tram of 1926, the
// Popemobile of 2026, and the timber derricks of Gaudí's builders.

import { font } from "@/stage3d/lib/fonts";

import { ball, circle, ink, Sheet, text } from "./kit";

export const TRAM = { w: 1.3, h: 0.95 };

/** A Barcelona tram of the 1920s, side on: mustard and cream, lit within. */
export function tram(s: Sheet) {
  const c = s.c;
  const g = s.g;
  const L = 1.1;
  const y0 = 0.07;
  const body = 0.3;
  // the bogie and wheels
  c.fillStyle = "#1c1a18";
  c.fillRect(-L / 2 + 0.08, y0 - 0.03, L - 0.16, 0.06);
  for (const x of [-0.36, -0.22, 0.22, 0.36]) {
    circle(c, x, y0, 0.055);
    c.fillStyle = "#2a2622";
    c.fill();
    circle(c, x, y0, 0.018);
    c.fillStyle = "#8a8a84";
    c.fill();
  }
  // lower panels, mustard with a red line
  c.fillStyle = "#d9a23a";
  c.fillRect(-L / 2, y0 + 0.04, L, body * 0.45);
  c.fillStyle = "#a8322a";
  c.fillRect(-L / 2, y0 + 0.04 + body * 0.42, L, 0.012);
  // upper, cream, with arched windows
  c.fillStyle = "#f2e6c8";
  c.fillRect(-L / 2 + 0.04, y0 + 0.04 + body * 0.45, L - 0.08, body * 0.55);
  const wy = y0 + 0.04 + body * 0.5;
  for (let k = 0; k < 7; k++) {
    const x = -L / 2 + 0.12 + k * ((L - 0.24) / 6.5);
    c.fillStyle = "#3a2c22";
    c.beginPath();
    c.roundRect(x, wy, 0.1, 0.12, [0.03, 0.03, 0, 0]);
    c.fill();
    g.fillStyle = "rgba(255,215,150,1)";
    g.beginPath();
    g.roundRect(x, wy, 0.1, 0.12, [0.03, 0.03, 0, 0]);
    g.fill();
    // passengers, in silhouette
    if (k % 2 === 0) {
      c.fillStyle = "#1c1612";
      circle(c, x + 0.05, wy + 0.06, 0.018);
      c.fill();
      c.fillRect(x + 0.03, wy, 0.04, 0.04);
    }
  }
  // the open platforms at each end, with brass rails
  for (const side of [-1, 1]) {
    const x = side * (L / 2 + 0.05);
    c.strokeStyle = "#c9a13a";
    c.lineWidth = 0.008;
    c.beginPath();
    c.moveTo(x - 0.05, y0 + 0.05);
    c.lineTo(x - 0.05, y0 + 0.2);
    c.lineTo(x + 0.05, y0 + 0.2);
    c.lineTo(x + 0.05, y0 + 0.05);
    c.stroke();
    c.fillStyle = "#2a2622";
    c.fillRect(x - 0.07, y0 + 0.04, 0.14, 0.02);
  }
  // roof and clerestory
  c.fillStyle = "#6a3b2a";
  c.beginPath();
  c.moveTo(-L / 2 - 0.12, y0 + 0.04 + body);
  c.quadraticCurveTo(0, y0 + 0.08 + body + 0.06, L / 2 + 0.12, y0 + 0.04 + body);
  c.lineTo(L / 2 + 0.12, y0 + 0.07 + body);
  c.lineTo(-L / 2 - 0.12, y0 + 0.07 + body);
  c.closePath();
  c.fill();
  c.fillStyle = "#f2e6c8";
  c.fillRect(-L * 0.3, y0 + 0.1 + body, L * 0.6, 0.04);
  // the destination board
  c.fillStyle = "#1c1a18";
  c.fillRect(-0.24, y0 + 0.15 + body, 0.48, 0.07);
  text(c, "SAGRADA FAMÍLIA", 0, y0 + 0.185 + body, 0.045, (px) => font.sans(600, px), "#f4e6c2");
  // the trolley pole up to the wire
  c.strokeStyle = "#1c1a18";
  c.lineWidth = 0.01;
  c.beginPath();
  c.moveTo(-0.1, y0 + 0.2 + body);
  c.lineTo(0.3, TRAM.h - 0.02);
  c.stroke();
  c.beginPath();
  c.rect(-L / 2, y0 + 0.04, L, body);
  ink(c, "#2a1a10", s.px * 1.4);
  g.fillStyle = "rgba(255,230,180,1)";
  g.fillRect(-0.24, y0 + 0.15 + body, 0.48, 0.07);
}

export const POPEMOBILE = { w: 0.95, h: 0.62 };

/** The Popemobile, side on: white, a glass room on the back, a small white wave. */
export function popemobile(s: Sheet) {
  const c = s.c;
  const g = s.g;
  const y0 = 0.07;
  for (const x of [-0.28, 0.28]) {
    circle(c, x, y0, 0.07);
    c.fillStyle = "#1c1c1e";
    c.fill();
    circle(c, x, y0, 0.03);
    c.fillStyle = "#b8bcc2";
    c.fill();
  }
  // the body
  c.fillStyle = "#f7f7f5";
  c.beginPath();
  c.moveTo(-0.44, y0 + 0.03);
  c.lineTo(-0.44, y0 + 0.2);
  c.lineTo(-0.3, y0 + 0.22);
  c.lineTo(-0.18, y0 + 0.32);
  c.lineTo(0.02, y0 + 0.32);
  c.lineTo(0.04, y0 + 0.2);
  c.lineTo(0.44, y0 + 0.2);
  c.lineTo(0.44, y0 + 0.03);
  c.closePath();
  c.fill();
  ink(c, "#5a5a60", s.px * 1.4);
  c.fillStyle = "#2c3440";
  c.beginPath();
  c.moveTo(-0.28, y0 + 0.21);
  c.lineTo(-0.18, y0 + 0.3);
  c.lineTo(-0.02, y0 + 0.3);
  c.lineTo(-0.02, y0 + 0.21);
  c.closePath();
  c.fill();
  // the glass room
  c.fillStyle = "rgba(190,215,235,0.55)";
  c.fillRect(0.06, y0 + 0.2, 0.36, 0.3);
  c.strokeStyle = "#dfe3e8";
  c.lineWidth = 0.012;
  c.strokeRect(0.06, y0 + 0.2, 0.36, 0.3);
  // inside, a small figure in white, waving
  c.fillStyle = "#ffffff";
  c.fillRect(0.2, y0 + 0.2, 0.08, 0.16);
  circle(c, 0.24, y0 + 0.4, 0.03);
  c.fillStyle = "#f0cfb4";
  c.fill();
  c.fillStyle = "#ffffff";
  circle(c, 0.24, y0 + 0.425, 0.022);
  c.fill();
  c.strokeStyle = "#ffffff";
  c.lineWidth = 0.02;
  c.beginPath();
  c.moveTo(0.27, y0 + 0.33);
  c.lineTo(0.32, y0 + 0.44);
  c.stroke();
  g.fillStyle = "rgba(255,248,230,1)";
  g.fillRect(0.06, y0 + 0.2, 0.36, 0.3);
  // yellow and white pennants
  for (const x of [-0.4, 0.4]) {
    c.fillStyle = "#e9c23a";
    c.fillRect(x, y0 + 0.2, 0.03, 0.05);
    c.fillStyle = "#ffffff";
    c.fillRect(x + 0.03, y0 + 0.2, 0.03, 0.05);
  }
  // headlamps
  g.fillStyle = "rgba(255,255,230,1)";
  circle(g, -0.43, y0 + 0.14, 0.03);
  g.fill();
}

export const DERRICK = { w: 3.6, h: 7.8 };

/** A timber derrick: mast, boom, guys, a pulley and a block of stone on a rope. */
export function derrick(s: Sheet) {
  const c = s.c;
  const wood = (x0: number, y0: number, x1: number, y1: number, w: number) => {
    c.strokeStyle = "#6b4a2c";
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
    c.strokeStyle = "rgba(255,220,170,0.35)";
    c.lineWidth = w * 0.3;
    c.beginPath();
    c.moveTo(x0 - w * 0.2, y0);
    c.lineTo(x1 - w * 0.2, y1);
    c.stroke();
  };
  // guy ropes
  c.strokeStyle = "rgba(60,45,30,0.8)";
  c.lineWidth = 0.015;
  c.beginPath();
  c.moveTo(0, 7.4);
  c.lineTo(-1.75, 0);
  c.moveTo(0, 7.4);
  c.lineTo(1.75, 0);
  c.stroke();
  wood(0, 0, 0, 7.5, 0.12);
  // the boom, raised
  wood(0.05, 0.6, 1.5, 5.8, 0.09);
  c.strokeStyle = "rgba(60,45,30,0.9)";
  c.lineWidth = 0.014;
  c.beginPath();
  c.moveTo(0, 7.3);
  c.lineTo(1.5, 5.8);
  c.moveTo(1.5, 5.8);
  c.lineTo(1.5, 3.1);
  c.stroke();
  ball(c, 1.5, 5.8, 0.07, "#8a8a84");
  // the block of stone, dangling
  c.fillStyle = "#d9c29a";
  c.fillRect(1.28, 2.7, 0.44, 0.36);
  c.strokeStyle = "#4a3626";
  c.lineWidth = s.px * 1.4;
  c.strokeRect(1.28, 2.7, 0.44, 0.36);
  // the winch at the foot
  c.fillStyle = "#4a3222";
  c.fillRect(-0.35, 0, 0.7, 0.3);
  circle(c, 0, 0.35, 0.18);
  c.fillStyle = "#6b4a2c";
  c.fill();
}
