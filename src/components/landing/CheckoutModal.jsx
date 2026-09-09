import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { handleCheckout } from "../../lib/checkout.js";
import { ReserveButton } from "./ReserveButton.jsx";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  promoCode: "",
};

function validateCheckoutFields({ name, email, phone }) {
  if (name.trim().length < 2) return "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Please enter a valid email.";
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return "Please enter a valid phone number.";
  }
  return "";
}

export function CheckoutModal({ plan, onClose }) {
  const titleId = useId();
  const nameRef = useRef(null);
  const busyRef = useRef(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  busyRef.current = busy;

  useEffect(() => {
    nameRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape" && !busyRef.current) onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const validationError = validateCheckoutFields(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      await handleCheckout(plan.plan, form);
    } catch (err) {
      setError(err.message || "Checkout is unavailable right now. Please try again shortly.");
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-forest-deep/45 backdrop-blur-[2px]"
        aria-label="Close checkout"
        onClick={() => {
          if (!busyRef.current) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-[440px] rounded-[22px] border border-cream/80 bg-cream-warm p-6 shadow-[0_24px_50px_rgba(24,55,47,0.22)] sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 rounded-md p-1 text-forest-deep/45 hover:text-forest-deep disabled:opacity-50"
          aria-label="Close"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <p className="text-[0.72rem] font-bold tracking-[0.16em] text-forest-deep/70">
          {plan.label}
        </p>
        <h2 id={titleId} className="mt-2 font-serif text-[2rem] font-semibold leading-none text-forest-deep">
          Reserve {plan.price}
        </h2>
        <p className="mt-3 text-sm leading-6 text-forest-deep/70">
          Tell us how to reach you, then continue to secure checkout.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field
            inputRef={nameRef}
            label="Full name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={updateField}
            disabled={busy}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={updateField}
            disabled={busy}
          />
          <Field
            label="Phone number"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={updateField}
            disabled={busy}
          />
          <Field
            label="Promo code"
            name="promoCode"
            autoComplete="off"
            value={form.promoCode}
            onChange={updateField}
            disabled={busy}
            optional
          />

          {error ? (
            <p className="text-[0.85rem] leading-5 text-[#8a3b2b]" role="alert">
              {error}
            </p>
          ) : null}

          <ReserveButton
            type="submit"
            variant={plan.featured ? "gold" : "forest"}
            className="mt-2 w-full"
          >
            {busy ? "Redirecting…" : "Continue to payment"}
          </ReserveButton>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  value,
  onChange,
  disabled,
  optional = false,
  inputRef,
}) {
  const id = useId();
  return (
    <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-forest-deep/50" htmlFor={id}>
      <span className="flex items-center justify-between">
        {label}
        {optional ? <span className="font-medium normal-case tracking-normal text-forest-deep/40">Optional</span> : null}
      </span>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-1.5 w-full rounded-xl border border-[#e0d8c8] bg-white px-3 py-2.5 text-[0.95rem] font-normal normal-case tracking-normal text-forest-deep outline-none placeholder:text-forest-deep/30 focus:border-forest disabled:opacity-70"
      />
    </label>
  );
}
