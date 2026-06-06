import MobilityScreen from "@/features/mobility/MobilityScreen";

export const metadata = {
  title: "Mobility — Magdeburg Pulse",
};

export default function MobilityPage() {
  return (
    <main className="w-full max-w-[1450px] mx-auto p-6 lg:p-10">
      <MobilityScreen />
    </main>
  );
}
