// src/components/LeftSidebar/LeftSidebar.jsx

import React, { useContext, useEffect, useState } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { AppContext } from "../../context/AppContext";
import { db, logout } from "../../config/firebase";

const LeftSidebar = () => {
  const navigate = useNavigate();

  const {
    userData,
    chatData,
    setChatUser,
    setMessagesId,
    setChatVisible
  } = useContext(AppContext);

  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  /* ================= LOAD ALL USERS ================= */
  useEffect(() => {
    if (!userData?.id) return;

    const loadUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const users = snap.docs
        .map(d => d.data())
        .filter(u => u.id !== userData.id);

      setAllUsers(users);
    };

    loadUsers();
  }, [userData?.id]);

  /* ================= OPEN / CREATE CHAT ================= */
  const openChat = async (user) => {
    try {
      const chatId =
        userData.id > user.id
          ? userData.id + user.id
          : user.id + userData.id;

      // 🔹 Ensure messages doc exists
      const msgRef = doc(db, "messages", chatId);
      const msgSnap = await getDoc(msgRef);

      if (!msgSnap.exists()) {
        await setDoc(msgRef, { messages: [] });
      }

      // 🔹 Check if chat already exists
      const exists = chatData.some(c => c.messageId === chatId);

      if (!exists) {
        // current user
        await updateDoc(doc(db, "chats", userData.id), {
          chatsData: arrayUnion({
            messageId: chatId,
            rId: user.id,
            lastMessage: "",
            updatedAt: Date.now(),
            messageSeen: true
          })
        });

        // receiver
        await updateDoc(doc(db, "chats", user.id), {
          chatsData: arrayUnion({
            messageId: chatId,
            rId: userData.id,
            lastMessage: "",
            updatedAt: Date.now(),
            messageSeen: false
          })
        });
      }

      setMessagesId(chatId);
      setChatUser({ rId: user.id, userData: user });
      setChatVisible(true);
      setSearch("");

    } catch (err) {
      console.error("Open chat error:", err);
    }
  };

  /* ================= SEARCH ================= */
  const filteredUsers = search
    ? allUsers.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="ls">
      {/* ===== TOP ===== */}
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className="logo" alt="logo" />

          {/* MENU */}
          <div className="menu">
            <img
              src={assets.menu_icon}
              alt="menu"
              onClick={() => setMenuOpen(!menuOpen)}
            />

            {menuOpen && (
              <div className="sub-menu">
                <p onClick={() => navigate("/profile")}>Edit Profile</p>
                <hr />
                <p onClick={logout}>Logout</p>
              </div>
            )}
          </div>
        </div>

        {/* SEARCH */}
        <div className="ls-search">
          <img src={assets.search_icon} alt="search" />
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ===== LIST ===== */}
      <div className="ls-list">
        {/* SEARCH RESULTS */}
        {search &&
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="friends"
              onClick={() => openChat(user)}
            >
              <img src={user.avatar} alt="" />
              <p>{user.name}</p>
            </div>
          ))}

        {/* CHAT LIST */}
        {!search &&
          chatData.map((chat) => (
            <div
              key={chat.messageId}
              className="friends"
              onClick={() => openChat(chat.userData)}
            >
              <img src={chat.userData.avatar} alt="" />
              <div>
                <p>{chat.userData.name}</p>
                <span>{chat.lastMessage || "No messages yet"}</span>
              </div>
            </div>
          ))}

        {/* EMPTY */}
        {!search && chatData.length === 0 && (
          <p className="no-users">No chats yet</p>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
