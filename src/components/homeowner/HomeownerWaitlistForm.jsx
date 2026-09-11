import { useEffect, useId, useRef, useState } from "react";
import { buyingTimelines, smsConsentCopy } from "../../config/homeowner.js";
import { registerHousehold } from "../../lib/waitlist.js";
import { BrandLogo } from "../landing/BrandLogo.jsx";
import { HomeownerFooter } from "./HomeownerFooter.jsx";

const emptyForm = {
  email: "",
  phone: "",
  market: "",
  buyingTimeline: "",
  smsConsent: false,
};

function validateWaitlist(form) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Please enter a valid email.";
  }
  if (!form.market.trim()) {
    return "Please enter your market or city.";
  }
  if (!form.buyingTimeline) {
    return "Please choose a buying timeline.";
  }
  if (form.phone.trim() && form.phone.replace(/\D/g, "").length < 10) {
    return "Please enter a valid mobile number.";
  }
  if (form.phone.trim() && !form.smsConsent) {
    return "Please confirm SMS consent to save your mobile number.";
  }
  return "";
}

export function HomeownerWaitlistForm({ sectionRef, emailPrefill, focusToken }) {
  const headingId = useId();
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const busyRef = useRef(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  busyRef.current = busy;

  useEffect(() => {
    if (!emailPrefill) return;
    setForm((current) => ({ ...current, email: emailPrefill }));
  }, [emailPrefill]);

  useEffect(() => {
    if (!focusToken) return;
    const timer = window.setTimeout(() => {
      const next = emailPrefill ? phoneRef.current : emailRef.current;
      next?.focus();
    }, 420);
    return () => window.clearTimeout(timer);
  }, [focusToken, emailPrefill]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (busyRef.current || success || alreadyRegistered) return;

    const validationError = validateWaitlist(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      await registerHousehold(form);
      setSuccess(true);
    } catch (err) {
      if (err.status === 409) {
        setAlreadyRegistered(true);
        setError("");
      } else {
        setError(
          err.message || "Something went wrong. Please try again shortly.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const showSmsConsent = form.phone.trim().length > 0;

  return (
    <section
      id="waitlist"
      ref={sectionRef}
      aria-labelledby={headingId}
      className="bg-ho-forest"
    >
      <div className="mx-auto w-full max-w-[640px] px-6 py-20 md:px-10 md:py-24 lg:py-28">
        {success || alreadyRegistered ? (
          <div className="rise-in text-center text-white">
            <BrandLogo variant="light" className="mx-auto" />
            <h2
              id={headingId}
              className="mt-10 font-serif text-[clamp(2.3rem,5vw,3.5rem)] font-semibold leading-[1.08]"
            >
              {alreadyRegistered ? "You're already on the list." : "You're on the list."}
            </h2>
            <p className="mx-auto mt-5 max-w-[28rem] text-[1.05rem] leading-8 text-white/85">
              {alreadyRegistered
                ? "This email is already registered. Your founding household rate is locked — we'll be in touch before launch."
                : "Your founding household rate is reserved. We'll be in touch before launch."}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center text-white">
              <h2
                id={headingId}
                className="font-serif text-[clamp(2.3rem,5vw,3.6rem)] font-semibold leading-[1.08]"
              >
                Join the Founding Households
              </h2>
              <p className="mt-4 text-[1rem] italic text-white/70">
                Reserve your founding spot today for just $1
              </p>
            </div>

            <form className="mt-10 space-y-5" onSubmit={onSubmit} noValidate>
              <Field
                inputRef={emailRef}
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={updateField}
                disabled={busy}
                required
              />
              <Field
                inputRef={phoneRef}
                label="Mobile number"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={updateField}
                disabled={busy}
                optional
              />
              <Field
                label="Market / city"
                name="market"
                autoComplete="address-level2"
                value={form.market}
                onChange={updateField}
                disabled={busy}
                required
              />
              <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/55">
                Buying timeline
                <select
                  name="buyingTimeline"
                  value={form.buyingTimeline}
                  onChange={updateField}
                  disabled={busy}
                  required
                  className="admin-select mt-1.5 w-full rounded-xl border border-white/15 bg-white px-3 py-3 text-[0.98rem] font-normal normal-case tracking-normal text-ho-forest outline-none focus:border-ho-gold disabled:opacity-70"
                >
                  <option value="">Select one</option>
                  {buyingTimelines.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {showSmsConsent ? (
                <label className="flex items-start gap-3 text-[0.86rem] leading-6 text-white/80">
                  <input
                    type="checkbox"
                    name="smsConsent"
                    checked={form.smsConsent}
                    onChange={updateField}
                    disabled={busy}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 accent-ho-gold"
                  />
                  <span>
                    {smsConsentCopy.beforeLinks}
                    <a
                      href="#"
                      className="underline underline-offset-2 hover:text-white"
                    >
                      {smsConsentCopy.privacy}
                    </a>
                    {smsConsentCopy.and}
                    <a
                      href="#"
                      className="underline underline-offset-2 hover:text-white"
                    >
                      {smsConsentCopy.terms}
                    </a>
                    {smsConsentCopy.afterLinks}
                  </span>
                </label>
              ) : null}

              {error ? (
                <p className="text-[0.9rem] leading-6 text-[#f3d0c6]" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-14 w-full items-center justify-center rounded-full bg-ho-gold px-8 py-3.5 text-[1rem] font-semibold tracking-wide text-ho-forest transition-[background-color,transform] duration-300 hover:bg-ho-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-70 motion-safe:hover:scale-[1.015]"
              >
                {busy ? "Reserving…" : "Lock the founding rate"}
              </button>
            </form>
          </>
        )}

        <HomeownerFooter />
      </div>
    </section>
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
  required = false,
  inputRef,
}) {
  const id = useId();
  return (
    <label
      className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/55"
      htmlFor={id}
    >
      <span className="flex items-center justify-between">
        {label}
        {optional ? (
          <span className="font-medium normal-case tracking-normal text-white/40">
            Optional
          </span>
        ) : null}
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
        required={required}
        className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-3 py-3 text-[0.98rem] font-normal normal-case tracking-normal text-ho-forest outline-none placeholder:text-ho-forest/30 focus:border-ho-gold disabled:opacity-70"
      />
    </label>
  );
}
