import RentByDistrict from "@/features/housing/affordability/RentByDistrict";

export const metadata = {
  title: "Housing — Magdeburg Pulse",
};

export default function HousingPage() {
  return (
    <main className="w-full max-w-[1450px] mx-auto p-6 lg:p-10">
      <RentByDistrict />
    </main>
  );
}
