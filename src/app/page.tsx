import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Super Trunfo Forza Horizon</p>
        <h1>Crie uma sala e dispute carta por carta.</h1>
        <Link className="primaryAction" href="/room/new">
          Criar sala
        </Link>
      </section>
    </main>
  );
}
