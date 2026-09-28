"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";

import { CREDITS, CREDITS_DISCLAIMER, PLAYBILL } from "../content";
import { useOnStage, useStage, useTick } from "../engine";
import { easeBack, easeIn, envelope, lerp, seg } from "../motion";
import { cueSound } from "../sound/bus";
import { telegraphese } from "../telegraph";
import { CUES } from "../timeline";

export function Telegram() {
  const wrap = useRef<HTMLElement>(null);
  const form = useRef<HTMLDivElement>(null);
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const C = CUES.act5;
  const [inA, inB] = C.setIn;
  const [outA, outB] = C.setOut;
  useOnStage(wrap, inA - 0.01, outB + 0.01);
  useTick(inA - 0.01, outB + 0.01, (t) => {
    let y: number;
    if (t < inB) y = lerp(112, 0, easeBack(seg(t, inA, inB)));
    else if (t < outA) y = 0;
    else y = lerp(0, 112, easeIn(seg(t, outA, outB)));
    if (form.current) form.current.style.transform = `translateY(${y.toFixed(2)}%)`;
  });

  const body = useMemo(() => {
    const m = telegraphese(message || "Have a project in mind. Would like to talk.");
    return m.endsWith("STOP") ? m : `${m} STOP`;
  }, [message]);

  const href = useMemo(() => {
    const subject = `TELEGRAM${from ? ` FROM ${from.toUpperCase()}` : ""} — via zarcerog.com`;
    const text = `${body}\n\n— ${from || "A member of the audience"}`;
    return `mailto:${PLAYBILL.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  }, [from, body]);

  const words = body.split(" ").filter((w) => w && w !== "STOP").length;

  return (
    <section className="th-scene th-telegram" ref={wrap} aria-label="Act V: the stage door">
      <div className="th-stagedoor" aria-hidden="true">
        <span>Stage Door</span>
      </div>
      <div className="th-trap">
        <div className="th-telegram__paper" ref={form}>
          <div className="th-telegram__head">
            <p className="th-telegram__brand">Telegram</p>
            <p className="th-telegram__meta">
              <span>Via Stage Door</span>
              <span>Nº {String(words).padStart(3, "0")}</span>
              <span>Urgent</span>
            </p>
          </div>
          <div className="th-telegram__row">
            <span className="th-telegram__label">To</span>
            <span className="th-telegram__value">NICOLÁS ZARCERO · {PLAYBILL.email.toUpperCase()}</span>
          </div>
          <label className="th-telegram__row">
            <span className="th-telegram__label">From</span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              maxLength={60}
            />
          </label>
          <label className="th-telegram__row th-telegram__row--msg">
            <span className="th-telegram__label">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Have a project in mind. Would like to talk."
              rows={3}
              maxLength={600}
              data-lenis-prevent
            />
          </label>
          <p className="th-telegram__preview" aria-live="polite">
            <span className="th-telegram__label">As transmitted</span>
            <span className="th-telegram__tape">{body}</span>
          </p>
          <div className="th-telegram__foot">
            <a className="th-button th-button--ink" href={href} onClick={() => cueSound("telegraph")}>
              Send by telegraph <span aria-hidden="true">→</span>
            </a>
            <p className="th-telegram__reply">Replies within 24–48 hours, weather permitting.</p>
            <div className="th-stamps" aria-label="Elsewhere">
              {PLAYBILL.socials.map((s) => (
                <a key={s.href} className="th-stamp" href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                  <span className="th-stamp__inner">
                    <span className="th-stamp__short">{s.short}</span>
                    <span className="th-stamp__label">{s.label}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CurtainCall() {
  const bow = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  const credits = useRef<HTMLDivElement>(null);
  const fin = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useStage();
  const F = CUES.finale;
  useOnStage(wrap, F.curtainClose[1] - 0.2, 1e6);

  useTick(F.curtainClose[1] - 0.2, 1e6, (t) => {
    // the bow
    const on = envelope(t, F.bows[0], F.bows[0] + 0.35, F.credits[0] + 0.2, F.credits[0] + 0.7);
    const dip = Math.max(0, Math.sin(seg(t, F.bows[0] + 0.35, F.bows[1]) * Math.PI));
    if (bow.current) {
      bow.current.style.opacity = on.toFixed(3);
      bow.current.style.transform = `translate(-50%, -50%) translateY(${(dip * 5).toFixed(2)}%) rotate(${(dip * 4).toFixed(2)}deg) scale(${lerp(0.9, 1, on).toFixed(3)})`;
    }
    if (spot.current) spot.current.style.opacity = on.toFixed(3);

    // the roll
    const p = seg(t, F.credits[0], F.credits[1]);
    if (credits.current) {
      credits.current.style.transform = `translate(-50%, calc(${p.toFixed(4)} * (-100cqh - 100%)))`;
    }
    // fin
    const f = seg(t, F.fin[0], F.fin[1]);
    if (fin.current) {
      fin.current.style.opacity = f.toFixed(3);
      fin.current.style.transform = `translate(-50%, -50%) scale(${lerp(0.94, 1, f).toFixed(3)})`;
      fin.current.style.pointerEvents = f > 0.5 ? "auto" : "none";
    }
  });

  return (
    <div className="th-callcurtain" ref={wrap}>
      <div className="th-spot th-spot--bow" ref={spot} aria-hidden="true" />
      <div className="th-bow" ref={bow} aria-hidden="true">
        <div className="th-oval th-oval--small">
          <Image src="/theatre/nico.webp" alt="" width={640} height={640} sizes="160px" />
        </div>
        <p>The company takes a bow</p>
      </div>
      <div className="th-credits" ref={credits}>
        <p className="th-credits__house">{PLAYBILL.theatre}</p>
        <p className="th-credits__title">{PLAYBILL.title}</p>
        {CREDITS.map((c) => (
          <div key={c.role} className="th-credits__block">
            <p className="th-credits__role">{c.role}</p>
            {c.names.map((n) => (
              <p key={n} className="th-credits__name">
                {n}
              </p>
            ))}
          </div>
        ))}
        <p className="th-credits__disclaimer">{CREDITS_DISCLAIMER}</p>
        <p className="th-credits__copy">© {new Date().getFullYear()} {PLAYBILL.name}</p>
      </div>
      <div className="th-fin" ref={fin}>
        <p className="th-fin__word">Fin.</p>
        <div className="th-rule" aria-hidden="true">
          <span>✦</span>
        </div>
        <div className="th-fin__actions">
          <button type="button" className="th-button" onClick={() => stage.jump(0)}>
            <span aria-hidden="true">↑</span> Encore
          </button>
          <a className="th-button th-button--ghost" href={`mailto:${PLAYBILL.email}`}>
            Write to the stage door
          </a>
        </div>
        <a className="th-fin__archive" href={PLAYBILL.archive.href}>
          <span className="th-fin__archive-img">
            <Image src="/theatre/archive.webp" alt="" width={1400} height={838} sizes="140px" />
          </span>
          <span>
            <em>Previous production</em>
            <b>
              {PLAYBILL.archive.label} · {PLAYBILL.archive.year} →
            </b>
          </span>
        </a>
      </div>
    </div>
  );
}
