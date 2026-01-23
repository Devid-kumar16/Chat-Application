// src/lib/upload.js

const upload = async (file) => {
  if (!file) {
    throw new Error("No file selected");
  }

  const isVideo = file.type.startsWith("video/");
  const endpoint = isVideo
    ? "http://localhost:5000/api/upload/video"
    : "http://localhost:5000/api/upload/image";

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "File upload failed");
  }

  return data.fileUrl;
};

export default upload;
