export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main style={{ padding: 40 }}>
      <h1>EVNTSZN</h1>
      <p>Select your portal:</p>
      <ul>
        <li><a href="/curators">EVNTSZN Curator Network</a></li>
        <li><a href="/partners">Partners</a></li>
        <li><a href="/sponsors">Sponsors</a></li>
        <li><a href="/venues">Venues</a></li>
        <li><a href="/admin">Admin</a></li>
      </ul>
    </main>
  );
}
