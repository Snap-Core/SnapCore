import { useEffect, useRef } from "react";
import { fetcher } from "../utils/fetcher";
import { useAuth } from "../auth/useAuth";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const GoogleLoginButton = () => {
  const googleDivRef = useRef<HTMLDivElement>(null);
  const { setUser } = useAuth();

  useEffect(() => {
    if (window.google?.accounts?.id && googleDivRef.current && clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: unknown) => {
          try {
            await fetcher('/auth/google-login', {
              method: 'POST',
              body: { token: (response as { credential: string }).credential }
            });
          } catch (error) {
            console.error('Google login failed:', error, response);
          }
        }
      });
      window.google.accounts.id.renderButton(googleDivRef.current, {
        theme: "outline",
        size: "medium",
      });
    }
  }, [setUser]);

  return <div ref={googleDivRef}></div>;
};