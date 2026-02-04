import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

function Dashboard({ user, setUser }) {
  const [documents, setDocuments] = useState([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('/api/documents', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDocuments(res.data);
    } catch (error) {
      console.error('Failed to fetch documents');
    }
  };

  const createDocument = async () => {
    if (!newDocTitle.trim()) return;
    try {
      const res = await axios.post('/api/documents', { title: newDocTitle }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDocuments([...documents, res.data]);
      setNewDocTitle('');
    } catch (error) {
      alert('Failed to create document');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Real-time Collaboration Platform</h1>
        <button onClick={logout}>Logout</button>
      </header>
      <div className="create-doc">
        <input
          type="text"
          placeholder="New document title"
          value={newDocTitle}
          onChange={(e) => setNewDocTitle(e.target.value)}
        />
        <button onClick={createDocument}>Create Document</button>
      </div>
      <div className="documents-list">
        <h2>Your Documents</h2>
        {documents.map(doc => (
          <div key={doc._id} className="document-item">
            <Link to={`/document/${doc._id}`}>{doc.title}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;