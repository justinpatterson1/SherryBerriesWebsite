type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: Date;
  authorName: string;
};

export function ProductReviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <section
        aria-labelledby="reviews-title"
        className="py-16 px-[8%] max-[900px]:px-[6%] max-[900px]:py-12"
      >
        <h2
          id="reviews-title"
          className="font-display text-[clamp(32px,3.6vw,48px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
        >
          Reviews
        </h2>
        <p className="font-serif italic text-lg text-ink-dim mt-4">
          No reviews yet — be the first to share your glow.
        </p>
      </section>
    );
  }

  const total = reviews.length;
  const average = reviews.reduce((acc, r) => acc + r.rating, 0) / total;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <section
      aria-labelledby="reviews-title"
      className="py-16 px-[8%] max-[900px]:px-[6%] max-[900px]:py-12"
    >
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-10">
        <h2
          id="reviews-title"
          className="font-display text-[clamp(32px,3.6vw,48px)] leading-[1.05] tracking-[-0.01em] text-ink m-0"
        >
          What berries are saying
        </h2>
        <span className="font-sans text-[11px] tracking-[0.22em] uppercase text-ink-faint">
          {total} verified {total === 1 ? "review" : "reviews"}
        </span>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-12 max-[900px]:grid-cols-1 max-[900px]:gap-8">
        <aside className="flex flex-col gap-4 p-6 rounded-[20px] bg-card border border-white/[0.06]">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-[56px] leading-none text-ink">
              {average.toFixed(1)}
            </span>
            <span className="font-sans text-[13px] text-ink-faint">/ 5</span>
          </div>
          <Stars rating={average} large />
          <div className="flex flex-col gap-1.5 mt-2">
            {breakdown.map(({ star, count }) => {
              const pct = (count / total) * 100;
              return (
                <div key={star} className="flex items-center gap-2.5 text-xs font-sans text-ink-faint">
                  <span className="w-3 text-ink-dim">{star}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink to-gold-soft"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          {reviews.slice(0, 6).map((r) => (
            <article
              key={r.id}
              className="p-5 rounded-[18px] bg-card border border-white/[0.06]"
            >
              <header className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-pink">
                    Verified
                  </span>
                </div>
                <span className="font-sans text-[11px] text-ink-faint">
                  {formatDate(r.createdAt)}
                </span>
              </header>
              {r.title && (
                <h3 className="font-serif text-[19px] font-semibold text-ink m-0 mb-1.5">
                  {r.title}
                </h3>
              )}
              <p className="font-sans text-[15px] leading-[1.65] text-ink-dim m-0">
                {r.comment}
              </p>
              <footer className="mt-3 font-sans text-[12px] tracking-[0.06em] text-ink-faint">
                — {r.authorName}
              </footer>
            </article>
          ))}
          {reviews.length > 6 && (
            <p className="font-sans text-[12px] tracking-[0.16em] uppercase text-ink-faint text-center mt-2">
              Showing 6 of {reviews.length}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Stars({ rating, large = false }: { rating: number; large?: boolean }) {
  const full = Math.round(rating);
  return (
    <span
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
      className={
        "text-gold leading-none " +
        (large ? "text-[18px] tracking-[2px]" : "text-[13px] tracking-[1px]")
      }
    >
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
