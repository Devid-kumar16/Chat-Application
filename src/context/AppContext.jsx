import { doc, getDoc, updateDoc } from "firebase/firestore";
import { createContext, useState, useRef, useEffect } from "react";
import { db } from "../config/firebase";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);        // auth user
  const [profileData, setProfileData] = useState(null); // firestore profile
  const [chatData, setChatData] = useState(null);
  const [messagesId, setMessagesId] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatVisible,setChatVisible] = useState(false);

  const lastSeenInterval = useRef(null);
  const loadedUidRef = useRef(null); // ✅ prevents reloading same user

  const loadUserData = async (uid) => {
    try {
      // ✅ PREVENT INFINITE RELOAD FOR SAME USER
      if (loadedUidRef.current === uid) {
        return profileData;
      }
      loadedUidRef.current = uid;

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setProfileData(null);
        return null;
      }

      const profile = userSnap.data();
      setProfileData(profile);

      console.log("Profile loaded:", profile);

      // ✅ UPDATE LAST SEEN ONCE
      await updateDoc(userRef, { lastSeen: Date.now() });

      // ✅ CLEAR OLD INTERVAL
      if (lastSeenInterval.current) {
        clearInterval(lastSeenInterval.current);
      }

      // ✅ START ONLY ONE INTERVAL
      lastSeenInterval.current = setInterval(async () => {
        await updateDoc(userRef, { lastSeen: Date.now() });
      }, 60000);

      return profile;

    } catch (error) {
      console.error("loadUserData error:", error);
      return null;
    }
  };


  useEffect(()=>{
    if (userData) {
        const chatRef = doc(db,'chats', userData.id);
        const unSub = onSnapshot(chatRef,async (res)=> {
            const chatItems = res.data().chatData;
            const tempData = [];
            for(const item of chatItems){
                const userRef = doc(db,'users',item.rId);
                const userSnap = await getDoc(userRef);
                const userData = userSnap.data();
                tempData.push({...item, userData})
            }
            setChatData(tempData.sort(()=>b.updatedAt - a.updatedAt))
        })
        return () => {
            unSub();
        }
    }


  },[userData])

  const value = {
    userData,
    setUserData,
    profileData,
    setProfileData,
    chatData,
    setChatData,
    loadUserData,
    messagesId, setMessagesId,
    chatUser, setChatUser,
    messages, setMessages,
    chatVisible, setChatVisible
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
