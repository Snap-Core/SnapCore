import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { fetcher } from "../utils/fetcher";
import { URLS } from "../enums/urls";

export function useProfilePicHandler(
  onSuccess: (file: File, profilePicUrl: string) => void,
  onError?: (errorMessage: string) => void
) {
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const { user: currentUser, setUser } = useAuth(); 


  const handleProfilePicChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const res = await fetch(`${URLS.API_HOST}/uploads`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload profile picture");

      const data = await res.json();
      const url = data?.profilePic;

      await fetcher(`/users`, {
        method: "PATCH",
        body: { id: currentUser?.id, profilePic: url },
      });

      if (url) {
        setProfilePic(url);
        onSuccess(file, url);
        if (setUser && currentUser) {
          setUser({ ...currentUser, profilePic: url });
        }
        // window.location.reload()
      } else {
        throw new Error("Upload did not return profilePic URL");
      }
    } catch (error: any) {
      const errorMsg = error.message || "Unknown error";
      console.error("Error uploading profile pic:", errorMsg);
      if (onError) onError(errorMsg);
    }
  };

  const clearProfilePic = () => setProfilePic(null);

  return {
    profilePic,
    handleProfilePicChange,
    clearProfilePic,
  };
}
