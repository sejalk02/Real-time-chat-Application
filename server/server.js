const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server} = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const multer = require("multer");
const path = require("path");


require("dotenv").config();
const cors = require("cors"); 

const User = require("./models/user");
const Message = require("./models/Message");
const Group = require("./models/Group");
const { group, groupCollapsed, profile } = require("console");

const app = express();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage
});


app.use("/uploads", express.static(path.join(__dirname,  "uploads")));
const PORT = 5000;

app.use(cors());
app.use(express.json());



app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      });
    }

    res.json({
      message: "File uploaded successfully",
      fileUrl: `http://localhost:5000/uploads/${req.file.filename}`,
      fileName: req.file.originalname
    });

  } catch (error) {
    console.log("Upload error:", error);

    res.status(500).json({
      message: "File upload failed"
    });
  }
});


const ENCRYPTION_KEY = crypto
 .createHash("sha256")
 .update(process.env.MESSAGE_SECRET)
 .digest();
 

 const encryptMessage = (text) => {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        ENCRYPTION_KEY,
        iv
    );

   let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
     
    return iv.toString("hex") + ":" + encrypted;
   };
    

 const decryptMessage = (encryptedText) => {
  try{
    if(typeof encryptedText !== "string"){
        return encryptedText;
    }

    const parts = encryptedText.split(":");
if (!encryptedText) {
    return "";
}
    if (parts.length !== 2){
        return encryptedText;
    }

    const ivHex = parts[0];
    const encrypted = parts[1];

    if(ivHex.length !== 32 || encrypted.length === 0) {
        console.log("Invalid encrypted format:", encryptedText);
        return encryptedText;
    }
  

    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        ENCRYPTION_KEY,
        iv
    );

 let decrypted = decipher.update(encrypted, "hex", "utf8");
 decrypted += decipher.final("utf8");


   return decrypted;

 
 } catch (error) {
    console.log("Could not decrypt message:", error.message);
    return "[Unable to decrypt]";
 }
 };
 
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access denied. Please login."
        });
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch( error){
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};
app.post("/api/register", async (req, res) => {
    try{
        const{name, email, password, profilePic } = req.body;
        console.log("PROFIC PIC FROM FRONTEND:", profilePic);
        console.log("REGISTER ROUTE HIT:");
        console.log("PROFILE PIC:", profilePic);


       if(!name || !email || !password){
        return res.status(400).json({
            message: "All fields are required"
        });
       }

       if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters"
        });
       }

        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(400).json({
                message: "User already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

       

       const newUser = new User({
            name,
            email,
            password: hashedPassword,
            profilePic
           

        })
console.log("USER BEFORE SAVE:", newUser);

const savedUser = await newUser.save();
console.log("USER AFTER SAVE:", savedUser);
       // await newUser.save();
    
        res.json({
            message: "User registered successfuly!"
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Registration failed"
        
        });

    }
});
app.post("/api/messages", verifyToken, async (req, res) => {
    try {

        console.log("Received body:", req.body);
        const {sender, receiver, message, mediaUrl,mediaName} = req.body || {};

        if(!sender || !receiver || (!message && !mediaUrl)) {
            return res.status(400).json({
                message: "Message or media is required"
            });
        }

        const newMessage = new Message({
           sender: sender,
          receiver:  receiver,
          message:  message ? encryptMessage(message) : "",
          mediaUrl: mediaUrl || "",
          mediaName: mediaName || ""
        });

        await newMessage.save();
        
        console.log("Message saved successfully!");
        res.json({
            message: "Message saved successfully!",
            data: newMessage
        });
            
        } catch (error) {
            console.log("Mesaage save error:", error);

            res.status(500).json({
                message: "Message could not be saved"
            });
        }

        
    
   });

   app.post("/api/group-messages", verifyToken, async (req, res) => {
    try{
        const {groupId, message, mediaUrl, mediaName} = req.body;

        if(!groupId || (!message && !mediaUrl)) {
            return res.status(400).json({
                message: "Group ID and message are required"

            });
        }

        const group = await Group.findById(groupId);
         if(!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const isMember = group.members.some(
            (member) => String(member) === String(req.userId)
        );

        if(!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        const newMessage = new Message({
            sender: req.userId,
            group: groupId,
            message: message ? encryptMessage(message) : "",
            mediaUrl: mediaUrl || "",
            mediaName: mediaName || ""
        });

        await newMessage.save();
        res.json({
            message:"Group message saved successfully",
            data: newMessage
        });
    } catch (error) {
        console.log("Group  message save error:", error);

        res.status(500).json({
             message: "Group message could not be saved" 
        });
      
    }
   });


   
app.get("/api/group-messages", verifyToken, async (req, res) => {
  try {
    const { groupId } = req.query;

    if (!groupId) {
      return res.status(400).json({
        message: "Group ID is required"
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    const isMember = group.members.some(
      (member) => String(member) === String(req.userId)
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this group"
      });
    }

    const messages = await Message.find({
      group: groupId
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name");

    const decryptedMessages = messages.map((msg) => ({
      ...msg.toObject(),
      message: decryptMessage(msg.message)
    }));

    res.json(decryptedMessages);

  } catch (error) {
    console.log("Get group messages error:", error);

    res.status(500).json({
      message: "Failed to get group messages"
    });
  }
});

mongoose.connect(process.env.MONGO_URI)



.then(() => {
    console.log("MongoDB connected successfully!");
})
.catch((error) => {
    console.log("MongoDB connection error:", error);
});


app.get("/" , (req, res) => {
    res.send("Chat Application Backend is Running!");
});

app.get("/api/message", (req, res) => {
     res.json({
        message: "Hello from the Chat Application Backend ,Iam here!"
    });
});

app.get("/api/users", verifyToken, async (req, res) => {
    try{
        const users = await User.find().select("-password");
        res.json(users);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Could not get users"
        });
    }
});


   app.post("/api/login", async (req, res) => {
    try{
        const {email, password} = req.body;
        const user = await User.findOne({email});

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });


        }
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch){
            return res.status(400).json({
                message: "Invalid password"
            });
        }
        const token = jwt.sign(
            {
                userId: user._id },
                process.env.JWT_SECRET,
                {expiresIn: "1d"}
            
        );
        res.json({
            message: "Login successful!",
            token: token
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Login failed"
        });
    }
   });

   
   app.get("/api/messages", verifyToken, async(req, res) => {
    try {
        const{ sender, receiver} = req.query;
        const messages = await Message.find({
            $or: [
                {sender: sender, receiver: receiver},
                {sender: receiver, receiver: sender}
            ]

        }).sort({createdAt: 1 });

        const decryptedMessages = messages.map((msg) => ({
            ...msg.toObject(),
            message: decryptMessage(msg.message)
        }));
        res.json(decryptedMessages);

        
    } catch (error) {
        console.log("Error getting messages:", error);

        res.status(500).json({
        message: "Failed to get messages"
}) ;  
    } 
   })


   app.delete("/api/messages/:messageId", verifyToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        message: "Message not found"
      });
    }


    if (String(message.sender) !== String(req.userId)) {
      return res.status(403).json({
        message: "You can only delete your own messages"
      });
    }

    message.message = "";
    message.mediaUrl = "";
    message.mediaName = "";
    message.deleted = true;
    message.deletedForEveryone = true;

    await message.save();

    res.json({
      message: "Message deleted successfully",
      messageId: message._id
    });

  } catch (error) {
    console.log("Delete message error:", error);

    res.status(500).json({
      message: "Could not delete message"
    });
  }
});


