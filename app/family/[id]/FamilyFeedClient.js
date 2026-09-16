"use client";

import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function FamilyFeedClient({ familyId, initialPosts, currentUserId, isAdmin }) {
  const [posts, setPosts] = useState(initialPosts);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  async function handleDelete(postId) {
    if (!confirm("Delete this post? This can't be undone.")) return;
    setDeletingId(postId);
    const res = await fetch(`/api/families/${familyId}/posts/${postId}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not delete that post.");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function resetForm() {
    setCaption("");
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!caption.trim() && !file) {
      setError("Add a photo or write something before posting.");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = null;

      if (file) {
        setProgressLabel("Uploading photo…");
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        imageUrl = blob.url;
      }

      setProgressLabel("Posting…");
      const res = await fetch(`/api/families/${familyId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not post. Please try again.");
        setUploading(false);
        setProgressLabel("");
        return;
      }

      setPosts((prev) => [
        { ...data.post, author: "You", user_id: currentUserId },
        ...prev,
      ]);
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Could not post. Please try again.");
    } finally {
      setUploading(false);
      setProgressLabel("");
    }
  }

  return (
    <div>
      <form className="card" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="caption">Share an update</label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's happening?"
            maxLength={2000}
          />
        </div>

        <div className="field">
          <label htmlFor="photo">Photo (optional)</label>
          <input id="photo" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
        </div>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Preview"
            style={{ maxHeight: 200, borderRadius: 8, marginBottom: 14, display: "block" }}
          />
        )}

        {error && <div className="error">{error}</div>}
        {uploading && <div className="progress">{progressLabel}</div>}

        <button type="submit" disabled={uploading}>
          {uploading ? "Posting…" : "Post to family"}
        </button>
      </form>

      {posts.length === 0 ? (
        <div className="card empty-state">No posts yet. Be the first to share something!</div>
      ) : (
        posts.map((post) => {
          const canDelete = isAdmin || post.user_id === currentUserId;
          return (
            <div key={post.id} className="post">
              {post.image_url && <img src={post.image_url} alt={post.caption || "Family photo"} />}
              <div className="post-body">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="post-meta">
                    <span className="post-author">{post.author}</span> · {formatDate(post.created_at)}
                  </div>
                  {canDelete && (
                    <button
                      className="btn-secondary"
                      style={{ padding: "2px 10px", fontSize: "0.8rem" }}
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                    >
                      {deletingId === post.id ? "Deleting…" : "Delete"}
                    </button>
                  )}
                </div>
                {post.caption && <div>{post.caption}</div>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
