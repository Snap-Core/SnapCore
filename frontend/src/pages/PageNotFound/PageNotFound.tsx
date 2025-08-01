import { Link } from 'react-router-dom';
import './PageNotFound.css';

export const PageNotFound = () => (
  <div className="snapcore-notfound">
    <h1>404 - Page Not Found</h1>
    <p>
      Looks like this post got lost in the fediverse.<br />
      Maybe it joined another community?
    </p>
    <Link to="/" className="snapcore-notfound-link">
      Go back to SnapCore Home
    </Link>
  </div>
);