import EnvironmentScreen from "@/features/environment/EnvironmentScreen";

export const metadata = {
  title: "Environment — Magdeburg Pulse",
};

export default function EnvironmentPage() {
  return (
    <main className="w-full max-w-[1450px] mx-auto p-6 lg:p-10">
      <EnvironmentScreen />
    </main>
  );
}
