const leftFaqs = [
  {
    question: "What do I actually have to do?",
    answer:
      "CC OPSY, docs@heyopsy.com when your deal goes mutual, and forward anything that arrives outside the thread. No client onboarding, no logins, no homework.",
  },
  {
    question: "What does my client see during the transaction?",
    answer:
      "Nothing. That's the point. Opsy works silently while the deal runs, so closing day lands as a genuine surprise — their entire home, already organized, from you.",
  },
  {
    question: "What if the deal dies?",
    answer:
      "Your reservation rolls to your next mutual automatically. And until your first documents land, everything is fully refundable anyway.",
  },
];

const rightFaqs = [
  {
    question: "What's in it for me after closing?",
    answer:
      "You're a Founding Agent — permanently marked in the product, locked at founding pricing forever, first in line when homeowners in your market ask us for an Opsy agent. And at the end of the day, you take care of your clients.",
  },
  {
    question: "When does this start?",
    answer: "Opsy 2.0 launches this October.",
  },
];

function FaqItem({ question, answer }) {
  return (
    <div>
      <h3 className="font-serif text-[1.25rem] font-bold leading-snug text-forest-deep md:text-[1.4rem]">
        {question}
      </h3>
      <p className="mt-2 text-[0.98rem] leading-7 text-ink">{answer}</p>
    </div>
  );
}

export function FAQSection({ children }) {
  return (
    <section aria-labelledby="faq-heading" className="relative">
      {children}
    </section>
  );
}

export function FAQContent() {
  return (
    <>
      <h2
        id="faq-heading"
        className="rise-in font-serif text-[clamp(2.3rem,4.6vw,3.7rem)] font-bold text-forest-deep"
      >
        Five honest questions
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-10 md:mt-14 md:grid-cols-2 md:gap-x-16 md:gap-y-12 lg:gap-x-24">
        <div className="space-y-10">
          {leftFaqs.map((item) => (
            <FaqItem key={item.question} {...item} />
          ))}
        </div>
        <div className="space-y-10">
          {rightFaqs.map((item) => (
            <FaqItem key={item.question} {...item} />
          ))}
        </div>
      </div>
    </>
  );
}
