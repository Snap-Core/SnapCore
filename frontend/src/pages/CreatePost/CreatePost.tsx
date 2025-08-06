import { useState, type ChangeEvent, type FormEvent } from "react";
import "./CreatePost.css";
import { useAuth } from "../../auth/useAuth";
import { createPost } from "../../services/postService";
import { useNavigate } from "react-router-dom";

const MAX_TEXT = 1000;
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 15;
const MAX_FILES = 10;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedVideoTypes = ["video/mp4", "video/webm"];

export const CreatePost = () => {
  const [text, setText] = useState("");
  const [media, setMedia] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();


  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value.slice(0, MAX_TEXT));
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!text && media.length === 0) {
      setError("Post must have text, picture(s) or video(s).");
      return;
    }

    if (text.length > MAX_TEXT) {
      setError(`Text must be ≤ ${MAX_TEXT} characters.`);
      return;
    }

    if (media.length > 0) {
      if (media.length > MAX_FILES) {
        setError(`You can upload up to ${MAX_FILES} files.`);
        return;
      }
    }

    setError(null);

    if (!currentUser || !currentUser.username) {
      setError("You must be logged in to make a post.");
      return;
    }

    try {
      const newPost = await createPost({
        content: text,
        actor: currentUser.username,
        media: media,
      });
      console.log("Post created:", newPost);
      setSuccess("Your post was uploaded successfully!");

      setTimeout(() => {
        setSuccess(null);
        navigate("/feed");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    }
  };

  return (
    <div className="create-post-outer">
      <form className="create-post-form" onSubmit={handleSubmit}>
        <h2>Create a Post</h2>
        <div className="post-rules">
          <strong>Rules:</strong>
          <ul>
            <li>
              Upload up to {MAX_FILES} files.
            </li>
            <li>
              Images: (JPG, PNG, WEBP), each ≤{" "}
              {MAX_IMAGE_MB}MB
            </li>
            <li>
              Videos: (MP4, WEBP), each ≤{" "}
              {MAX_VIDEO_MB}MB
            </li>
          </ul>
        </div>
        <textarea
          placeholder="What's on your mind?"
          value={text}
          onChange={handleTextChange}
          maxLength={MAX_TEXT}
          className="post-textarea"
        />
        <div className="char-count">
          {text.length}/{MAX_TEXT}
        </div>
        <div className="file-inputs">
          <label className="file-label">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              multiple
              onChange={(e) => {
                if (!e.target.files) return;
                const files = Array.from(e.target.files);

                for (const file of files) {
                  if (![...allowedImageTypes, ...allowedVideoTypes].includes(file.type)) {
                    setError("Only JPG, PNG, WEBP images or MP4/WEBM videos are allowed.");
                    return;
                  }

                  if (allowedImageTypes.includes(file.type) && file.size > MAX_IMAGE_MB * 1024 * 1024) {
                    setError(`Each image must be ≤ ${MAX_IMAGE_MB}MB.`);
                    return;
                  }

                  if (allowedVideoTypes.includes(file.type) && file.size > MAX_VIDEO_MB * 1024 * 1024) {
                    setError(`Each video must be ≤ ${MAX_VIDEO_MB}MB.`);
                    return;
                  }
                }

                if (media.length + files.length > MAX_FILES) {
                  setError(`You can upload up to ${MAX_FILES} files.`);
                  return;
                }

                setMedia([...media, ...files]);
                setError(null);
              }}
            />

            Add Files
          </label>
        </div>
        {media.length > 0 && (
          <div className="preview-list">
            {media.map((img, i) => (
              <span key={i} className="preview-item">
                {img.name}
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemoveImage(i)}
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {error && <div className="error-message-text">{error}</div>}
        {success && <div className="success-message-text">{success}</div>}
        <button type="submit" className="submit-btn">
          Post
        </button>
      </form>
    </div>
  );
};