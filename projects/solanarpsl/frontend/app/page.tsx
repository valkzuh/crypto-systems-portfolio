export default function Home() {
  const leaderboard = [
    { name: "Chillhouse Chillers", wins: 0 },
    { name: "Fartcoin Fellas", wins: 0 },
    { name: "Pnut Powerhouse", wins: 0 },
    { name: "Aura Blasters", wins: 0 },
    { name: "Wojak Warriors", wins: 0 },
    { name: "Knights of 67", wins: 0 },
    { name: "Tormenting Trolls", wins: 0 },
    { name: "Moodeng Marauders", wins: 0 },
    { name: "Popcat Poppers", wins: 0 },
    { name: "DogWifScissors", wins: 0 },
  ];

  const CA = ""; // e.g. "7sK9k9z8P3....Qp3"
  const LOGO_SRC = "/srpsllogo.svg";
  const DISCORD_LINK = "https://discord.gg/b7vmK9qkyy";

  // Put your icon in /public and reference like this (NO "public/" prefix)
  const DISCORD_ICON_SRC = "/discord-round-color-icon.svg";

  // Button style (same look, fixed spacing + alignment)
  const discordBtn =
    "group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-300 px-8 py-4 text-base font-extrabold tracking-wide text-black shadow-2xl shadow-cyan-500/25 hover:scale-[1.02] hover:shadow-cyan-500/40 transition leading-none";

  // ✅ Transparent icon wrapper, visually centered
  const discordIconWrap =
    "inline-flex h-10 w-10 items-center justify-center bg-transparent overflow-hidden shrink-0";

  // Icon styling (fills wrapper properly)
  const discordIconImg = "h-8 w-8 object-contain block";

  const DiscordButton = ({
    className = "",
    size = "md",
    iconSrc,
    label = "Join Discord",
  }: {
    className?: string;
    size?: "md" | "lg";
    iconSrc?: string;
    label?: string;
  }) => {
    const isLg = size === "lg";
    const finalIcon = iconSrc ?? DISCORD_ICON_SRC;

    return (
      <a
        href={DISCORD_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={`${discordBtn} ${isLg ? "px-10 py-5 text-lg gap-3.5" : ""} ${className}`}
      >
        <span className={`${discordIconWrap} ${isLg ? "h-11 w-11" : ""}`}>
          {finalIcon ? (
            <img
              src={finalIcon}
              alt="Discord"
              className={`${discordIconImg} ${isLg ? "h-9 w-9" : ""}`}
              style={{ background: "transparent" }}
              loading="eager"
            />
          ) : (
            <span className="text-xl">◎</span>
          )}
        </span>

        {label}
      </a>
    );
  };

  return (
    <main className="min-h-screen text-white overflow-x-hidden antialiased relative">
      {/* ========= SOFT SCROLL SNAP (NO SPACING CHANGES) ========= */}
      <style>{`
        /* Soft snap: only snaps when you're already near the next section */
        html, body {
          scroll-snap-type: y proximity;
          scroll-padding-top: 120px; /* fixed bar offset */
        }

        /* Only sections tagged with data-snap will snap */
        [data-snap]{
          scroll-snap-align: start;
          scroll-snap-stop: normal; /* keep it soft */
          scroll-margin-top: 120px;
        }

        /* Optional: disable on mobile so it doesn't feel sticky */
        @media (max-width: 768px){
          html, body { scroll-snap-type: none; }
        }

        @media (prefers-reduced-motion: reduce){
          .srpsl-aurora-rot, .srpsl-grain { animation: none !important; }
        }

        /* ===== Premium scrollbar for the leaderboard list ===== */
        .srpsl-scroll{
          scrollbar-width: thin;                 /* Firefox */
          scrollbar-color: rgba(255,255,255,0.22) rgba(255,255,255,0.06);
        }
        .srpsl-scroll::-webkit-scrollbar{
          width: 10px;
        }
        .srpsl-scroll::-webkit-scrollbar-track{
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
        }
        .srpsl-scroll::-webkit-scrollbar-thumb{
          background: rgba(255,255,255,0.18);
          border-radius: 999px;
          border: 2px solid rgba(0,0,0,0);
          background-clip: padding-box;
        }
        .srpsl-scroll::-webkit-scrollbar-thumb:hover{
          background: rgba(255,255,255,0.26);
          border: 2px solid rgba(0,0,0,0);
          background-clip: padding-box;
        }
      `}</style>

      {/* ========= SITE-WIDE ANIMATED BACKGROUND (SAME LOOK, NO EDGE FLASH) ========= */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-[-30%] srpsl-aurora-rot opacity-95" />
        <div className="absolute inset-0 srpsl-edge-mask pointer-events-none" />
        <div className="absolute inset-0 srpsl-grain opacity-[0.16] mix-blend-overlay" />
        <div className="absolute inset-0 srpsl-vignette" />
      </div>

      <style>{`
        @keyframes srpslRotate {
          0%   { transform: rotate(0deg) scale(1.05); filter: hue-rotate(0deg) saturate(135%); }
          50%  { transform: rotate(180deg) scale(1.08); filter: hue-rotate(18deg) saturate(150%); }
          100% { transform: rotate(360deg) scale(1.05); filter: hue-rotate(0deg) saturate(135%); }
        }
        @keyframes srpslPulse {
          0%   { opacity: 0.85; }
          50%  { opacity: 0.98; }
          100% { opacity: 0.85; }
        }

        .srpsl-aurora-rot{
          background:
            radial-gradient(65rem 44rem at 25% 30%, rgba(217, 70, 239, 0.62), transparent 62%),
            radial-gradient(60rem 42rem at 78% 35%, rgba(34, 211, 238, 0.55), transparent 62%),
            radial-gradient(70rem 50rem at 55% 78%, rgba(52, 211, 153, 0.50), transparent 62%),
            radial-gradient(55rem 40rem at 40% 65%, rgba(99, 102, 241, 0.35), transparent 60%);
          background-blend-mode: screen;
          animation: srpslRotate 26s linear infinite, srpslPulse 8s ease-in-out infinite;
          will-change: transform, filter, opacity;
          filter: blur(18px) saturate(140%);
          -webkit-mask-image: radial-gradient(1400px 900px at 50% 50%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 92%);
          mask-image: radial-gradient(1400px 900px at 50% 50%, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 92%);
        }

        .srpsl-edge-mask{
          background:
            radial-gradient(1200px 700px at 50% 35%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.32) 72%, rgba(0,0,0,0.78) 100%),
            linear-gradient(to right,
              rgba(0,0,0,0.95) 0%,
              rgba(0,0,0,0.0) 24%,
              rgba(0,0,0,0.0) 76%,
              rgba(0,0,0,0.95) 100%
            ),
            linear-gradient(to bottom,
              rgba(0,0,0,0.95) 0%,
              rgba(0,0,0,0.0) 24%,
              rgba(0,0,0,0.0) 76%,
              rgba(0,0,0,0.95) 100%
            ),
            radial-gradient(600px 600px at 0% 0%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 60%),
            radial-gradient(600px 600px at 100% 0%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 60%),
            radial-gradient(600px 600px at 0% 100%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 60%),
            radial-gradient(600px 600px at 100% 100%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 60%);
          mix-blend-mode: multiply;
          opacity: 1;
        }

        .srpsl-grain{
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
          background-size: 260px 260px;
          animation: srpslNoise 10s steps(10) infinite;
        }

        @keyframes srpslNoise{
          0%{ transform: translate3d(0,0,0); }
          10%{ transform: translate3d(-1%,1%,0); }
          20%{ transform: translate3d(-2%,-1%,0); }
          30%{ transform: translate3d(1%,2%,0); }
          40%{ transform: translate3d(2%,-2%,0); }
          50%{ transform: translate3d(-2%,2%,0); }
          60%{ transform: translate3d(2%,1%,0); }
          70%{ transform: translate3d(1%,-2%,0); }
          80%{ transform: translate3d(-1%,-1%,0); }
          90%{ transform: translate3d(2%,0,0); }
          100%{ transform: translate3d(0,0,0); }
        }

        .srpsl-vignette{
          background: radial-gradient(1200px 700px at 50% 35%, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.78) 100%);
          pointer-events: none;
        }
      `}</style>

      {/* ================= TOP FIXED BAR ================= */}
      <div className="fixed top-5 left-0 right-0 z-50 px-6">
        <div className="relative mx-auto max-w-7xl flex items-center justify-center">
          <div className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/70 backdrop-blur-xl px-5 py-2.5 shadow-xl shadow-cyan-500/20">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.75)]" />
            <span className="font-[var(--font-heading)] text-sm font-extrabold tracking-[0.32em] bg-gradient-to-r from-fuchsia-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
              $SRPSL
            </span>
          </div>

          <div className="absolute right-0">
            <div className="max-w-[520px] inline-flex items-center gap-3 rounded-xl border border-emerald-400/50 bg-black/90 backdrop-blur-xl px-4 py-2.5 shadow-xl shadow-emerald-500/25">
              <span className="text-xs font-extrabold tracking-wider text-emerald-300">
                CA
              </span>
              <span className="text-xs sm:text-sm font-mono text-white truncate">
                {CA || "TBA"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= HERO / LEADERBOARD ================= */}
      <section data-snap className="relative min-h-screen flex items-start">
        <div className="relative mx-auto max-w-7xl px-6 w-full pt-32">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-start">
            <div>
              {LOGO_SRC && (
                <div className="mb-10">
                  <img
                    src={LOGO_SRC}
                    alt="SRPSL Logo"
                    className="h-20 md:h-24 lg:h-28 w-auto object-contain drop-shadow-[0_10px_30px_rgba(34,211,238,0.35)]"
                  />
                </div>
              )}

              <h1 className="font-[var(--font-heading)] pb-2 text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-[-0.05em] leading-[1.12] bg-gradient-to-r from-fuchsia-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                Solana Rock Paper Scissors League
              </h1>

              <p className="mt-8 max-w-2xl text-lg md:text-xl leading-8 text-zinc-200/90">
                A competitive on-chain Rock Paper Scissors league powered by
                Solana. Play, win, and dominate the leaderboard all on Discord.{" "}
                <br></br>No wallet connection needed.
              </p>

              {/* ✅ optimized hero spacing: removed extra padding that pushed sections apart */}
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <DiscordButton />

                <div className="flex items-center gap-3">
                  <a
                    href="#how"
                    className="rounded-xl bg-white/10 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/15 border border-white/10 transition"
                  >
                    How it works
                  </a>
                  <a
                    href="#wager"
                    className="rounded-xl bg-white/10 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/15 border border-white/10 transition"
                  >
                    Wager
                  </a>
                  <a
                    href="#tokenomics"
                    className="rounded-xl bg-white/10 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/15 border border-white/10 transition"
                  >
                    Tokenomics
                  </a>
                </div>
              </div>
            </div>

            {/* ===== LEADERBOARD CARD (Scrollable + premium) ===== */}
            {/* aligned to bottom of Join Discord on desktop */}
            <div className="relative lg:mt-28 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-8 md:p-9 shadow-2xl shadow-cyan-500/20">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-[var(--font-heading)] text-2xl md:text-3xl font-bold">
                  🏆 Leaderboard
                </h2>
                <span className="text-sm text-zinc-400">Season 0</span>
              </div>

              {/* Subtle divider line under header */}
              <div className="absolute inset-x-8 top-[76px] h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <div className="relative">
                {/* Fades so it looks premium */}
                <div className="pointer-events-none absolute left-0 right-0 top-0 h-6 bg-gradient-to-b from-black/35 to-transparent rounded-2xl" />
                <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-6 bg-gradient-to-t from-black/35 to-transparent rounded-2xl" />

                <ul className="srpsl-scroll space-y-4 max-h-[360px] md:max-h-[420px] overflow-y-auto pr-2 scroll-smooth">
                  {leaderboard.map((p, i) => (
                    <li
                      key={p.name}
                      className="group grid grid-cols-[56px_1fr_130px] items-center gap-4 rounded-2xl bg-black/50 px-5 py-4 border border-white/10 hover:border-white/20 hover:bg-black/45 transition"
                    >
                      <span className="text-zinc-400 font-extrabold text-base">
                        #{i + 1}
                      </span>
                      <span className="truncate font-semibold text-base">
                        {p.name}
                      </span>
                      <span className="text-right font-extrabold text-emerald-300 text-base">
                        {p.wins} wins
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
                <span>(Live leaderboard coming Season 1)</span>
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      {/* ✅ optimized section spacing (slightly tighter, still premium) */}
      <section id="how" data-snap className="py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-[var(--font-heading)] text-3xl md:text-4xl font-bold tracking-tight">
                How the League Works
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-zinc-300">
                Simple. Fast. Competitive. Play in Discord, climb the leaderboard, and earn
                rewards.
              </p>
            </div>

            <DiscordButton />
          </div>

          <div className="mt-10 grid gap-7 md:grid-cols-3">
            {[
              {
                title: "🎮 Play",
                text: "Challenge players through the Discord bot. Quick matches, clear results.",
              },
              {
                title: "🏆 Win",
                text: "Wins add points to your team leaderboard rank and qualify you for rewards.",
              },
              {
                title: "⚡ On Solana",
                text: "Built around Solana’s speed and low fees for future on-chain features.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl bg-white/5 border border-white/15 p-7 backdrop-blur-2xl hover:bg-white/7 transition shadow-xl shadow-black/30"
              >
                <h3 className="font-[var(--font-heading)] text-lg md:text-xl font-bold">
                  {c.title}
                </h3>
                <p className="mt-4 text-base text-zinc-300 leading-7">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WAGER ================= */}
      {/* ✅ optimized section spacing */}
      <section id="wager" data-snap className="relative py-20 md:py-24">
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-[var(--font-heading)] text-3xl md:text-4xl font-bold tracking-tight">
                Wager
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-zinc-300">
                Want higher stakes? Run a quick 1v1 and wager{" "}
                <span className="font-extrabold text-emerald-200">$SRPSL</span>{" "}
                tokens. Winner takes the pot — pure skill, pure pressure.
              </p>
            </div>

            <DiscordButton label="Join Discord" />
          </div>

          <div className="mt-10 grid gap-7 md:grid-cols-3">
            {[
              {
                title: "🤝 Challenge 1v1",
                text: "Call someone out in Discord and start a head-to-head match in seconds.",
              },
              {
                title: "💰 Wager $SRPSL",
                text: "Set your stake in $SRPSL tokens and lock it in before the round begins.",
              },
              {
                title: "🏅 Winner Takes",
                text: "Win the match and claim the pot. Prove it wasn’t luck — run it back anytime.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl bg-white/5 border border-white/15 p-7 backdrop-blur-2xl hover:bg-white/7 transition shadow-xl shadow-black/30"
              >
                <h3 className="font-[var(--font-heading)] text-lg md:text-xl font-bold">
                  {c.title}
                </h3>
                <p className="mt-4 text-base text-zinc-300 leading-7">
                  {c.text}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-zinc-400">*Play responsibly.</p>
        </div>
      </section>

      {/* ================= TOKENOMICS ================= */}
      {/* ✅ optimized section spacing */}
      <section id="tokenomics" data-snap className="relative py-20 md:py-24">
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-[var(--font-heading)] text-3xl md:text-4xl font-bold tracking-tight">
                Tokenomics
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-zinc-300">
                Long-term project with a community-driven token to fuel growth and
                rewards.
              </p>
            </div>

            <DiscordButton />
          </div>

          <div className="mt-10 grid gap-7 md:grid-cols-2">
            <div className="rounded-3xl bg-white/5 border border-white/15 p-7 backdrop-blur-2xl shadow-xl shadow-black/30">
              {/* ✅ evenly spaced bullet points (Y-axis) */}
              <ul className="grid grid-rows-4 gap-6 text-lg text-zinc-200 leading-relaxed">
                <li>• Fixed supply token - 1B</li>
                <li>• Cash incentives for top holders</li>
                <li>• 50% of dev fees fund tournament prize pools</li>
                <li>• Airdrops to participants</li>
              </ul>
            </div>

            <div className="rounded-3xl bg-white/5 border border-white/15 p-7 backdrop-blur-2xl shadow-xl shadow-black/30">
              <p className="text-lg text-zinc-200 leading-8">
                <span className="font-extrabold text-emerald-200">$SRPSL</span>{" "}
                aligns incentives between players and the league, rewarding skill and long-term participation.
              </p>

              <div className="mt-7 rounded-2xl border border-emerald-400/30 bg-black/50 p-5">
                <div className="text-xs font-extrabold tracking-wider text-emerald-300">
                  CONTRACT ADDRESS (CA)
                </div>
                <div className="mt-2 font-mono text-sm text-white break-all">
                  {CA || "TBA"}
                </div>
              </div>

              <p className="mt-4 text-sm text-zinc-400"></p>
            </div>
          </div>

          {/* BIG BOTTOM CTA */}
          <div className="mt-12 text-center">
            <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-2xl p-10 shadow-2xl shadow-cyan-500/15">
              <h3 className="font-[var(--font-heading)] text-2xl md:text-3xl font-extrabold">
                Ready to play?
              </h3>
              <p className="mt-3 text-zinc-300 text-lg">
                Join the Discord to enter the league, find matches, and put your RPS skills to the test!
              </p>

              <div className="mt-8 flex justify-center">
                <DiscordButton size="lg" />
              </div>
            </div>
          </div>

          <footer className="mt-12 text-center text-sm text-zinc-500">
            © {new Date().getFullYear()} Solana Rock Paper Scissors League
          </footer>
        </div>
      </section>
    </main>
  );
}
