"use client";

import { useEffect, useRef, useState } from "react";

import { PLAYBILL } from "../content";
import { useStage, useStageValue } from "../engine";
import { ACTS as DEFAULT_ACTS, type ActMark } from "../timeline";

function indexAt(acts: ActMark[], t: number) {
  let idx = 0;
  for (let i = 0; i < acts.length; i++) if (t >= acts[i].from - 0.01) idx = i;
  return idx;
}

/** The annunciator: brass placard showing the current act. */
function Annunciator({ acts }: { acts: ActMark[] }) {
  const idx = useStageValue((t) => indexAt(acts, t), 0);
  const act = acts[idx];
  return (
    <div className="th-annunciator" aria-live="polite">
      <span className="th-annunciator__num" key={act.id}>
        {act.numeral}
      </span>
      <span className="th-annunciator__text">
        <em>{act.label}</em>
        <b>{act.title}</b>
      </span>
    </div>
  );
}

function Programme({ open, onClose, acts }: { open: boolean; onClose: () => void; acts: ActMark[] }) {
  const stage = useStage();
  const idx = useStageValue((t) => indexAt(acts, t), 0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    stage.lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>("a,button");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stage.lenis?.start();
    };
  }, [open, onClose, stage]);

  return (
    <div
      className="th-programme"
      data-open={open}
      role="dialog"
      aria-modal="true"
      aria-label="Programme"
      aria-hidden={!open}
      inert={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="th-programme__sheet" ref={panelRef}>
        <button ref={closeRef} type="button" className="th-programme__close" onClick={onClose}>
          Close <span aria-hidden="true">×</span>
        </button>
        <p className="th-programme__house">{PLAYBILL.theatre}</p>
        <p className="th-programme__season">{PLAYBILL.season}</p>
        <h2 className="th-programme__title">Programme</h2>
        <div className="th-rule" aria-hidden="true">
          <span>✦</span>
        </div>
        <ol className="th-programme__list">
          {acts.map((act, i) => (
            <li key={act.id}>
              <button
                type="button"
                data-current={i === idx}
                onClick={() => {
                  onClose();
                  stage.jump(act.goto);
                }}
              >
                <span className="th-programme__num">{act.numeral}</span>
                <span className="th-programme__label">{act.label}</span>
                <span className="th-programme__dots" aria-hidden="true" />
                <span className="th-programme__name">{act.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="th-rule" aria-hidden="true">
          <span>✦</span>
        </div>
        <p className="th-programme__foot">
          <a href={`mailto:${PLAYBILL.email}`}>{PLAYBILL.email}</a>
          <span aria-hidden="true"> · </span>
          <a href={PLAYBILL.archive.href}>Previous production: {PLAYBILL.archive.label} →</a>
        </p>
      </div>
    </div>
  );
}

export function Chrome({ acts = DEFAULT_ACTS }: { acts?: ActMark[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="th-header">
        <button
          type="button"
          className="th-header__programme"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="th-burger" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Programme
        </button>
        <span className="th-header__house">{PLAYBILL.theatre}</span>
        <Annunciator acts={acts} />
      </header>
      <Programme open={open} onClose={() => setOpen(false)} acts={acts} />
    </>
  );
}
