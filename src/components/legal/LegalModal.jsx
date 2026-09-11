import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { legalDocuments } from "../../config/legal.js";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function LegalLink({ documentKey, className, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(true);
        }}
      >
        {children}
      </button>
      {isOpen ? (
        <LegalModal document={legalDocuments[documentKey]} onClose={() => setIsOpen(false)} />
      ) : null}
    </>
  );
}

function LegalModal({ document: legalDocument, onClose }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-forest-deep/60 backdrop-blur-[2px]"
        aria-label={`Close ${legalDocument.title}`}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex max-h-[min(88svh,760px)] w-full max-w-[680px] flex-col overflow-hidden rounded-[22px] border border-cream/70 bg-cream-warm shadow-[0_24px_60px_rgba(16,35,30,0.32)]"
      >
        <header className="shrink-0 border-b border-forest-deep/10 px-5 py-5 pr-14 sm:px-8 sm:py-6 sm:pr-16">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-forest-deep/50">
            HomeOps Inc.
          </p>
          <h2 id={titleId} className="mt-1 font-serif text-[2rem] font-semibold leading-none text-forest-deep sm:text-[2.35rem]">
            {legalDocument.title}
          </h2>
          <p className="mt-2 text-xs text-forest-deep/55">
            Effective {legalDocument.effectiveDate}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-forest-deep/50 transition-colors hover:bg-forest-deep/5 hover:text-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:right-6 sm:top-6"
            aria-label={`Close ${legalDocument.title}`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="overscroll-contain overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
          <p id={descriptionId} className="text-[0.94rem] leading-7 text-ink">
            {legalDocument.intro}
          </p>
          <div className="mt-7 space-y-7">
            {legalDocument.sections.map((section) => (
              <section key={section.heading}>
                <h3 className="font-serif text-[1.3rem] font-bold leading-tight text-forest-deep">
                  {section.heading}
                </h3>
                <div className="mt-2 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-[0.9rem] leading-6 text-ink/90">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-forest-deep/10 bg-cream px-5 py-3 text-right sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-forest-deep px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
