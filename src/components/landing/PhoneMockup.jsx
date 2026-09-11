export function PhoneMockup({ className = "" }) {
  return (
    <div className={className}>
      <picture>
        <source srcSet="/branding/phone-mockup.webp?v=5" type="image/webp" />
        <img
          src="/branding/phone-mockup.png?v=5"
          alt="Text conversation with Opsy sharing the roof replacement date from an inspection report"
          className="phone-cutout h-[min(52svh,480px)] w-auto max-w-[min(100%,280px)] object-contain sm:h-[min(58svh,560px)] sm:max-w-[340px] lg:h-[min(78svh,720px)] lg:max-w-[440px]"
          width={476}
          height={965}
          decoding="async"
          fetchPriority="high"
        />
      </picture>
    </div>
  );
}
