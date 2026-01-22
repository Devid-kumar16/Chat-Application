import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "firebase/storage";

import { app } from "../config/firebase"; // ✅ FIXED PATH

const upload = async (file) => {
  const storage = getStorage(app);

  const storageRef = ref(
    storage,
    `images/${Date.now()}_${file.name}`
  );

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",

      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress.toFixed(2) + "% done");
      },

      (error) => {
        console.error("Upload failed:", error);
        reject(error);
      },

      async () => {
        const downloadURL = await getDownloadURL(
          uploadTask.snapshot.ref
        );
        resolve(downloadURL);
      }
    );
  });
};

export default upload;
