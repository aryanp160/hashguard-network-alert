import { useLocation } from "wouter";
import { useEffect } from "react";

const NotFound = () => {
  const [location] = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location
    );
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="glass-card text-center p-8 rounded-xl border border-white/20 shadow-lg">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-[var(--aurora-cyan)] to-[var(--aurora-violet)] bg-clip-text text-transparent">404</h1>
          <p className="text-xl text-gray-300 mb-4">Oops! Page not found</p>
          <a href="/" className="inline-block mt-2 px-6 py-2 rounded-full bg-gradient-to-r from-[var(--aurora-cyan)] to-[var(--aurora-violet)] text-[var(--aurora-bg-dark)] font-medium hover:opacity-90 transition">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
