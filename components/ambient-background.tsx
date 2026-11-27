/**
 * Latar belakang mode terang dengan shape organik & pita geometris
 * ber-opacity rendah (biru & hijau lime) sesuai referensi desain.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f6f8fb]"
    >
      {/* Gelombang organik besar di kiri-atas (biru lembut opacity rendah) */}
      <svg
        viewBox="0 0 800 800"
        fill="none"
        className="absolute -top-44 -left-40 h-[680px] w-[680px] text-[#2563eb] opacity-[0.055]"
      >
        <path
          d="M621.5 144.2C714.8 228.5 765.4 361.9 729.8 483.1C694.2 604.3 572.4 713.3 438.9 738.8C305.4 764.3 160.2 706.3 87.6 595.1C15 483.9 15 319.5 92.8 205.8C170.6 92.1 326.2 29.1 465.1 47.4C526.2 55.5 578.2 105.1 621.5 144.2Z"
          fill="currentColor"
        />
      </svg>

      {/* Pita / lengkungan abstrak hijau lime di kanan-atas */}
      <svg
        viewBox="0 0 700 700"
        fill="none"
        className="absolute -top-24 -right-32 h-[560px] w-[560px] text-[#84cc16] opacity-[0.10]"
      >
        <path
          d="M148 118C272 48 456 64 552 170C648 276 656 472 544 568C432 664 200 660 112 546C24 432 24 188 148 118Z"
          stroke="currentColor"
          strokeWidth="68"
          strokeLinecap="round"
        />
      </svg>

      {/* Shape kapsul miring biru sangat tipis di bagian tengah-bawah */}
      <svg
        viewBox="0 0 900 500"
        fill="none"
        className="absolute -bottom-36 left-1/2 h-[480px] w-[860px] -translate-x-1/2 text-[#2563eb] opacity-[0.045]"
      >
        <rect
          x="70"
          y="90"
          width="760"
          height="320"
          rx="160"
          transform="rotate(-8 450 250)"
          fill="currentColor"
        />
      </svg>

      {/* Lingkaran aksen hijau lime lembut di kiri-bawah */}
      <div className="absolute bottom-12 -left-24 h-80 w-80 rounded-full bg-[#bff227] opacity-[0.12] blur-3xl" />

      {/* Lingkaran aksen biru elektrik lembut di kanan-tengah */}
      <div className="absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-[#2563eb] opacity-[0.06] blur-3xl" />
    </div>
  );
}
