import TravelWizard from "@/components/TravelWizard";

export default function Home() {
  return (
    <div className="relative flex flex-col flex-1 items-center min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="w-full pt-10 pb-6 px-4 text-center">
        <p className="text-sm font-medium text-blue-400/80 tracking-widest uppercase mb-3">
          AI-Powered Travel Planning
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold gradient-text mb-3">
          Travel AI Agent
        </h1>
        <p className="text-lg text-gray-400 max-w-lg mx-auto">
          Tell us where you want to go. We&apos;ll handle the rest.
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-5xl px-4 py-6">
        <TravelWizard />
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-gray-600">
        Powered by Perplexity AI
      </footer>
    </div>
  );
}
