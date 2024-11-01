import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

const App = () => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [editPostId, setEditPostId] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Fetch initial posts when component mounts
  useEffect(() => {
    fetch('http://localhost:8000/posts')
      .then((response) => response.json())
      .then((data) => setPosts(data))
      .catch((error) => console.error('Error fetching posts:', error));
  }, []);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    socket.on('new_post', (post) => {
      setPosts((prevPosts) => [...prevPosts, post]);
    });

    socket.on('edit_post', (updatedPost) => {
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
      );
    });

    socket.on('delete_post', (deletedPostId) => {
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== deletedPostId));
    });

    return () => {
      socket.off('new_post');
      socket.off('edit_post');
      socket.off('delete_post');
    };
  }, []);

  // Handle form submission to add a new post
  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const response = await fetch('http://localhost:8000/addpost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent }),
      });

      if (response.ok) {
        setNewPostContent('');
      } else {
        console.error('Failed to add post');
      }
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  // Handle initiating edit mode
  const initiateEdit = (post) => {
    setEditPostId(post._id);
    setEditContent(post.content);
  };

  // Handle saving an edited post
  const handleEditPost = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:8000/editpost/${editPostId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        setEditPostId(null);
        setEditContent('');
      } else {
        console.error('Failed to edit post');
      }
    } catch (error) {
      console.error('Error editing post:', error);
    }
  };

  // Handle deleting a post
  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:8000/deletepost/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Forum</h2>

      {editPostId ? (
        <form onSubmit={handleEditPost} style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Edit your post..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            required
            style={{ padding: '10px', width: '300px', marginRight: '10px' }}
          />
          <button type="submit" style={{ padding: '10px' }}>Save</button>
          <button onClick={() => setEditPostId(null)} style={{ padding: '10px', marginLeft: '10px' }}>
            Cancel
          </button>
        </form>
      ) : (
        <form onSubmit={handleAddPost} style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Write your post..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            required
            style={{ padding: '10px', width: '300px', marginRight: '10px' }}
          />
          <button type="submit" style={{ padding: '10px' }}>Post</button>
        </form>
      )}

      <div>
        {posts.map((post) => (
          <div key={post._id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd' }}>
            <p>{post.content}</p>
            <button onClick={() => initiateEdit(post)} style={{ padding: '5px 10px', marginTop: '5px', marginRight: '5px' }}>
              Edit
            </button>
            <button onClick={() => handleDeletePost(post._id)} style={{ padding: '5px 10px', marginTop: '5px' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;