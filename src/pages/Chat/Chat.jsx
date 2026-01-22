import React, { useEffect } from 'react'
import './Chat.css'
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar'
import ChatBox from '../../components/ChatBox/ChatBox'
import RightSidebar from '../../components/RightSidebar/RightSidebar'
import {AppContext} from '../../context/AppContext'
const Chat = () => {

  const {chatData, userData} = useContext(AppContext);
  const [loading, setLoading] = useState(true)

  useEffect(()=> {
    if(chatData && userData){
      setLoading(false)

    }
  },[chatData, userData])
  return (
    <div className="chat-page">
      {
        loading
        ?<p className='loading'>Loading...</p>
        : <div className="chat-layout">
        <LeftSidebar />
        <ChatBox />
        <RightSidebar />
      </div>
      }
    </div>
  )
}

export default Chat
