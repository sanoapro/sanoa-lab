export default function NotFound() {
  return (
    <div className="glass-card bubble max-w-xl mx-auto mt-10 text-center space-y-2">
      <div className="text-5xl">
        <span className="emoji">🧭</span>
      </div>
      <h1 className="text-xl font-semibold">Página no encontrada (404)</h1>
      <p className="text-contrast/80">Uy… no pudimos encontrar lo que buscas.</p>
      <div className="flex justify-center gap-2 pt-2">
        <a className="glass-btn" href="/">
          <span className="emoji">🏠</span> Inicio
        </a>
        <a className="glass-btn" href="/dashboard">
          <span className="emoji">📊</span> Ir al dashboard
        </a>
      </div>
    </div>
  );
}
