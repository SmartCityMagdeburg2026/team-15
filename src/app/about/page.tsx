export const metadata = {
  title: "About — Magdeburg Pulse",
};

export default function AboutPage() {
  return (
    <main className="w-full max-w-[1450px] mx-auto p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-6 text-left py-2">
        <div>
          <h1 className="text-3xl font-black text-[#0a2540]">About Magdeburg Pulse</h1>
          <p className="text-sm text-zinc-500 mt-2">Magdeburg Pulse is an experimental, open-source civic data dashboard built for hackers, developers, and municipal officials. It showcases how localized IoT data streams can be integrated into a unified city intelligence experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">🛠️ Technology Stack</h2>
            <p className="text-[12px] text-zinc-500 font-semibold leading-relaxed">
              Developed using React, Next.js, and Tailwind CSS for responsive civic dashboards with reusable components and live data integration.
            </p>
          </div>
          <div className="bg-white border border-zinc-150 rounded-3xl p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">🔓 Open Data & APIs</h2>
            <p className="text-[12px] text-zinc-500 font-semibold leading-relaxed">
              The app demonstrates integration with public weather, air quality, transit, and hydrology sources for city monitoring and planning.
            </p>
          </div>
        </div>

        <div className="bg-white border border-zinc-150 rounded-3xl p-6 shadow-xs space-y-5">
          <h2 className="text-base font-black text-[#0a2540]">Why this dashboard?</h2>
          <div className="space-y-4 text-[13px] text-zinc-600 leading-relaxed font-semibold">
            <p>
              It is designed to help municipal teams and citizens understand urban conditions through clean telemetry, clear visual scoring, and actionable insights.
            </p>
            <p>
              Magdeburg Pulse uses live IoT feeds, river gauge logs, transit delay estimates, and air quality telemetry to surface what matters most for city operations and sustainability.
            </p>
            <p>
              The platform is intentionally modular: any city with open transit feeds, weather APIs, or sensor networks can adopt the same architecture.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-50 border border-zinc-150 rounded-3xl p-5 shadow-xs">
            <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider mb-2">🌿 Green Cities Pact</h3>
            <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
              Magdeburg aims to reduce emissions, improve mobility, and expand green infrastructure while keeping performance metrics transparent.
            </p>
          </div>
          <div className="bg-zinc-50 border border-zinc-150 rounded-3xl p-5 shadow-xs">
            <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wider mb-2">🚀 Roadmap</h3>
            <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
              Upcoming work includes predictive congestion modeling, citizen reporting, and more integrated smart services for communities.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
