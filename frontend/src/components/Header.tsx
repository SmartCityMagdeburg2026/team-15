"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LeafIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M12 3a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9s9-4.03 9-9a9 9 0 0 0-9-9z" />
    <path d="M12 3v18" />
    <path d="M12 12c2-2 5-2 5-2s0 3-2 5" />
    <path d="M12 12c-2-2-5-2-5-2s0 3 2 5" />
  </svg>
);

const GlobeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export default function Header() {
  const pathname = usePathname() || "/";
  const nav = [
    { id: "city-pulse", label: "Home", href: "/" },
    { id: "mobility", label: "Mobility", href: "/mobility" },
    { id: "environment", label: "Environment", href: "/environment" },
    { id: "housing", label: "Housing & Affordability", href: "/housing" },
    { id: "map", label: "Map", href: "/map" },
    { id: "about", label: "About", href: "/about" }
  ];

  return (
    <header className="w-full border-b border-zinc-150 px-6 lg:px-12 py-5.5 bg-white flex flex-col md:flex-row justify-between items-center gap-6 relative z-45 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3.5">
        <div className="w-10.5 h-10.5 bg-[#0c6b5b] rounded-xl flex items-center justify-center text-white shadow-xs">
          <svg className="w-6.5 h-6.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-[19px] font-black text-[#0a2540] tracking-tight">Magdeburg Pulse</span>
          <span className="text-[13px] font-semibold text-zinc-400 border-l border-zinc-200 pl-3 tracking-wide hidden sm:inline">Smart city. Shared future.</span>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-7 sm:gap-9 text-[15.5px] font-black text-zinc-400">
        {nav.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link key={tab.id} href={tab.href} className={`pb-1 transition-all ${isActive ? "text-[#0c6b5b] border-b-2 border-[#0c6b5b] font-black" : "hover:text-zinc-800"}`}>
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2.5 bg-[#eefcf7] border border-green-200/80 rounded-lg px-3 py-1.5">
          <LeafIcon className="w-4 h-4 text-[#0c6b5b] fill-emerald-100/10" />
          <span className="text-[10px] font-black text-[#0c6b5b] uppercase tracking-wider">EU Green Cities</span>
        </div>
        <button className="flex items-center gap-2 text-[13px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-200/80 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer">
          <span>EN</span>
          <GlobeIcon className="text-zinc-400 w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
