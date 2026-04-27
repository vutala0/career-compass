export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 py-16 text-slate-900">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Career Compass
        </h1>
        <p className="mt-6 text-lg text-slate-600 sm:text-xl">
          Your AI career GPS. Coming soon.
        </p>
      </div>
      <footer className="mt-24 text-sm text-slate-400">
        Built by Wesly · v0.1
      </footer>
    </main>
  );
}