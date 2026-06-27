import { Navbar } from "@/components/Navbar";
import { Contract } from "@/components/Contract";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Peer-to-Peer Energy Trading
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Register your smart meter, post surplus energy, place bids, and
              trade energy directly with peers on the Stellar network.
            </p>
          </div>
        </div>
        <Contract />
      </main>
      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        <p>WattSwap — Powered by Stellar Soroban</p>
      </footer>
    </>
  );
}
