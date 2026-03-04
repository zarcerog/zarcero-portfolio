/**
 * Waveform — Canvas 2D sine wave controller
 * Exposed properties are GSAP-tweeneable via a plain object.
 *
 * Usage:
 *   const wv = createWaveform(canvasEl)
 *   gsap.to(wv.state, { amplitude: 1, duration: 1 })
 *   wv.start()   // begin render loop
 *   wv.stop()    // halt render loop
 *   wv.destroy() // cleanup
 */

export interface WaveformState {
  amplitude: number; // 0–1, controls wave height
  frequency: number; // cycles across canvas width
  speed: number;     // animation speed
  opacity: number;   // canvas opacity
  color: string;     // stroke color
}

export interface WaveformController {
  state: WaveformState;
  start: () => void;
  stop: () => void;
  destroy: () => void;
}

export function createWaveform(canvas: HTMLCanvasElement): WaveformController {
  const ctx = canvas.getContext("2d")!;
  let rafId: number | null = null;
  let phase = 0;

  const state: WaveformState = {
    amplitude: 0.15,
    frequency: 2.5,
    speed: 0.8,
    opacity: 0.08,
    color: "#FF2D00",
  };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function render() {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const amp = (height * 0.5) * state.amplitude;
    const centerY = height * 0.5;

    ctx.beginPath();
    ctx.strokeStyle = state.color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = state.opacity;

    for (let x = 0; x <= width; x += 2) {
      const t = (x / width) * Math.PI * 2 * state.frequency;
      const y = centerY + Math.sin(t + phase) * amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Second harmonic at half opacity — richer waveform texture
    ctx.beginPath();
    ctx.globalAlpha = state.opacity * 0.5;
    for (let x = 0; x <= width; x += 2) {
      const t = (x / width) * Math.PI * 2 * (state.frequency * 2);
      const y = centerY + Math.sin(t + phase * 1.5) * (amp * 0.4);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    phase += 0.012 * state.speed;
    rafId = requestAnimationFrame(render);
  }

  function start() {
    resize();
    window.addEventListener("resize", resize);
    if (!rafId) render();
  }

  function stop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function destroy() {
    stop();
    window.removeEventListener("resize", resize);
  }

  return { state, start, stop, destroy };
}
