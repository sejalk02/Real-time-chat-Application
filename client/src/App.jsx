import { useState, useEffect, useRef} from "react";
import  {io} from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");


socket.on("connect", () => {
  console.log("SOCKET CONNECTED:", socket.id);
});

socket.on("connect_error", (error) => {
  console.log("SOCKET CONNECTION ERROR:", error.message);
});

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profilePic, setProfilePic] = useState("/female-avatar.png");
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [deliveryStatus, setDeliveryStatus] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [showRegister, setShowRegister] =useState(false);
  const [name, setName] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]); 
   
   const [typingUser, setTypingUser]= useState("");
   const [onlineUsers, setOnlineUsers] = useState([]);
   const [notification, setNotification] = useState("");
   const fileInputRef = useRef(null);
   const [selectedFile,  setSelectedFile] = useState(null);
   const [showEmojiPicker, setShowEmojiPicker] =useState(false);
   const [deleteMenu, setDeleteMenu] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifs, setGifs] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState("female");

useEffect(() => {
  const loadMessages = async () => {
    if(!selectedUser) {
      setMessages([]);
      return;

    }
     
    const currentUser = users.find(
      (user) => user.email === email
    );
    if(!currentUser) {
      return;
    }
      
    setMessages([]);
    try{
      const response = await fetch(
        `http://localhost:5000/api/messages?sender=${currentUser._id}&receiver=${selectedUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      const data = await response.json();
      console.log("PRIVATE CHAT HISTORY:", data);

      if (!response.ok){
        console.log("Error loading messages:", data);
        return;
      }
      const formattedMessages = data.map((msg) => ({
        id: msg._id,
        text: msg.message,
        sender:
        String(msg.sender) === String(currentUser._id)
        ? "You"
        :selectedUser.name || "User",
        senderId: String(msg.sender),
        createdAt: msg.createdAt,
        mediaUrl: msg.mediaUrl,
        mediaName: msg.mediaName,
        deleted: msg.deleted === true,
        deletedForEveryone: msg.deletedForEveryone
      }));


      console.log("FORMATTED PRIVATE MESSAGES:",formattedMessages);

setMessages(formattedMessages);
  


    } catch (error) {
      console.log("Error loading messages:", error);
    }
  };
  loadMessages();
}, [selectedUser, users, email]);

useEffect(() => {
  const loadGroupMessages = async () => {
    if (!selectedGroup) {
      return;
    }

    const currentUser = users.find(
      (user) => user.email === email
    );

    
    if (!currentUser) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/group-messages?groupId=${selectedGroup._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("Error loading group messages:", data);
        return;
      }

      const formattedMessages = data.map((msg) => {
        const senderId = String(
          msg.sender?._id || msg.sender
        );

        return {
        id: msg._id,
        text: msg.message || "",
        sender:
          senderId === String(currentUser._id)
            ? "You"
            : msg.sender?.name || "User",
            senderId: senderId,
            createdAt: msg.createdAt,
            mediaUrl: msg.mediaUrl || "",
            mediaName: msg.mediaName || "",
            deleted: msg.deleted === true,
            deletedForEveryone: msg.deletedForEveryone
        };
      });
      

      console.log("Group history:", formattedMessages);
      setMessages(formattedMessages);

    } catch (error) {
      console.log("Error loading group messages:", error);
    }
  };

  loadGroupMessages();

}, [selectedGroup, users, email]);

useEffect(() => {
  const loadGroups = async () => {
    try {
      const token = localStorage.getItem("token");

      console.log("Loading groups...");
      console.log("Token exists:", !!token);

      const response = await fetch(
        "http://localhost:5000/api/groups",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      console.log("Groups response:", response.status, data);

      if (!response.ok) {
        console.log("Error loading groups:", data);
        return;
      }

      setGroups(data);

    } catch (error) {
      console.log("Error loading groups:", error);
    }
  };

  if (loggedIn) {
    loadGroups();
  }

}, [loggedIn]);
    
 useEffect(() => {
  if (!email || users.length === 0){
    return;
  }

  const currentUser = users.find(
    (user) => user.email === email
  );

  if(!currentUser){
    return;
  }

 
    console.log("Joining room:", currentUser._id);
    socket.emit("join", String(currentUser._id));

 }, [email, users]);
 useEffect(() => {
  const handleReceiveGroupMessage = (data) => {
console.log("GROUP MESSAGE RECEIVED BY THIS USER:", email);
console.log("GROUP DATA:", data);

    const currentUser = users.find(
      (user) => user.email === email
    );



    if(!currentUser) {
      return;
        }
    
    if (
     
      String(data.sender) !== String(currentUser._id) &&
      (
        !selectedGroup ||
        String(data.groupId) !== String(selectedGroup._id)
      )
    ) {
      console.log("🔴 ADDING GROUP BADGE:", data.groupId);

      setGroupUnreadCounts((prev) => ({
        ...prev,
        [data.groupId]: (prev[data.groupId] || 0) + 1
      }));
    }

if(!selectedGroup ||
  String(data.groupId) !== String(selectedGroup._id)
)  {
  return;
}


    const senderUser = users.find(
      (user) => String(user._id) === String(data.sender)
    );

    setMessages((oldMessages) => [
      ...oldMessages,
      {
        id: data.id,
        text: data.message || "",
        sender:
        String(data.sender) === String(currentUser._id)
         ? "You"
         : senderUser?.name || "User",
        senderId: String(data.sender),
        createdAt: data.createdAt || new Date(),
        mediaUrl: data.mediaUrl || "",
        mediaName: data.mediaName || ""
      }
    ]);
  };

  socket.on("receive_group_message", handleReceiveGroupMessage);

  return () => {
    socket.off("receive_group_message", handleReceiveGroupMessage);
  };
}, [users, email, selectedGroup]);
 useEffect(() => {
  const handleReceiveMessage = (data) => {
  // console.log("🔔 RECEIVE MESSAGE DATA:", data);


    const currentUser = users.find(
      (user) => user.email === email
    );

    if (
      currentUser &&
      String(data.receiver) === String(currentUser._id) &&
      (
        !selectedUser ||
        String(data.sender) !== String(selectedUser._id)
      )
    ) {
      const senderUser = users.find(
        (user) => String(user._id) === String(data.sender)
      );

      setNotification(
        `💬 ${senderUser?.name || "New user"} sent you a new message`
      );

      setTimeout(() => {
        setNotification("");
      }, 3000);
    }

  
    if (
      currentUser &&
      String(data.receiver) === String(currentUser._id) &&
      (
        !selectedUser ||
        String(data.sender) !== String(selectedUser._id)
      )
    ) {
      setUnreadCounts((prev) => ({
        ...prev,
        [data.sender]: (prev[data.sender] || 0) + 1
      }));
    }
    


    if (!currentUser || !selectedUser) {
      return;
    }

    const isCurrenChat =
      (
        String(data.sender) === String(currentUser._id) &&
        String(data.receiver) === String(selectedUser._id)
      ) ||
      (
        String(data.sender) === String(selectedUser._id) &&
        String(data.receiver) === String(currentUser._id)
      );

    if (!isCurrenChat) {
      return;
    }

    
    const senderName =
      String(data.sender) === String(currentUser._id)
        ? "You"
        : selectedUser.name;

  
    setMessages((oldMessages) => [
      ...oldMessages,
      {
        id: data.id,
        text: data.message,
        sender: senderName,
        mediaUrl: data.mediaUrl,
        mediaName: data.mediaName
      }
    ]);
  };



  socket.on("receive_message", handleReceiveMessage);


  
  const handleMessageDelivered = (data) => {
    setDeliveryStatus((prev) => ({
      ...prev,
      [data.messageId]: "delivered"
    }));
  };

  socket.on("message_delivered", handleMessageDelivered);


  
  return () => {
    socket.off("receive_message", handleReceiveMessage);
    socket.off("message_delivered", handleMessageDelivered);
  };

}, [users, email, selectedUser]);


useEffect(() => {
  if(!selectedGroup) {
    return;
  }

  socket.emit("join_group", selectedGroup?._id);
  console.log(
    "Joined group:",
    selectedGroup.name
  );
}, [selectedGroup]);


useEffect(() => {
  const handleUserOnline = (userId) => {
    setOnlineUsers((prev) => {
      const id = String(userId);

      if (prev.includes(id)) {
        return prev;
      }

      return [...prev, id];
    });
  };

  const handleUserOffline = (userId) => {
    setOnlineUsers((prev) =>
      prev.filter((id) => id !== String(userId))
    );
  };

  socket.on("user_online", handleUserOnline);
  socket.on("user_offline", handleUserOffline);

  return () => {
    socket.off("user_online", handleUserOnline);
    socket.off("user_offline", handleUserOffline);
  };
}, []);
useEffect(() => {
  const handleUserTyping = (data) => {
    const currentUser = users.find(
      (user) => user.email === email
    );

    if (!currentUser || !selectedUser) {
      return;
    }

    if (
      String(data.sender) ===
      String(selectedUser._id)
    ) {
      setTypingUser(selectedUser.name);
    }
  };

  const handleUserStopTyping = (data) => {
    if (!selectedUser) {
      return;
    }

    if (
      String(data.sender) ===
      String(selectedUser._id)
    ) {
      setTypingUser("");
    }
  };

  socket.on("user_typing", handleUserTyping);
  socket.on("user_stop_typing", handleUserStopTyping);

  return () => {
    socket.off("user_typing", handleUserTyping);
    socket.off("user_stop_typing", handleUserStopTyping);
  };
}, [selectedUser, users, email]);

const registerUser = async () => {
  try{

    const profilePic =
    selectedAvatar === "female"
    ? "/female-avatar.png"
    : "/male-avatar.png";

    console.log("SELECTED AVATAR:", selectedAvatar);
    console.log("PROFILE PIC:", profilePic);

    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
        profilePic: profilePic
      })
    });
    const data = await response.json();
    console.log("Register response:", data);
    setMessage(data.message)
    
    if(response.ok) {
      setName("");
      setEmail("");
      setPassword("");
    
    }

  } catch (error) {
    console.log("Register error:", error);
    setMessage("Server connection failed");
  }
};


  
  const loginUser = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      setMessage(data.message);

      if (data.token) {
        localStorage.setItem("token", data.token);
        setLoggedIn(true);
        getUsers();
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Could not connect to server");
    }
  };

  const getUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setUsers(data);
        
    } catch (error) {
      console.log("Error getting users:", error);
    }
  };

  const sendMessage = async () => {

   // alert("Send button is working!");
    if (!chatMessage.trim() && !selectedFile){
      return;
    } 
    
    if (!selectedUser && !selectedGroup) {
      return;
    }
 
      const currentUser = users.find(
        (user) => user.email === email
      );


      if (selectedGroup) {
  try {
    if (!currentUser) {
      console.log("Current user not found");
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/group-messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          groupId: selectedGroup._id,
          message: chatMessage,
          mediaUrl: selectedFile?.url || "",
          mediaName: selectedFile?.name || ""
        })
      }
    );

    const data = await response.json();
    console.log("Group message response:", data);

    if (!response.ok) {
      console.log("Group message failed:", data);
      return;
    }
 



    console.log("CURRENT USER:", currentUser);
    console.log("SENDING GROUP MESSAGE FROM:", currentUser._id);

    socket.emit("send_group_message", {
      id: data.data._id,
      groupId: selectedGroup._id,
      sender: currentUser._id,
      message: chatMessage,
      mediaUrl: selectedFile?.url || "",
      mediaName: selectedFile?.name || "",
      createdAt: data.data.createdAt

   })
  // setMessages((oldMessages) => [
     // ...oldMessages,
   // {
    //    id: data.data._id,
      //  text: chatMessage,
        //sender: "You",
        //senderId: String(currentUser._id),
        //mediaUrl: selectedFile?.url || "",
       //mediaName: selectedFile?.name || "",
       // createdAt: data.data.createdAt
     //}
  // ]);
    setChatMessage("");
    setSelectedFile(null);

    return;

  } catch (error) {
    console.log("Group message error:", error);
    return;
  }
}
      if (!currentUser) {
        alert("Current user not found.");
        return;
      }
      try{
      const response = await fetch(
        "http://localhost:5000/api/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            sender: currentUser._id,
            receiver: selectedUser._id,
            message: chatMessage,
            mediaUrl: selectedFile?.url || "",
            mediaName: selectedFile?.name || ""
          })
        }
      );
   

      const data = await response.json();
      console.log("Server response:", data);

      if (response.ok) {

        console.log("SENDING SOCKET MESSAGE:", {
          sender: currentUser._id,
          receiver: selectedUser._id,
          message: chatMessage

        })
        socket.emit("send_message", {
          id: data.data._id,
          sender: currentUser._id,
          receiver: selectedUser._id,
          message: chatMessage,
          mediaUrl: selectedFile?.url || selectedFile?.mediaUrl || "",
          mediaName: selectedFile?.name || selectedFile?.mediaName ||""
        });

        setChatMessage("");
        setSelectedFile(null);
      } else{
        console.log("Message save failed:", data);

        alert(
          data.message || "Message could not be sent."
        );
      }
    
        
    } catch (error) {
      console.log("Send message error:", error);
      alert("Could not connect to server. ");
    }
  };
    


  const deleteMessage = async (messageId) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5000/api/messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log("Delete failed:", data);
      return;
    }

    setMessages((oldMessages) =>
      oldMessages.map((msg) =>
        String(msg.id) === String(messageId)
          ? {
              ...msg,
              text: "This message was deleted",
              mediaUrl: "",
              mediaName: "",
              deleted: true
            }
          : msg
      )
    );

    setDeleteMenu(null);

  } catch (error) {
    console.log("Delete message error:", error);
  }
};
    
    const createGroup = async () => {
      if(!groupName.trim()) {
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const   response  = await fetch(
          "http://localhost:5000/api/groups",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              name: groupName,
              members: selectedMembers

            })
          }
        );

        const  data = await response.json();
        if (!response.ok) {
          console.log("Group creation failed:", data);
          return;
        }

        setGroups((prevGroups) => [
          data.group,
          ...prevGroups
        ]);

        setGroupName("");
        setSelectedMembers([]);
        setShowGroupForm(false);

        console.log("Group created successfully");
      } catch(error) {
        console.log("Create group error:", error);
      }
    };
    
const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadResponse = await fetch(
      "http://localhost:5000/api/upload",
      {
        method: "POST",
        body: formData
      }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
      console.log("Upload failed:", uploadData );
      return;
    }

    console.log("Upload successful:",uploadData );

    setSelectedFile({
      file: file,
      url: uploadData.fileUrl,
      name: uploadData.fileName
    });

  } catch (error) {
    console.log("Upload error:", error);
  }
};
  

const searchGifs = async () => {

  
  try {
    const query = gifSearch.trim() || "funny";

    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${
        import.meta.env.VITE_GIPHY_API_KEY
      }&q=${encodeURIComponent(query)}&limit=20`
    );

    const data = await response.json();

    setGifs(data.data || []);
  } catch (error) {
    console.log("GIF search error:", error);
  }
};

const sendGif = async (gifUrl, gifTitle) => {
  try {
    const currentUser = users.find(
      (user) => user.email === email
    );

    if (!currentUser || !selectedUser) {
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sender: currentUser._id,
          receiver: selectedUser._id,
          message: "",
          mediaUrl: gifUrl,
          mediaName: gifTitle
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log("GIF send failed:", data);
      return;
    }

    socket.emit("send_message", {
      id: data.data._id,
      sender: currentUser._id,
      receiver: selectedUser._id,
      message: "",
      mediaUrl: gifUrl,
      mediaName: gifTitle
    });

    setShowGifPicker(false);
    setGifSearch("");
    setGifs([]);

  } catch (error) {
    console.log("GIF send error:", error);
  }
};



const sendGroupGif = async (gifUrl, gifTitle) => {
  try {
    if (!selectedGroup) {
      console.log("No group selected");
      return;
    }

    const currentUser = users.find(
      (user) => user.email === email
    );

    if (!currentUser) {
      console.log("Current user not found");
      return;
    }

    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/group-messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          groupId: selectedGroup._id,
          message: "",
          mediaUrl: gifUrl,
          mediaName: gifTitle
          
        })
      }
    );

    const data = await response.json();
  console.log("GROUP GIF RESPONSE:", data);
    

    if (!response.ok) {
      console.log("Group GIF send failed:", data);
      return;
    }

    socket.emit("send_group_message", {
      id: data.data._id,
      groupId: selectedGroup._id,
      sender: currentUser._id,
      message: "",
      mediaUrl: gifUrl,
      mediaName: gifTitle
  
    });

    console.log("GROUP GIF SOCKET EMITTED");

    setShowGifPicker(false);
    setGifSearch("");
    setGifs([]);

  } catch (error) {
    console.log("Group GIF error:", error);
  }
};
  

  if (!loggedIn) {
    return (
      <div className="app login-page">
        <h1>Real-Time Chat Application 💬</h1>
       
<div className="register-box">
    <h2>Create New Account</h2>
    <input type="text" 
    placeholder="Enter your name"
    value={name}
    onChange={(e) => setName(e.target.value)}/>

    <input type="email"
    placeholder="Enter your email" 
    value={email}
    onChange={(e) => setEmail(e.target.value)}/>
    
    <input type="password"
    placeholder="Enter your password" 
    value={password}
    onChange={(e) => setPassword(e.target.value)}/>


<div className="avatar-choice">
  <p>Choose profile picture:</p>

  <button
    type="button"
    onClick={() => setSelectedAvatar("female")}
  >
    👩 Female
  </button>

  <button
    type="button"
    onClick={() => setSelectedAvatar("male")}
  >
    👨 Male
  </button>
</div>
    
    <button onClick={registerUser}>
      Register
    </button>
    </div>
        <div className="register-box">
          <h2>Login</h2>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={loginUser}>
            Login
          </button>

          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app chat-page">
      {notification && (
        <div className="message-notification">
          {notification}
          </div>
      )}
      <h1>Real-Time Chat Application💬</h1>
 <button  className="logout-button"onClick={() => {
          localStorage.clear();
          setLoggedIn(false);
          setEmail("");
          setPassword("");
          setUsers([]);
          setSelectedUser(null);
          setMessages([]);
        }}>
          Logout
        </button>
      <div className="chat-container">

        <div className="users">
          <h2>Users</h2>


          <div className="user-search">
            <input type="text"
            placeholder="Serach users..." 
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}/>
          </div>

          <ul>
            {users .filter((user) => user.name.toLowerCase().includes(userSearch.toLowerCase())
            ).map((user) => (
              <li
                key={user._id} 
                onClick={() =>{
                  setMessages([]);
                  setSelectedUser(user);

                  setUnreadCounts((prev) => ({
                    ...prev,
                    [user._id]: 0
                  }));
                }}
              >
                
           <img
           src={user.profilePic}
           alt={user.name}
           className="profile-pic"
           />
                          
           <span className="user-name-text">{user.name}</span>
                <span className="online-status">
                {onlineUsers.includes (String(user._id)) || user.email === email ?"🟢" : "⚪"}
                </span>
                {unreadCounts[user._id] > 0 && (
                  <span className="unread-badge">
                    {unreadCounts[user._id]}
                  </span>
                )}
              
              </li>
            ))}
          </ul>

          <div className="groups-section">
            <div className="groups-title">
              <h2>Groups</h2>

              <button
                 type="button"
                 onClick={() => setShowGroupForm(true)}
              >  
              +
              </button>
            </div>

            <ul>
              {groups.map((group) => (
                <li
                key={group._id}
                onClick={() => {
                  setSelectedGroup(group);
                  setSelectedUser(null);
                  setMessages([]);

                  

                  
                  setGroupUnreadCounts((prev) => ({
                    ...prev,
                    [group._id]: 0
                  }));

                }}

                > 

                <div className="group-name-row">
                <span>👥 {group.name} </span>

                {groupUnreadCounts[group._id] > 0 && (
                  <span className="unread-badge">
                    {groupUnreadCounts[group._id]}
                    </span>
                )}
                </div>

                </li>

              ))}
            </ul>
          </div>

          {showGroupForm && (
            <div className="group-form">
              <h3>Ceate Group</h3>

              <input type="text" 
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}/>
              <h4>Select Members</h4>

              {users
              .filter((user) => user.email !== email)
              .map((user) => (
                <label key={user._id}>
                  <input 
                  type="checkbox"
                  checked={selectedMembers.includes(user._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMembers((prev) => [
                        ...prev,
                        user._id
                      ]);
                    } else {
                      setSelectedMembers((prev) =>
                      prev,filter((id) => id !== user._id)
                    );
                    }
                  }}
                  />
                  {user.name}
                </label>
              ))
              
              }

              <button
               type="button"
               onClick={createGroup}
               
               >

                Create
               </button>

               <button
               type="button"
               onClick={() => {
                setShowGroupForm(false);
                setGroupName("");
                setSelectedMembers([]);
               }}
               >

                Cancel
               </button>
            </div>
          )}
        </div>

        <div className="chat">

          <div className="chat-header">
  {selectedUser ? (
    <>
      <div className="user-name">
        {selectedUser.name}
      </div>

      <div className="message-search">
        <input type="text"
        placeholder="Search messages..."
        value={messageSearch}
        onChange={(e) => setMessageSearch(e.target.value)} 
        />
      </div>

      <div className="user-status">
        <div className="user-status">
  {selectedUser

  ? onlineUsers.includes(String(selectedUser._id))
    ? "🟢 Online"
    : "⚪ Offline"
  : ""}
</div>
{typingUser && selectedUser && (
  <div className="typing-indicator">
    {typingUser} is typing...

</div>
)}
      </div>
    </>
  ) : selectedGroup ? (
    <>
    <div className="user-name">
      👥 {selectedGroup.name}
    </div>

    <div className="user-status">
      👥 Group Chat
    
      {String(selectedGroup.admin?._id || selectedGroup.admin) ===
        String(users.find((user) => user.email === email)?._id) && (
        <button
          type="button"
          className="delete-group-button"
          onClick={async () => {
            const confirmDelete = window.confirm(
              "Are you sure you want to delete this group?"
            );

            if (!confirmDelete) {
              return;
            }

            try {
              const token = localStorage.getItem("token");

              const response = await fetch(
                `http://localhost:5000/api/groups/${selectedGroup._id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );

              const data = await response.json();

              if (!response.ok) {
                alert(data.message);
                return;
              }

              alert("Group deleted successfully");

              setGroups((oldGroups) =>
                oldGroups.filter(
                  (group) =>
                    group._id !== selectedGroup._id
                )
              );

              setSelectedGroup(null);
              setMessages([]);

            } catch (error) {
              console.log("Delete group error:", error);
            }
          }}
        >
          🗑️ Delete Group
        </button>
      )}
    </div>
  </>
) : (
    

    <div className="user-name">
      Select a user or group
    </div>
  )}
</div>
          <div className="messages">

  
  {selectedUser && (
    <>
      {messages
        .filter(
          (msg) =>
            (msg.text || "")
              .toLowerCase()
              .includes((messageSearch || "").toLowerCase()) 
        
)
        .map((msg, index) => (
          <div
            key={msg.id || index}
            className={`message ${
              msg.sender === "You" ? "sent" : "received"
            }`}
          >
            <strong>{msg.sender}:</strong>

            {msg.deleted ? (
              <span className="deleted-message">
                This message was deleted
              </span>
            ) : (
              <>
                <span>{msg.text}</span>

                {msg.mediaUrl && typeof msg.mediaUrl === "string" &&(
                  <div className="shared media">
                    {msg.mediaName
                      ?.toLowerCase()
                      .endsWith(".pdf") ? (
                      <div className="shared-file">
                        📄 {msg.mediaName}

                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={msg.mediaUrl}
                        alt={msg.mediaName || "Shared image"}
                        className="shared-image"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                )}
              </>
            )}

      
            {msg.sender === "You" && !msg.deleted && (
              <button
                type="button"
                className="message-meu-button"
                onClick={() =>
                  setDeleteMenu(
                    deleteMenu === msg.id ? null : msg.id
                  )
                }
              >
                ⋮
              </button>
            )}

            {deleteMenu === msg.id && (
              <div className="delete-menu">
                <button
                  type="button"
                  onClick={() => deleteMessage(msg.id)}
                >
                  🗑️ Delete for everyone
                </button>
              </div>
            )}

            <span className="message-time">
              {new Date(
                msg.createdAt || Date.now()
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>

            {msg.sender === "You" &&
              deliveryStatus[msg.id] === "delivered" && (
                <span className="delivery-status">
                  ✓
                </span>
              )}
          </div>
        ))}
    </>
  )}

  {selectedGroup && (
    <>
      {messages
        .filter(
          (msg) =>
            (msg.text || "")
              .toLowerCase()
              .includes((messageSearch || "").toLowerCase()) ||
            msg.mediaUrl
        )
        .map((msg, index) => (
          <div
            key={msg.id || index}
            className={`message ${
       msg.sender === "You"
       ? "sent"
       : "received"
            }`}
          >
            <strong>{msg.sender}:</strong>

            {msg.deleted ? (
              <span className="deleted-message">
                This message was deleted
              </span>
            ) : (
              <>
                <span>{msg.text}</span>

                {msg.mediaUrl && typeof msg.mediaUrl === "string" && (
                  <div className="shared media">
                    {msg.mediaName
                      ?.toLowerCase()
                      .endsWith(".pdf") ? (
                      <div className="shared-file">
                        📄 {msg.mediaName}

                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={msg.mediaUrl}
                        alt={msg.mediaName || "Shared image"}
                        className="shared-image"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                )}
              </>
            )}

            <span className="message-time">
              {new Date(
                msg.createdAt || Date.now()
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          </div>
        ))}
    </>
  )}

</div>

                 

         {(selectedUser || selectedGroup )&& (
         
<div className="chat-input-wrapper">

  {showEmojiPicker && (
    <div className="emoji-picker">
      {[
        "😀","😃","😄","😁","😆","😅","😂","🤣",
        "😊","😇","🙂","🙃","😉","😌","😍","🥰",
        "😘","😗","😙","😚","😋","😛","😝","😜",
        "🤪","🤨","🧐","🤓","😎","🤩","🥳","😏",
        "😢","😭","😡","🤬","😱","😴","🤗","🤔",
        "👍","👎","👏","🙌","🙏","❤️","💔","🔥",
        "🎉","💯","✨","💕","💖","🤣","😂","😎"
      ].map((emoji, index) => (
        <button
          type="button"
          key={index}
          onClick={() => {
            setChatMessage((prev) => prev + emoji);
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )}


  <div className="message-input-box">

    
    <button
      type="button"
      className="emoji-button"
      onClick={() => setShowEmojiPicker((prev) => !prev)}
    >
      😊
    </button>

  
    <input
      type="text"
      placeholder="Type a message..."
      value={chatMessage}
      onChange={(e) => {
        const value = e.target.value;

        setChatMessage(value);

        if (selectedUser) {
          const currentUser = users.find(
            (user) => user.email === email
          );

          if (currentUser) {
            if (value.trim() !== "") {
              socket.emit("typing", {
                sender: currentUser._id,
                receiver: selectedUser._id
              });
            } else {
              socket.emit("stop_typing", {
                sender: currentUser._id,
                receiver: selectedUser._id
              });
            }
          }
        }
      }}
    />

 
    <button
      type="button"
      className="media-button"
      onClick={() => fileInputRef.current.click()}
    >
      🔗
    </button>

  
    <button
      type="button"
      className="gif-button"
      onClick={() => {
        setShowGifPicker((prev) => !prev);

        if(!showGifPicker) {
          setGifSearch("");
        }
      }}
    >
      GIF
    </button>

  </div>


{showGifPicker && (
  <div className="gif-picker">

    <div className="gif-search-box">
      <input
        type="text"
        placeholder="Search GIFs..."
        value={gifSearch}
        onChange={(e) => {
          const value = e.target.value;
          setGifSearch(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            searchGifs();
          }
        }}
      />

      <button
        type="button"
        onClick={searchGifs}
      >
        🔍
      </button>
    </div>

    <div className="gif-grid">
      {gifs.map((gif) => (
        <img
          key={gif.id}
          src={gif.images.fixed_width.url}
          alt={gif.title || "GIF"}
          className="gif-item"
          onClick={() => {
            if(selectedGroup) {
              sendGroupGif(
                gif.images.original.url,
              gif.title || "GIF"

              );
            } else {
            sendGif(
              gif.images.original.url,
              gif.title || "GIF"
            );
          }
          }}
        />
      ))}
    </div>

    <div className="giphy-credit">
      Powered by GIPHY
    </div>

  </div>
)}

  <button
    type="button"
    className="send-button"
    onClick={sendMessage}
  >
    ➤
  </button>

</div>

    )}
<input 
type="file"
ref={fileInputRef}
accept="image/*, .pdf, .gif"
style={{display: "none"}}
onChange={(e) => {
    const file = e.target.files[0];

    if(file){
      console.log("FILE SELECTED:", file.name);
    uploadFile(file);
}}}
/>


{selectedFile  && (
  <span className="selected-file">
    {selectedFile.name}
  </span>
)}
              

              
              


            </div>
          

        </div>
      </div>
    
  );

}


export default App;