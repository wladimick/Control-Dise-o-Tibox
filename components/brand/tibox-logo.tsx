type TiboxLogoProps = {
  className?: string;
  compact?: boolean;
};

export function TiboxLogo({ className = "", compact = false }: TiboxLogoProps) {
  if (compact) {
    return (
      <svg className={className} viewBox="0 0 84 84" role="img" aria-label="TIBOX">
        <defs>
          <linearGradient id="tbx-c1" x1="0" x2="1">
            <stop offset="0" stopColor="#FF4222" />
            <stop offset="1" stopColor="#EA7F18" />
          </linearGradient>
          <linearGradient id="tbx-c2" x1="0" x2="1">
            <stop offset="0" stopColor="#00D1FF" />
            <stop offset="1" stopColor="#0E9BDB" />
          </linearGradient>
          <linearGradient id="tbx-c3" x1="0" x2="1">
            <stop offset="0" stopColor="#FFB200" />
            <stop offset="1" stopColor="#E9DE03" />
          </linearGradient>
        </defs>
        <path fill="url(#tbx-c1)" d="M47 46 71 32a4 4 0 0 1 6 4v28a4 4 0 0 1-2 3L51 81a4 4 0 0 1-6-4V50a4 4 0 0 1 2-4Z" />
        <path fill="url(#tbx-c2)" d="M35 81 11 67a4 4 0 0 1-2-3V36a4 4 0 0 1 6-4l24 14a4 4 0 0 1 2 4v27a4 4 0 0 1-6 4Z" />
        <path fill="url(#tbx-c3)" d="m43 5 24 14a4 4 0 0 1 0 7L43 40a4 4 0 0 1-4 0L15 26a4 4 0 0 1 0-7L39 5a4 4 0 0 1 4 0Z" />
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="TIBOX">
      <TiboxLogo compact className="h-9 w-9" />
      <span className="text-[1.35rem] font-bold tracking-[0.34em] text-[var(--tbx-text)]">TIBOX</span>
    </div>
  );
}
