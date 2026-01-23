// src/pages/ProfileUpdate/ProfileUpdate.jsx

import React, { useEffect, useState, useContext } from "react";
import "./ProfileUpdate.css";
import assets from "../../assets/assets";

import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

import { db, auth } from "../../config/firebase";
import { useNavigate } from "react-router-dom";
import upload from "../../lib/upload";
import { AppContext } from "../../context/AppContext";

const ProfileUpdate = () => {
  const navigate = useNavigate();
  const { userData, loadUserData } = useContext(AppContext);

  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [prevImage, setPrevImage] = useState("");

  /* ================= LOAD EXISTING PROFILE ================= */
  useEffect(() => {
    if (!userData?.id) return;

    const loadProfile = async () => {
      const ref = doc(db, "users", userData.id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setBio(data.bio || "");
        setPrevImage(data.avatar || "");
      }
    };

    loadProfile();
  }, [userData]);

  /* ================= SAVE PROFILE ================= */
  const profileUpdate = async (e) => {
    e.preventDefault();

    if (!userData?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      if (!prevImage && !image) {
        toast.error("Please upload a profile picture");
        return;
      }

      let avatarUrl = prevImage;

      if (image) {
        avatarUrl = await upload(image);
      }

      const userRef = doc(db, "users", userData.id);

      await updateDoc(userRef, {
        name,
        bio,
        avatar: avatarUrl
      });

      // Ensure chats doc exists
      await setDoc(
        doc(db, "chats", userData.id),
        { chatsData: [] },
        { merge: true }
      );

      // ✅ refresh global context (SINGLE source of truth)
      if (typeof loadUserData === "function") {
        await loadUserData(userData.id);
      }

      toast.success("Profile updated successfully");

      // ✅ guaranteed redirect
      navigate("/chat", { replace: true });

    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Profile update failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>

          <label htmlFor="avatar">
            <input
              type="file"
              id="avatar"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />

            <img
              src={
                image
                  ? URL.createObjectURL(image)
                  : prevImage || assets.avatar_icon
              }
              alt="avatar"
            />
            Upload profile image
          </label>

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <textarea
            placeholder="Write profile bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          />

          <button type="submit">Save Profile</button>
        </form>

        <img
          className="profile-pic"
          src={
            image
              ? URL.createObjectURL(image)
              : prevImage || assets.logo_icon
          }
          alt="profile"
        />
      </div>
    </div>
  );
};

export default ProfileUpdate;
