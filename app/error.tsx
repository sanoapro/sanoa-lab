"use client";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="glass-card bubble max-w-xl mx-auto mt-10 text-center space-y-2">
      <div className="text-5xl">
        <span className="emoji">🛠️</span>
      </div>
      <h1 className="text-xl font-semibold">Algo no salió bien</h1>
      <p className="text-contrast/80">{error?.message ?? "Error inesperado."}</p>
      <div className="flex justify-center gap-2 pt-2">
        <button className="glass-btn" onClick={() => reset()}>
          <span className="emoji">🔁</span> Reintentar
        </button>
        <a className="glass-btn" href="/dashboard">
          <span className="emoji">📊</span> Ir al tablero
        </a>
      </div>
    </div>
  );
}
