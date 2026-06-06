"use client";

import { useState } from "react";
import rentData from "@/lib/data/rent_data_cleaned.json";

type RentRecord = {
  year: number;
  stadtteil: string;
  wohnflaechenklasse: string;
  nettokaltmiete_pro_qm: number;
  stichprobengroesse: number;
};

type DistrictSummary = {
  district: string;
  averageRent: number;
};

const formatEuro = (value: number) => `€${value.toFixed(2)} / m²`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const getHeatmapColor = (value: number) => {
  if (value < 5) return "fill-emerald-400/85 stroke-emerald-700/90";
  if (value < 6) return "fill-lime-300/85 stroke-lime-700/90";
  if (value < 7) return "fill-amber-300/85 stroke-amber-700/90";
  if (value < 8) return "fill-orange-300/85 stroke-orange-700/90";
  return "fill-rose-300/85 stroke-rose-700/90";
};

const computeDistrictSummaries = (records: RentRecord[]) => {
  const districtMap = new Map<string, { sum: number; count: number }>();

  for (const record of records) {
    const entry = districtMap.get(record.stadtteil);
    if (entry) {
      entry.sum += record.nettokaltmiete_pro_qm;
      entry.count += 1;
    } else {
      districtMap.set(record.stadtteil, {
        sum: record.nettokaltmiete_pro_qm,
        count: 1,
      });
    }
  }

  return Array.from(districtMap.entries()).map(([district, value]) => ({
    district,
    averageRent: value.sum / value.count,
  }));
};

const getYearRecords = (records: RentRecord[], year: number) =>
  records.filter((item) => item.year === year);

