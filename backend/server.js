const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/POC_Application", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Define a Post model
const postSchema = new mongoose.Schema({
  content: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

// /posts API to fetch all posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
});

// /addpost API to create a new post
app.post("/addpost", async (req, res) => {
  const { content } = req.body;

  try {
    const newPost = new Post({ content });
    await newPost.save();

    // Broadcast the new post to all connected clients
    io.emit("new_post", newPost);

    res.status(201).json({ message: "Post added successfully", post: newPost });
  } catch (error) {
    res.status(500).json({ message: "Error adding post", error });
  }
});

// /editpost API to edit a post
app.put("/editpost/:id", async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { content, updatedAt: Date.now() },
      { new: true }
    );

    if (updatedPost) {
      io.emit("edit_post", updatedPost); // Broadcast the edited post to all connected clients
      res
        .status(200)
        .json({ message: "Post edited successfully", post: updatedPost });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error editing post", error });
  }
});

// /deletepost API to delete a post
app.delete("/deletepost/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPost = await Post.findByIdAndDelete(id);

    if (deletedPost) {
      io.emit("delete_post", id); // Broadcast the deleted post's ID to all connected clients
      res.status(200).json({ message: "Post deleted successfully" });
    } else {
      res.status(404).json({ message: "Post not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error });
  }
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("New user connected ✅");

  socket.on("disconnect", () => {
    console.log("One user disconnected ❌");
  });
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
