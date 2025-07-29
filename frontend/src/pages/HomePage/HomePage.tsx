import { useHealthCheck } from "../../hooks/useHealthCheck";
import "./HomePage.css";

export const HomePage = () => {
  const { status, error } = useHealthCheck();

  return (
    <div className="snapcore-home">
      <h1>Welcome to SnapCore</h1>
      <section>
        <h2>Backend Health</h2>
        {status && <p className="health-ok">Backend status: <strong>{status}</strong></p>}
        {error && <p className="health-error">{error}</p>}
      </section>
      <section>
        <h2>About the Project</h2>
        <p>
          SnapCore communities are built around a simplified ActivityPub-inspired protocol. Each team is a "community" and users register with a specific community (like <code>me@myteam.com</code>).
        </p>
        <ul className="feature-list">
          <li>Share posts across communities</li>
          <li>Discover and join communities</li>
        </ul>
      </section>
      <footer>
        <p>
          <strong>Note:</strong> This is a demo homepage for SnapCore.
        </p>
      </footer>
    </div>
  );
};