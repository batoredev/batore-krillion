export function RocketIcon({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="kb-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#ff6a3d" />
        </linearGradient>
      </defs>
      <path d="M16 2c5 4 7 9 7 15l-3 4h-8l-3-4c0-6 2-11 7-15z" fill="#eaf0ff" />
      <circle cx="16" cy="13" r="3" fill="#7c6cff" stroke="#050813" strokeWidth="1.2" />
      <path d="M9 17l-4 5 5-1zM23 17l4 5-5-1z" fill="#7c6cff" />
      <path d="M12.5 21h7l-1.5 4-2 5-2-5z" fill="url(#kb-flame)" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <RocketIcon />
      KRIBATOV
    </span>
  );
}
