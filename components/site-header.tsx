import Link from "next/link";

function DeskCalendarLogo({ className = "h-10 w-auto" }: { className?: string }) {
  const gTL = { x: 39, y: 36 };
  const gTR = { x: 115, y: 39 };
  const gBL = { x: 23, y: 91 };
  const gBR = { x: 100, y: 97 };

  const lerp = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) => ({
    x: +(a.x + (b.x - a.x) * t).toFixed(2),
    y: +(a.y + (b.y - a.y) * t).toFixed(2),
  });

  const cols = [0, 1, 2, 3, 4, 5].map((c) => {
    const u = c / 5;
    return { top: lerp(gTL, gTR, u), bottom: lerp(gBL, gBR, u) };
  });

  const rows = [0, 1, 2, 3, 4].map((r) => {
    const v = r / 4;
    return { left: lerp(gTL, gBL, v), right: lerp(gTR, gBR, v) };
  });

  const holeXs = [44, 56, 68, 80, 92, 104, 116];

  return (
    <svg
      viewBox="8 6 146 104"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Bagian cincin spiral belakang yang melengkung ke balik papan kalender */}
      {holeXs.map((hx, idx) => {
        const hy = +(26.2 + idx * 0.48).toFixed(2);
        const endX = hx + 16;
        const endY = idx === holeXs.length - 1 ? hy + 8 : hy - 4.5;
        return (
          <path
            key={`ring-back-${hx}`}
            d={`M ${hx} ${hy} C ${hx + 1} ${hy - 17}, ${endX + 2} ${hy - 16}, ${endX} ${endY}`}
            stroke="#F70C64"
            strokeWidth="3.3"
            strokeLinecap="round"
          />
        );
      })}

      {/* Bayangan lipatan bawah tenda kalender (biru tua) */}
      <polygon points="113,84 148,92 108,106" fill="#0663B5" />

      {/* Sisi samping kanan tenda kalender (biru toska) */}
      <polygon points="128,23 148,92 113,84" fill="#009EC6" />

      {/* Papan utama kalender depan (hijau zamrud) */}
      <polygon points="34,20 128,23 108,106 12,98" fill="#07C586" />

      {/* Garis tabel kalender 5x4 */}
      <g stroke="#08789C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {cols.map((col, idx) => (
          <line
            key={`col-${idx}`}
            x1={col.top.x}
            y1={col.top.y}
            x2={col.bottom.x}
            y2={col.bottom.y}
          />
        ))}
        {rows.map((row, idx) => (
          <line
            key={`row-${idx}`}
            x1={row.left.x}
            y1={row.left.y}
            x2={row.right.x}
            y2={row.right.y}
          />
        ))}
      </g>

      {/* Lingkaran merah muda + segilima kuning (Baris 3, Kolom 2) */}
      <g transform="translate(52, 71.8)">
        <circle cx="0" cy="0" r="8.2" fill="#F70C64" />
        <polygon
          points="0,-5.3 5,-1.6 3.1,4.3 -3.1,4.3 -5,-1.6"
          stroke="#FFD814"
          strokeWidth="1.6"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Bintang kuning 1 (Baris 3, Kolom 3) */}
      <polygon
        transform="translate(67.5, 72.8) rotate(-6)"
        points="0,-9.2 2.7,-3 9.4,-2.3 4.4,2.2 5.8,8.8 0,5.4 -5.8,8.8 -4.4,2.2 -9.4,-2.3 -2.7,-3"
        fill="#FFD814"
        stroke="#FFD814"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Bintang kuning 2 (Baris 2, Kolom 5) */}
      <polygon
        transform="translate(101.5, 60.2) rotate(8)"
        points="0,-9.2 2.7,-3 9.4,-2.3 4.4,2.2 5.8,8.8 0,5.4 -5.8,8.8 -4.4,2.2 -9.4,-2.3 -2.7,-3"
        fill="#FFD814"
        stroke="#FFD814"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Lubang cincin merah muda & lengkungan depan spiral */}
      {holeXs.map((hx, idx) => {
        const hy = +(26.2 + idx * 0.48).toFixed(2);
        return (
          <g key={`hole-${hx}`}>
            <circle cx={hx} cy={hy} r="4.1" fill="#F70C64" />
            <path
              d={`M ${hx} ${hy} C ${hx + 0.5} ${hy - 11}, ${hx + 7} ${hy - 14.5}, ${hx + 11.5} ${hy - 12}`}
              stroke="#F70C64"
              strokeWidth="3.3"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Ikon kalender meja di header menggantikan badge "deadliner" */
export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Deadliner"
      title="Deadliner"
      className="group inline-flex items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]"
    >
      <DeskCalendarLogo className="h-10 w-auto transition-transform duration-200 group-hover:scale-105 sm:h-11" />
    </Link>
  );
}
