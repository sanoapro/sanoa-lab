export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto p-6 rounded-2xl border border-brand-border bg-white/70 shadow">
        <h1 className="font-heading text-3xl md:text-4xl mb-3 text-brand-primary">Hola Sanoa</h1>
        <p className="text-lg">
          Tu entorno está listo. <strong>Sanoa Lab</strong> corre en la nube con{" "}
          <em>Next.js + Tailwind</em>. 🎉
        </p>
        <p className="mt-4 text-sm opacity-80">
          Colores y tipografías de marca aplicadas (Poppins + Lato).
        </p>
      </div>
    </main>
  );
}
