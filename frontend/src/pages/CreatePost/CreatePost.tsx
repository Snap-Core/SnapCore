import { useState, type ChangeEvent, type FormEvent } from "react";
import { fetcher } from "../../utils/fetcher";
import "./CreatePost.css";

const MAX_TEXT = 1000;
const MAX_IMAGES = 10;
const MAX_IMAGE_MB = 5;

export const CreatePost = () => {
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value.slice(0, MAX_TEXT));
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!text && images.length === 0) {
      setError("Post must have text or images.");
      return;
    }

    if (text.length > MAX_TEXT) {
      setError(`Text must be ≤ ${MAX_TEXT} characters.`);
      return;
    }

    if (images.length > 0) {
      if (images.length > MAX_IMAGES) {
        setError(`You can upload up to ${MAX_IMAGES} images.`);
        return;
      }
      for (const file of images) {
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
          setError(`Each image must be ≤ ${MAX_IMAGE_MB}MB.`);
          return;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setError("Only JPG, PNG, or WEBP images are allowed.");
          return;
        }
      }
    }

    setError(null);

    const payload: any = {
      text: text || undefined,
      images: images.length > 0 ? images.map((img) => img.name) : undefined,
    };

    try {
      await fetcher("/posts", {
        method: "POST",
        body: payload,
      });
      setText("");
      setImages([]);
      setSuccess("Your post was uploaded successfully!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.error || "Failed to create post.");
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
              Images: up to {MAX_IMAGES} images (JPG, PNG, WEBP), each ≤{" "}
              {MAX_IMAGE_MB}MB
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
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                if (!e.target.files) return;
                const files = Array.from(e.target.files);

                for (const file of files) {
                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    setError("Only JPG, PNG, or WEBP images are allowed.");
                    return;
                  }
                  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
                    setError(`Each image must be ≤ ${MAX_IMAGE_MB}MB.`);
                    return;
                  }
                }

                if (images.length + files.length > MAX_IMAGES) {
                  setError(`You can upload up to ${MAX_IMAGES} images.`);
                  return;
                }

                setImages([...images, ...files]);
                setError(null);
              }}
            />
            Add Images
          </label>
        </div>
        {images.length > 0 && (
          <div className="preview-list">
            {images.map((img, i) => (
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