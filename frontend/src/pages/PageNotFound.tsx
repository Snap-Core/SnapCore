import { Link } from 'react-router-dom'

export const PageNotFound = () => (
  <div style={{ textAlign: 'center', marginTop: '4rem' }}>
    <h1>404 - Page Not Found</h1>
    <p>
      Looks like this post got lost in the fediverse.<br />
      Maybe it joined another community?
    </p>
    <Link to="/" style={{ color: '#61dafb', textDecoration: 'underline' }}>
      Go back to SnapCore Home
    </Link>
  </div>
)