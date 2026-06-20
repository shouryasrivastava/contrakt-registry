import Image from "next/image";

export default function BrandLogo({
  className = "",
  priority = false,
  inverted = false,
}: {
  className?: string;
  priority?: boolean;
  inverted?: boolean;
}) {
  return (
    <span
      aria-label="Contrakt"
      className={`inline-flex items-center gap-2 whitespace-nowrap ${className}`}
    >
      <Image
        src={inverted ? "/brand/contrakt-icon-white-192.png" : "/brand/contrakt-icon-192.png"}
        alt=""
        width={192}
        height={192}
        priority={priority}
        className="h-7 w-7 shrink-0 object-contain"
      />
      <span className={`text-[18px] font-semibold tracking-[-0.02em] ${inverted ? "text-white" : "text-[#202020]"}`}>
        Contrakt
      </span>
    </span>
  );
}
