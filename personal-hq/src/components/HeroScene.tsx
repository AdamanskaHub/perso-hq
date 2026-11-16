import { useMemo } from 'react';

/**
 * Original CSS-variable-driven SVG landscape: a turquoise sea, distant islands, an ancient stone arch
 * on a vegetated island, a small sailboat and dreamy clouds. No text lives in the artwork.
 * Colours come from CSS variables so the sky shifts between morning and evening.
 * To use your own artwork instead, drop a file at public/hero.jpg (see README).
 */
export function HeroScene() {
  const waves = useMemo(() => {
    const rows: { d: string; o: number; w: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const y = 392 + i * 9.5 + (i % 3) * 2;
      const amp = 1.5 + i * 0.22;
      const len = 36 + i * 4;
      const offset = (i * 97) % 220;
      let d = `M${-200 + offset} ${y}`;
      for (let x = -200 + offset; x < 1800; x += len * 2) {
        d += ` q${len / 2} ${-amp} ${len} 0 t${len} 0`;
      }
      rows.push({ d, o: 0.06 + (i % 5) * 0.025, w: 0.8 + i * 0.05 });
    }
    return rows;
  }, []);

  const frond = (angle: number, len: number, key: string) => (
    <path key={key} d={`M0 0 Q ${len * 0.45} ${-len * 0.55} ${len} ${-len * 0.12} Q ${len * 0.5} ${-len * 0.22} 0 0Z`} transform={`rotate(${angle})`} />
  );

  return (
    <svg className="hero-scene" viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--sky-top)' }} />
          <stop offset="0.55" style={{ stopColor: 'var(--sky-mid)' }} />
          <stop offset="1" style={{ stopColor: 'var(--sky-low)' }} />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--sea-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--sea-bottom)' }} />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" style={{ stopColor: 'var(--sun)', stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: 'var(--sun)', stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="cloudFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4ecd8" stopOpacity="0.5" />
          <stop offset="1" style={{ stopColor: 'var(--cloud-under)', stopOpacity: 0.35 }} />
        </linearGradient>
      </defs>

      <rect width="1600" height="400" fill="url(#sky)" />

      {/* stars (only visible against the darker evening sky) */}
      <g className="hero-stars" fill="#f4ecd8">
        {[
          [120, 60, 1.4], [260, 110, 1], [420, 40, 1.2], [610, 90, 1], [760, 50, 1.4], [930, 120, 1],
          [1040, 40, 1.2], [1330, 70, 1.4], [1470, 130, 1], [1540, 50, 1.2], [180, 170, 1], [540, 160, 1],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>

      {/* sun and glow */}
      <circle cx="1180" cy="262" r="210" fill="url(#sunGlow)" />
      <circle cx="1180" cy="262" r="64" style={{ fill: 'var(--sun)' }} opacity="0.92" />

      {/* clouds */}
      <g className="hero-clouds">
        <g fill="url(#cloudFill)">
          <path d="M120 150c30-26 80-26 104-2 24-14 62-8 70 12 40 2 60 28 40 42H100c-34 0-44-36 20-52z" />
          <path d="M760 96c24-20 64-20 84-2 20-10 50-6 56 10 32 2 48 22 32 34H744c-28 0-36-30 16-42z" />
          <path d="M1330 170c22-18 58-18 76-2 18-10 46-6 52 10 28 2 42 20 28 32h-186c-26 0-32-28 30-40z" />
        </g>
        <g fill="#f4ecd8" opacity="0.14">
          <rect x="380" y="230" width="260" height="9" rx="4.5" />
          <rect x="430" y="248" width="180" height="7" rx="3.5" />
          <rect x="860" y="205" width="220" height="8" rx="4" />
        </g>
      </g>

      {/* birds */}
      <g fill="none" stroke="#f4ecd8" strokeWidth="2" strokeLinecap="round" opacity="0.55">
        <path d="M980 160q10-9 20 0q10-9 20 0" />
        <path d="M1015 182q7-6 14 0q7-6 14 0" />
      </g>

      {/* far islands */}
      <g>
        <path d="M0 376V352c60-16 110-18 160-4 40 10 70 6 100 28z" style={{ fill: 'var(--far-1)' }} opacity="0.8" />
        <path d="M400 376c50-38 100-56 150-50 48 6 80 28 106 50z" style={{ fill: 'var(--far-2)' }} opacity="0.7" />
        <path d="M520 376c36-22 70-30 104-24 30 6 50 14 64 24z" style={{ fill: 'var(--far-1)' }} opacity="0.7" />
        <path d="M800 376c26-18 56-22 84-14 20 6 32 8 46 14z" style={{ fill: 'var(--far-2)' }} opacity="0.55" />
      </g>

      {/* sea */}
      <rect y="372" width="1600" height="268" fill="url(#sea)" />
      {/* sun reflection */}
      <g style={{ fill: 'var(--sun)' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={1180 - (58 - i * 5) / 2 * (1 + i * 0.12)} y={384 + i * 22} width={(58 - i * 5) * (1 + i * 0.12)} height="4" rx="2" opacity={0.34 - i * 0.03} />
        ))}
      </g>
      <g fill="none" stroke="#f4ecd8" strokeLinecap="round">
        {waves.map((w, i) => (
          <path key={i} d={w.d} strokeWidth={w.w} opacity={w.o} />
        ))}
      </g>

      {/* mid island with ancient arch */}
      <g>
        <path d="M940 404c40-26 96-48 170-54 80-6 170 2 240 18 50 12 90 22 126 36z" style={{ fill: 'var(--island)' }} />
        <path d="M1010 396c50-16 108-26 170-26 70 0 130 8 200 26z" style={{ fill: 'var(--island-light)' }} opacity="0.5" />
        {/* arch */}
        <g style={{ fill: 'var(--stone)' }}>
          <rect x="1160" y="296" width="17" height="76" />
          <rect x="1243" y="296" width="17" height="76" />
          <path d="M1160 300a50 50 0 0 1 100 0h-17a33 33 0 0 0-66 0z" />
          <rect x="1105" y="326" width="14" height="42" />
          <rect x="1099" y="322" width="26" height="6" />
          <rect x="1296" y="316" width="14" height="52" />
          <rect x="1290" y="311" width="26" height="6" />
          <rect x="1340" y="344" width="12" height="26" />
        </g>
        <g style={{ fill: 'var(--stone-shade)' }} opacity="0.65">
          <rect x="1170" y="296" width="7" height="76" />
          <rect x="1253" y="296" width="7" height="76" />
          <rect x="1112" y="326" width="7" height="42" />
          <rect x="1303" y="316" width="7" height="52" />
        </g>
        {/* vegetation */}
        <g style={{ fill: 'var(--leaf-dark)' }}>
          <ellipse cx="1150" cy="372" rx="38" ry="16" />
          <ellipse cx="1275" cy="374" rx="44" ry="15" />
          <ellipse cx="1040" cy="392" rx="40" ry="12" />
          <ellipse cx="1400" cy="392" rx="46" ry="12" />
          <ellipse cx="1100" cy="324" rx="12" ry="7" />
        </g>
        <g style={{ fill: 'var(--leaf-light)' }} opacity="0.85">
          <ellipse cx="1160" cy="366" rx="24" ry="8" />
          <ellipse cx="1285" cy="368" rx="28" ry="8" />
          <ellipse cx="1050" cy="388" rx="24" ry="6" />
        </g>
        {/* palms */}
        <g>
          <path d="M1362 372c-2-30 4-52 18-72" stroke="#0a2f38" strokeWidth="5" fill="none" strokeLinecap="round" />
          <g transform="translate(1380 300)" style={{ fill: 'var(--leaf-dark)' }}>
            {[-170, -140, -105, -70, -35, -5].map((a, i) => frond(a, 54 + (i % 2) * 10, `a${i}`))}
          </g>
          <path d="M1060 392c-1-20 3-34 12-46" stroke="#0a2f38" strokeWidth="4" fill="none" strokeLinecap="round" />
          <g transform="translate(1072 346) scale(0.75)" style={{ fill: 'var(--leaf-dark)' }}>
            {[-170, -135, -100, -65, -30].map((a, i) => frond(a, 48 + (i % 2) * 8, `b${i}`))}
          </g>
        </g>
      </g>

      {/* sailboat */}
      <g transform="translate(880 440)">
        <path d="M-30 0h60l-10 11h-40z" fill="#07142a" opacity="0.85" />
        <path d="M0 -4V-52l26 44z" fill="#f4ecd8" opacity="0.85" />
        <path d="M-4 -4V-38l-20 34z" fill="#f4ecd8" opacity="0.6" />
        <ellipse cx="0" cy="13" rx="34" ry="2.5" fill="#f4ecd8" opacity="0.14" />
      </g>

      {/* foreground: left cliff with a broken column, right rocks and fronds */}
      <g fill="#061226">
        <path d="M0 640V500c34-12 74-10 108 6 34 16 56 44 76 134z" />
        <rect x="46" y="440" width="22" height="66" />
        <rect x="40" y="434" width="34" height="8" />
        <rect x="92" y="470" width="18" height="36" />
        <path d="M1600 640V560c-30-14-64-10-92 8-30 18-52 48-70 72z" />
        <path d="M1500 640c8-30 28-52 52-60 24-8 40 0 48 8v52z" />
      </g>
      <g transform="translate(1568 560)" fill="#061226">
        {[-175, -150, -125, -100, -75].map((a, i) => frond(a, 90 + (i % 2) * 14, `f${i}`))}
      </g>
      <g transform="translate(24 500)" fill="#061226">
        {[-5, -30, -55, -80].map((a, i) => frond(a, 70 + (i % 2) * 10, `g${i}`))}
      </g>
    </svg>
  );
}
