// The preorder pill on product tiles. Same shape as the Featured pill, in solid
// gold with black type and a black edge, so it holds up on the white photo
// backgrounds the light theme shows as well as on the dark theme. It sits on a
// photo, so the colours are fixed rather than themed.
export function PreorderTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "py-[5px] px-[11px] rounded-full bg-gradient-to-br from-[#f3d27a] to-[#d4af37] " +
        "border border-[#0b090a] text-[#0b090a] font-sans text-[9.5px] font-bold tracking-[0.16em] uppercase leading-none " +
        "shadow-[0_6px_14px_rgba(11,9,10,0.3)] " +
        className
      }
    >
      Preorder
    </span>
  );
}
