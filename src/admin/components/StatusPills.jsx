export function StatusPill({ status }) {
  const styles = {
    paid: "bg-[#e7f0ea] text-[#215746]",
    pending: "bg-[#f6ead0] text-[#8a6a2f]",
    refunded: "bg-[#f4e4e1] text-[#8b4a42]",
    canceled: "bg-[#f4e4e1] text-[#8b4a42]",
  };

  const labels = {
    paid: "Paid",
    pending: "Pending",
    refunded: "Canceled",
    canceled: "Canceled",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold ${styles[status] || "bg-black/5 text-forest-deep"}`}
    >
      {labels[status] || status}
    </span>
  );
}

export function YesNoPill({ value }) {
  return value ? (
    <span className="inline-flex rounded-full bg-[#e7f0ea] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#215746]">
      Yes
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-[#f4e4e1] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#8b4a42]">
      No
    </span>
  );
}
