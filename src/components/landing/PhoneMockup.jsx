import { useEffect, useRef, useState } from "react";
import "./PhoneDemo.css";

const OPENER = [
  {
    s: "me",
    t: "Our insurance renewal is asking when the roof was replaced. I have no idea",
  },
  {
    s: "them",
    t: "June 2014 — architectural asphalt shingle installed by Northwest Roofing Co., with a 25-year transferable warranty. That's from page 12 of your inspection report.",
  },
  { s: "me", t: "Can you send me that page?" },
  {
    s: "them",
    t: "It's saved in your Opsy portal — here's the direct link to page 12:",
  },
  { s: "them", pdf: ["Inspection Report — p.12", "Opsy Portal · heyopsy.com"] },
  {
    s: "them",
    t: "One more thing while we're here — the roof's next recommended inspection is March 2027. I'll remind you when it's close.",
  },
  { s: "me", t: "This thing is amazing" },
];

const TOPICS = {
  warranty: {
    label: "What's under warranty?",
    convo: [
      { s: "me", t: "What's under warranty?" },
      {
        s: "them",
        t: "Your water heater — installed 2022 by Sound Plumbing Pros, 6-year manufacturer warranty, covered through 2028. The receipt with the model and serial number is in your Opsy portal:",
      },
      {
        s: "them",
        pdf: ["Water Heater Receipt", "Opsy Portal · heyopsy.com"],
      },
      {
        s: "them",
        t: "Your roof's 25-year warranty is transferable too. Want me to keep both on watch and flag anything before it expires?",
      },
      { s: "me", t: "Yes please. You just made my day" },
    ],
  },
  fall: {
    label: "What needs doing this fall?",
    convo: [
      { s: "me", t: "What needs doing this fall?" },
      {
        s: "them",
        t: "Two things on your Home Calendar: gutters are due for cleaning by Oct 2 — Northwest Roofing did them in February — and your furnace tune-up is due Nov 1. Cascade HVAC did the last one in May.",
      },
      {
        s: "them",
        t: "Want me to draft the service requests? You just hit send.",
      },
      { s: "me", t: "Do it. This is so easy" },
    ],
  },
  plumbing: {
    label: "Who fixed the plumbing?",
    convo: [
      { s: "me", t: "Who fixed the plumbing?" },
      {
        s: "them",
        t: "Sound Plumbing Pros — they snaked the guest bath drain on July 19. The invoice is in your Opsy portal, and they're due for a follow-up check September 23:",
      },
      {
        s: "them",
        pdf: ["Plumbing Repair Receipt", "Opsy Portal · heyopsy.com"],
      },
      { s: "me", t: "Perfect. Keeping them" },
    ],
  },
};

const TYPED_REPLY = [
  {
    s: "them",
    t: "Great question — and exactly the kind I answer all day once I'm keeping your home.",
  },
  {
    s: "them",
    t: "This is my demo, so I'm sticking to the script. Tap a question below to see me work — or lock a founding spot and ask me anything about your actual home.",
  },
];

const TOPIC_KEYS = Object.keys(TOPICS);

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function StatusIcons() {
  return (
    <span className="phone-demo__status-icons" aria-hidden="true">
      <svg width="18" height="12" viewBox="0 0 18 12">
        <rect x="0" y="7" width="3" height="5" rx="1" fill="#111" />
        <rect x="5" y="5" width="3" height="7" rx="1" fill="#111" />
        <rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="#111" />
        <rect x="15" y="0" width="3" height="12" rx="1" fill="#111" />
      </svg>
      <svg width="17" height="12" viewBox="0 0 17 12">
        <path d="M8.5 12 L2.6 5.4 A8.6 8.6 0 0 1 14.4 5.4 Z" fill="#111" />
        <path d="M8.5 8.4 L5.4 4.9 A5.1 5.1 0 0 1 11.6 4.9 Z" fill="#fff" />
        <path d="M8.5 6.4 L7 4.7 A2.4 2.4 0 0 1 10 4.7 Z" fill="#111" />
      </svg>
      <svg width="25" height="12" viewBox="0 0 25 12">
        <rect
          x="0.5"
          y="0.5"
          width="20"
          height="11"
          rx="3.5"
          fill="none"
          stroke="#111"
        />
        <rect x="2.5" y="2.5" width="14" height="7" rx="1.8" fill="#111" />
        <rect x="22" y="3.8" width="2.4" height="4.4" rx="1.2" fill="#111" />
      </svg>
    </span>
  );
}

function MessageBubble({ message }) {
  if (message.pdf) {
    return (
      <div className="phone-demo__pdf">
        <div className="phone-demo__pdf-ic" aria-hidden="true">
          🔗
        </div>
        <div>
          <b>{message.pdf[0]}</b>
          <small>{message.pdf[1]}</small>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`phone-demo__msg phone-demo__msg--${message.s === "me" ? "me" : "them"}`}
    >
      {message.t}
    </div>
  );
}

