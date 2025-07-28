import { useEffect, useState } from "react";
import { fetcher } from "../utils/fetcher";

export function useHealthCheck() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetcher("/health")
      .then((data) => setStatus(data.status))
      .catch(() => setError("Backend not reachable"));
  }, []);

  return { status, error };
}