import { useState } from "react";
import { fetcher } from "../utils/fetcher";
import "./UserInfoInput.css";
import { useProfilePicHandler } from "../hooks/useProfilePicHandler";
import { useAuth } from "../auth/useAuth";

const limits = {
  username: { min: 3, max: 20 },
  displayName: { min: 3, max: 30 },
  summary: { min: 10, max: 160 },
};

type UserInfoInputProps = {
  userId: string;
  onClose: () => void;
  onSubmit: (fields: { username: string; displayName: string; summary: string; profilePic: string }) => void;
};

export const UserInfoInput = ({ userId, onClose, onSubmit }: UserInfoInputProps) => {
  const [fields, setFields] = useState({
    username: "",
    displayName: "",
    summary: "",
    profilePic: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  function validate() {
    if (
      fields.username.length < limits.username.min ||
      fields.username.length > limits.username.max
    )
      return "Username must be 3-20 characters.";
    if (
      fields.displayName.length < limits.displayName.min ||
      fields.displayName.length > limits.displayName.max
    )
      return "Display name must be 3-30 characters.";
    if (
      fields.summary.length < limits.summary.min ||
      fields.summary.length > limits.summary.max
    )
      return "Bio must be 10-160 characters.";
    return "";
  }

  async function checkUsername(username: string) {
    if (username.length < limits.username.min) return;
    try {
      const res = await fetcher(`/users/${encodeURIComponent(username)}`, {
        method: "GET"
      });
      if (res?.user) {
        setError("Username already taken.");
      } else {
        setError("");
      }
    } catch {
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      const user = await fetcher(`/users`, {
        method: "PATCH",
        body: { id: userId, ...fields },
      });
      onSubmit({ fields, ...user });
      onClose();
    } catch (apiErr: unknown) {
      if (typeof apiErr === "object" && apiErr !== null) {
        const errObj = apiErr as { message?: string; error?: string };
        setError(errObj.message || errObj.error || "Failed to update profile.");
      } else {
        setError("Failed to update profile.");
      }
    } finally {
      setLoading(false);
    }
  }

  const {
    profilePic,
    handleProfilePicChange,
    clearProfilePic
  } = useProfilePicHandler(
    (_file, url) => {
      setFields(prev => ({ ...prev, profilePic: url }));
    },
    setError
  );

  const handleRemoveImage = () => {
    clearProfilePic();
    setFields({ ...fields, profilePic: "" });
    setError("");
  };


  return (
    <section>
      <form className="user-info-input-form" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Complete your profile</legend>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={fields.username}
              onChange={async (e) => {
                const username = e.target.value;
                setFields({ ...fields, username });
                await checkUsername(username);
              }}
              minLength={limits.username.min}
              maxLength={limits.username.max}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={fields.displayName}
              onChange={(e) =>
                setFields({ ...fields, displayName: e.target.value })
              }
              minLength={limits.displayName.min}
              maxLength={limits.displayName.max}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={fields.summary}
              onChange={(e) => setFields({ ...fields, summary: e.target.value })}
              minLength={limits.summary.min}
              maxLength={limits.summary.max}
              required
            />
          </div>
          {currentUser?.activated && (
            <>
              <div className="file-inputs">
                <label className="file-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleProfilePicChange}
                  />
                  Add Profile Picture
                </label>
              </div>

              {fields.profilePic && profilePic && (
                <div className="preview-list">
                  <span className="preview-item">
                    {profilePic.split("/").pop()}
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={handleRemoveImage}
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}
            </>
          )}

          {error && <div className="error">{error}</div>}
          <div className="actions">
            <button type="submit" disabled={loading}>Save</button>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
};