export default function RentByDistrict() {
  const records = rentData as RentRecord[];
  const years = Array.from(new Set(records.map((item) => item.year))).sort((a, b) => a - b);
  const earliestYear = years[0];
  const latestYear = years[years.length - 1];
  const latestRecords = getYearRecords(records, latestYear);
  const earliestRecords = getYearRecords(records, earliestYear);

  const latestAverage =
    latestRecords.reduce((sum, item) => sum + item.nettokaltmiete_pro_qm, 0) /
    latestRecords.length;
  const earliestAverage =
    earliestRecords.reduce((sum, item) => sum + item.nettokaltmiete_pro_qm, 0) /
    earliestRecords.length;
  const increasePercent = earliestAverage > 0
    ? ((latestAverage - earliestAverage) / earliestAverage) * 100
    : 0;

  const summaries = computeDistrictSummaries(latestRecords);
  const sortedSummaries = [...summaries].sort((a, b) => a.averageRent - b.averageRent);
  const cheapestLocalities = sortedSummaries.slice(0, 5);
  const mostExpensiveLocalities = sortedSummaries.slice(-5).reverse();

  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "price">("price");

  // Budget finder state
  const [budget, setBudget] = useState<number>(600);
  const [apartmentSize, setApartmentSize] = useState<number>(50);
  const [recommendations, setRecommendations] = useState<Array<{ district: string; estRent: number; status: string; diff: number }>>([]);

  const getBudgetStatus = (estRent: number, budgetVal: number) => {
    if (estRent <= budgetVal) return 'Within Budget';
    if (estRent <= budgetVal * 1.1) return 'Slightly Above';
    return 'Above Budget';
  };

  const findAreas = () => {
    if (!apartmentSize || apartmentSize <= 0) return;
    const results = summaries.map((s) => {
      const est = s.averageRent * apartmentSize;
      const status = getBudgetStatus(est, budget);
      return { district: s.district, estRent: est, status, diff: Math.abs(est - budget) };
    })
      .sort((a, b) => {
        const prio = (st: string) => (st === 'Within Budget' ? 0 : st === 'Slightly Above' ? 1 : 2);
        const pa = prio(a.status) - prio(b.status);
        if (pa !== 0) return pa;
        return a.diff - b.diff;
      })
      .slice(0, 5);

    setRecommendations(results);
  };

  const minDistrict = sortedSummaries[0];
  const maxDistrict = sortedSummaries[sortedSummaries.length - 1];

  const cards = [
    {
      title: "Average Rent",
      value: formatEuro(latestAverage),
      description: `Citywide average for ${latestYear}`,
      accent: "text-emerald-600",
       bg: "bg-green-50",
    },
    {
      title: "Most affordable Locality",
      value: minDistrict.district,
      description: `${formatEuro(minDistrict.averageRent)} avg rent`,
      accent: "text-emerald-600",
      bg: "bg-green-50",
    },
    {
      title: "Highest Rent Locality",
      value: maxDistrict.district,
      description: `${formatEuro(maxDistrict.averageRent)} avg rent`,
      accent: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "City Wide Increase",
      value: formatPercent(increasePercent),
      description: `${earliestYear} → ${latestYear}`,
      accent: increasePercent >= 0 ? "text-emerald-600" : "text-red-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.title}   className={`${card.bg} border border-zinc-200/80 rounded-2xl p-2 shadow-xs h-16 sm:h-20 flex flex-col justify-center`}>
            <span className="text-[9px] text-black font-bold uppercase tracking-wider">{card.title}</span>
            <div className={`text-lg font-black ${card.accent}`}>{card.value}</div>
            <span className="text-[8px] text-zinc-400 font-semibold">{card.description}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4.5 items-start">
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-2xl p-4.5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-black font-bold uppercase tracking-wider">All Districts</p>
              <h3 className="text-lg font-black text-zinc-900 mt-2">Average Rent by District</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("price")}
                className={`px-3 py-1 text-xs font-black rounded transition ${sortBy === "price" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"}`}
              >
                Price ↓
              </button>
              <button
                onClick={() => setSortBy("name")}
                className={`px-3 py-1 text-xs font-black rounded transition ${sortBy === "name" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"}`}
              >
                A-Z
              </button>
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-1.5">
            {[...summaries]
              .sort((a, b) =>
                sortBy === "price" ? a.averageRent - b.averageRent : a.district.localeCompare(b.district)
              )
              .map((item) => {
                const isAffordable = item.averageRent < 7;
                return (
                  <div
                    key={item.district}
                    onClick={() => setSelectedDistrict(selectedDistrict === item.district ? null : item.district)}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      selectedDistrict === item.district
                        ? "bg-zinc-900 border-zinc-900 text-white"
                        : "border-zinc-100 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate">{item.district}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-black ${isAffordable ? "text-emerald-600" : "text-orange-600"}`}>
                        {formatEuro(item.averageRent)}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${isAffordable ? "bg-emerald-500" : "bg-orange-500"}`} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs h-[380px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-base font-black text-zinc-900 uppercase tracking-wider">Top 5 Cheapest Districts</p>
              <p className="text-[10px] font-semibold text-zinc-400 mt-1">by average rent (€/m²)</p>
            </div>
          </div>
          <div className="space-y-2">
            {cheapestLocalities.map((item) => (
              <div key={item.district} className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 last:border-b-0 last:pb-0">
                <span className="text-sm font-semibold text-zinc-900 truncate">{item.district}</span>
                <span className="text-sm font-black text-zinc-800">{formatEuro(item.averageRent)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs h-[380px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-base font-black text-zinc-900 uppercase tracking-wider">Top 5 Expensive Districts</p>
              <p className="text-[10px] font-semibold text-zinc-400 mt-1">by average rent (€/m²)</p>
            </div>
          </div>
          <div className="space-y-2">
            {mostExpensiveLocalities.map((item) => (
              <div key={item.district} className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 last:border-b-0 last:pb-0">
                <span className="text-sm font-semibold text-zinc-900 truncate">{item.district}</span>
                <span className="text-sm font-black text-zinc-800">{formatEuro(item.averageRent)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs min-h-[250px]">
            <p className="text-sm font-semibold text-zinc-900">Where Can I Afford to Live?</p>
            <p className="text-xs text-zinc-500 mt-1">Plan your budget and see suitable areas</p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-[12px] text-zinc-600">Monthly Budget</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="mt-1 w-full border border-zinc-200 rounded px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="text-[12px] text-zinc-600">Apartment Size (m²)</label>
                <input
                  type="number"
                  value={apartmentSize}
                  onChange={(e) => setApartmentSize(Number(e.target.value))}
                  className="mt-1 w-full border border-zinc-200 rounded px-2 py-1 text-sm"
                />
              </div>

              <div>
                <button onClick={findAreas} className="mt-2 inline-flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white rounded px-3 py-2 text-sm">
                  Find My Areas
                </button>
              </div>

              <p className="text-[11px] text-zinc-500">Tip: Rent should not exceed ~30% of your monthly income for comfortable living.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Recommended for you</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Est. rent shown for selected size</p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {recommendations.length === 0 ? (
                  <div className="text-sm text-zinc-500">Enter your budget and apartment size, then click <strong>Find My Areas</strong>.</div>
                ) : (
                  recommendations.map((item) => (
                    <div key={item.district} className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-2 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className={`inline-block h-3 w-3 rounded-full ${item.status === 'Within Budget' ? 'bg-emerald-500' : item.status === 'Slightly Above' ? 'bg-amber-400' : 'bg-rose-500'}`} />
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">{item.district}</div>
                          <div className="text-[12px] text-zinc-500">{formatEuro(item.estRent)}</div>
                        </div>
                      </div>

                      <div className={`text-[12px] font-semibold ${item.status === 'Within Budget' ? 'text-emerald-600' : item.status === 'Slightly Above' ? 'text-amber-600' : 'text-rose-600'}`}>
                        {item.status}
                      </div>
                    </div>
                  ))
                )
              }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
