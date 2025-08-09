import { useEffect, useRef, useState } from "react";
import { fetcher } from "../utils/fetcher";
import { useAuth } from "../auth/useAuth";
import { UserInfoInput } from "./UserInfoInput";

type PendingUser = {
  googleId: string;
  userName: string;
  email: string;
  isExisting: boolean;
};

const clientId = "858596999445-68n1cfki79j68u54esqpskfsu0fvta42.apps.googleusercontent.com";

export const GoogleLoginButton = () => {
  const googleDivRef = useRef<HTMLDivElement>(null);
  const { setUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null); 

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id && googleDivRef.current && clientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: unknown) => {
              try {
                const res = await fetcher('/auth/google-login', {
                  method: 'POST',
                  body: { token: (response as { credential: string }).credential }
                });
                if (res.isExisting === false) {
                  setPendingUser(res);
                  setShowModal(true);
                } else {
                  setUser(res);
                }
                window.location.reload()
              } catch (error) {
                console.error('Google login failed:', error, response);
              }
            }
          });
          window.google.accounts.id.renderButton(googleDivRef.current, {
            theme: "outline",
            size: "medium",
          });
        } catch (error) {
          console.error('Failed to initialize Google Sign-In:', error);
        }
      } else {
        setTimeout(initializeGoogleSignIn, 100);
      }
    };

    initializeGoogleSignIn();
  }, [setUser]);

  return (
    <>
      <div ref={googleDivRef} style={{ minHeight: '40px' }}>
        {!window.google && <div>Loading Google Sign-In...</div>}
      </div>
      {showModal && pendingUser && (
        <UserInfoInput
          userId={pendingUser.googleId}
          onClose={() => setShowModal(false)}
          onSubmit={(fields) => {
            setShowModal(false);
            setUser({ ...pendingUser, id: pendingUser.googleId, ...fields });
            window.location.reload();
          }}
        />
      )}
    </>
  );
};