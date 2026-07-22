export function CornerBracketFrame({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      style={{
        position: "absolute",
        inset: "-14px",
        width: "calc(100% + 28px)",
        height: "calc(100% + 28px)",
        pointerEvents: "none",
      }}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <g stroke="#C5A059" strokeWidth="1.5" fill="none" opacity="0.85">
        <path d="M4 40 L4 4 L40 4" />
        <path d="M160 4 L196 4 L196 40" />
        <path d="M196 200 L196 236 L160 236" />
        <path d="M40 236 L4 236 L4 200" />
      </g>
    </svg>
  );
}