app.post("/api/groups", verifyToken, async (req, res) => {
    try{
        const {name, members} = req.body;
        if(!name || !name.trim()){
            return res.status(400).json({
                message: "Group name is required"

            });
        }

        const groupMembers = Array.isArray(members) ? members : [];

        if(!groupMembers.includes(String(req.userId))) {
            groupMembers.push(String(req.userId));

        }
         const group = new Group({
            name: name.trim(),
            admin: req.userId,
            members: groupMembers
         });
         await group.save();

         res.status(201).json({
            message: "Group created successfully",
            group
         });

        
        } catch (error) {
            console.log("Create group error:", error );

            res.status(500).json({
                message: "Could not create group"
            });
        }
})  ;


app.get("/api/groups", verifyToken, async (req, res) => {
    try {
        const groups = await Group.find({
            members: req.userId
        })
        .populate("admin", "name email")
        .populate("members", "name email")
        .sort({createdAt: -1});

        res.json(groups);
    } catch (error) {
        console.log("Get groups error:", error);

        res.status(500).json({
            message: "Could not get groups"
        });
    }
});


app.put("/api/groups/:groupId/add-member", verifyToken, async (req, res) => {
    try {
        const {userId} = req.body;    

        const group = await Group.findById(req.params.groupId);

        if(!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        if(String(group.admin) !== String(req.userId)) {
            return res.status(403).json({
                message: "Only group admin can add members"
            });
        }

        if(!userId) {
            return res.status(400).json({
                message: "User ID is required"
            });
        }

        if (group.members.some(
            (member) => String(member) === String(userId)
        )) {
            return res.status(400).json({
                message: "User is already  a member"
            });

        }
        group.members.push(userId);
        await group.save();

        res.json({
            message: "memeber added successfully",
            group
        });

    } catch (error) {
        console.log("Add member error:", error);

        res.status(500).json({
            message: "Could not add member"
        });
    }

    
});

app.put("/api/groups/:groupId/remove-member", verifyToken, async (req, res) => {
    try {
        const {userId} = req.body;

        const group = await Group.findById(req.params.groupId);

        if(!group) {
            return res.status(404).json({
                message: "Group not found"
            });

        }
        if(String(userId) === String(req.userId)) {
            return res.status(403).json({
                message: "Only group admin can remove members"
            });
        }

        if(String(userId) === String(group.admin)) {
            return res.status(400).json({
                message: "Admin cannot be removed"
            });
        }

        group.members = group.members.filtrer(
            (member) => String(member) !== String(userId)
        );

        await group.save();

        res.json({
            message: "Member removed successfully",
            group
        });
    } catch (error) {
        console.log("Remove member error:", error);

        res.status(500).json({
            message: "Could not reove member"
        });

    }
});
app.delete("/api/groups/:groupId", verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }
    console.log("Group admin:", group.admin);
    console.log("Logged in user:", req.userId);
    
    if (String(group.admin) !== String(req.userId)) {
      return res.status(403).json({
        message: "Only group admin can delete the group"
      });
    }

    await Group.findByIdAndDelete(req.params.groupId);


    await Message.deleteMany({
      group: req.params.groupId
    });

    res.json({
      message: "Group deleted successfully"
    });

  } catch (error) {
    console.log("Delete group error:", error);

    res.status(500).json({
      message: "Could not delete group"
    });
  }
});

   const server = http.createServer(app);

   const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
   });

   io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
  const roomId = String(userId);

  socket.join(roomId);
  socket.userId = roomId;

  console.log("User joined room:", roomId);


  for (const [id, connectedSocket] of io.sockets.sockets) {
    if (connectedSocket.userId) {
      socket.emit("user_online", connectedSocket.userId);
    }
  }

 
  socket.broadcast.emit("user_online", roomId);
});

   

    socket.on("send_message", (data) => {
        console.log("Socket message received:", data);
        console.log("SENDER ID:", data.sender);
        console.log("RECEIVER ID:", data.receiver);

        io.to(String(data.receiver)).emit("receive_message", data);
        io.to(String(data.sender)).emit("receive_message", data);
        io.to(String(data.sender)).emit("message_delivered", {messageId: data.id});
        
        });
         socket.on("typing", (data) => {
            io.to(String(data.receiver)).emit("user_typing",
                 {
                sender: data.sender
            });
        });

        socket.on("stop_typing", (data) => {
            io.to(String(data.receiver)).emit("user_stop_typing", {
                sender: data.sender
            });
        });
 socket.on("join_group", (groupId) => {
    const roomId = `group_${groupId}`;

    socket.join(roomId);

    console.log("User joined group room", roomId);
   });

   socket.on("send_group_message", (data) => {
  console.log("GROUP MESSAGE RECEIVED:", data);

  const roomId = `group_${data.groupId}`;

  console.log("BROADCASTING TO ROOM:", roomId);

  io.to(roomId).emit("receive_group_message", data);
  console.log("GROUP ROOM MEMBERS:", io.sockets.adapter.rooms.get(roomId));
  console.log("GROUP MESSAGE BROADCASTED");

        });
  


    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if(socket.userId){
            socket.broadcast.emit("user_offline", socket.userId); 
        }
    });
   });

   server.listen(5000, () => {
    console.log("Server running on port 5000");
   });
   
