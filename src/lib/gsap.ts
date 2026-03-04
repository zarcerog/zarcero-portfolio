import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

// Register all plugins once
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

// ─── Branded easing curves ─────────────────────────────────────────
// "Signal out" — fast attack, smooth settle (like a VU meter peak)
CustomEase.create(
  "signal.out",
  "M0,0 C0.126,0.382 0.282,0.674 0.44,0.822 0.632,1.002 0.818,1.001 1,1"
);

// "Signal in" — slow build, sharp arrival
CustomEase.create(
  "signal.in",
  "M0,0 C0.182,-0.001 0.368,0 0.56,0.178 0.718,0.326 0.874,0.618 1,1"
);

export { gsap, ScrollTrigger, SplitText, CustomEase };