export function PhoneMockup({ className = "" }) {
  const rootRef = useRef(null);
  const threadRef = useRef(null);
  const playConvoRef = useRef(null);
  const busyRef = useRef(false);

  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [chipsVisible, setChipsVisible] = useState(false);
  const [chipsEnabled, setChipsEnabled] = useState(false);
  const [remainingTopics, setRemainingTopics] = useState(TOPIC_KEYS);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    const controller = new AbortController();
    let started = false;
    busyRef.current = false;

    async function playMsg(message) {
      if (message.s === "them") {
        setTyping(true);
        await wait(
          Math.min(2200, 700 + (message.t ? message.t.length * 11 : 500)),
          controller.signal,
        );
        setTyping(false);
      } else {
        await wait(650, controller.signal);
      }

      setMessages((prev) => [...prev, message]);
      await wait(
        message.s === "me"
          ? 500
          : message.t
            ? Math.min(1900, 600 + message.t.length * 8)
            : 1100,
        controller.signal,
      );
    }

    async function playConvo(convo) {
      if (busyRef.current) return;
      busyRef.current = true;
      setChipsVisible(false);
      setChipsEnabled(false);

      try {
        for (const message of convo) {
          await playMsg(message);
        }
        if (!controller.signal.aborted) {
          setChipsVisible(true);
          setChipsEnabled(true);
        }
      } catch (error) {
        if (error?.name !== "AbortError") throw error;
        setTyping(false);
      } finally {
        busyRef.current = false;
      }
    }

    playConvoRef.current = playConvo;

    async function startOpener() {
      if (started || controller.signal.aborted) return;
      started = true;
      try {
        await wait(700, controller.signal);
        await playConvo(OPENER);
      } catch (error) {
        if (error?.name !== "AbortError") throw error;
      }
    }

    const node = rootRef.current;
    let observer;
    let safetyTimer;

    if (node && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startOpener();
              observer?.disconnect();
            }
          });
        },
        { threshold: 0.35 },
      );
      observer.observe(node);
      safetyTimer = setTimeout(startOpener, 4000);
    } else {
      startOpener();
    }

    return () => {
      controller.abort();
      playConvoRef.current = null;
      observer?.disconnect();
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, []);

  async function onChipClick(key) {
    if (!chipsEnabled || busyRef.current) return;
    const playConvo = playConvoRef.current;
    if (!playConvo) return;
    setRemainingTopics((prev) => prev.filter((item) => item !== key));
    await playConvo(TOPICS[key].convo);
  }

  async function onSend() {
    const value = draft.trim();
    if (!value || sending || busyRef.current) return;
    const playConvo = playConvoRef.current;
    if (!playConvo) return;

    setDraft("");
    setSending(true);
    setMessages((prev) => [...prev, { s: "me", t: value }]);
    await playConvo(TYPED_REPLY);
    setSending(false);
  }

  const inputLocked = sending || !chipsEnabled;

  return (
    <div
      ref={rootRef}
      className={`phone-demo phone-cutout ${className}`.trim()}
      role="region"
      aria-label="Interactive demo: text conversation with Opsy"
    >
      <div className="phone-demo__device">
        <div className="phone-demo__island" aria-hidden="true" />
        <div className="phone-demo__screen">
          <div className="phone-demo__status">
            <span className="phone-demo__status-time">9:41</span>
            <StatusIcons />
          </div>

          <div className="phone-demo__hdr">
            <span className="phone-demo__back" aria-hidden="true">
              ‹
            </span>
            <div className="phone-demo__who">
              <img src="/branding/opsy-head.png" alt="" width={46} height={46} />
              <span>Opsy</span>
            </div>
          </div>

          <div className="phone-demo__thread" ref={threadRef}>
            <div className="phone-demo__day">Today 9:41 AM</div>
            {messages.map((message, index) => (
              <MessageBubble
                key={`${index}-${message.t || message.pdf?.[0]}`}
                message={message}
              />
            ))}
            {typing ? (
              <div className="phone-demo__typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            ) : null}
          </div>

          {remainingTopics.length > 0 ? (
            <div
              className={`phone-demo__chips${chipsVisible ? " phone-demo__chips--show" : ""}`}
            >
              {remainingTopics.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="phone-demo__chip"
                  disabled={!chipsEnabled || sending}
                  onClick={() => onChipClick(key)}
                >
                  {TOPICS[key].label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="phone-demo__inbar">
            <div className="phone-demo__plus" aria-hidden="true">
              ＋
            </div>
            <div className="phone-demo__field">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Message Opsy…"
                autoComplete="off"
                aria-label="Message Opsy"
                disabled={inputLocked}
              />
              <button
                type="button"
                className="phone-demo__send"
                onClick={onSend}
                disabled={inputLocked || !draft.trim()}
                aria-label="Send message"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
