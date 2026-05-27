export default function ProductLoading() {
  return (
    <main className="pt-[110px] pb-20 max-[900px]:pt-[100px]">
      <div className="px-[8%] mb-6 max-[900px]:px-[6%]">
        <div className="h-3 w-1/3 max-w-[420px] rounded-full bg-white/[0.06] animate-pulse" />
      </div>
      <section
        className={
          "grid grid-cols-[1.15fr_1fr] gap-12 px-[8%] " +
          "max-[1100px]:gap-8 max-[900px]:grid-cols-1 max-[900px]:px-[6%]"
        }
      >
        <div className="aspect-square w-full rounded-[28px] bg-white/[0.04] border border-white/[0.06] animate-pulse" />
        <div className="flex flex-col gap-6">
          <div className="h-3 w-24 rounded-full bg-white/[0.06] animate-pulse" />
          <div className="h-10 w-3/4 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-2/3 rounded-lg bg-white/[0.04] animate-pulse" />
          <div className="h-12 w-32 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-14 w-full rounded-full bg-white/[0.04] animate-pulse" />
          <div className="h-[200px] w-full rounded-3xl bg-white/[0.03] animate-pulse" />
        </div>
      </section>
    </main>
  );
}
