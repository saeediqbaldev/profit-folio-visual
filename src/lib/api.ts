// REST API client for the self-hosted backend.
const BASE = "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try { const data = await res.json(); if (data?.error) msg = data.error; } catch { /* ignore */ }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type UploadProgressHandler = (progress: { loaded: number; total: number; percent: number }) => void;

function uploadWithProgress(file: File, onProgress?: UploadProgressHandler): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/api/uploads`, true);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (!onProgress || !e.lengthComputable) return;
      onProgress({
        loaded: e.loaded, total: e.total,
        percent: Math.round((e.loaded / e.total) * 100),
      });
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error("Bad response")); }
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try { const d = JSON.parse(xhr.responseText); if (d?.error) msg = d.error; } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
  upload: (file: File, onProgress?: UploadProgressHandler) => uploadWithProgress(file, onProgress),
};
