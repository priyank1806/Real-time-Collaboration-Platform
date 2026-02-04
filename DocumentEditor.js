import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import io from 'socket.io-client';
import axios from 'axios';
import './DocumentEditor.css';

const socket = io('http://localhost:5000');

function DocumentEditor({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState({ title: '', content: '' });
  const [versions, setVersions] = useState([]);
  const quillRef = useRef(null);

  useEffect(() => {
    fetchDocument();
    socket.emit('join-document', id);

    socket.on('document-updated', ({ content, userId }) => {
      if (userId !== user.id) {
        setDocument(prev => ({ ...prev, content }));
      }
    });

    return () => {
      socket.off('document-updated');
    };
  }, [id, user.id]);

  const fetchDocument = async () => {
    try {
      const res = await axios.get(`/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDocument(res.data);
      setVersions(res.data.versions);
    } catch (error) {
      alert('Failed to load document');
      navigate('/dashboard');
    }
  };

  const handleChange = (content) => {
    setDocument(prev => ({ ...prev, content }));
    socket.emit('edit-document', { documentId: id, content, userId: user.id });
  };

  const saveDocument = async () => {
    try {
      await axios.put(`/api/documents/${id}`, { content: document.content }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Document saved');
      fetchDocument(); // Refresh to get updated versions
    } catch (error) {
      alert('Failed to save document');
    }
  };

  const revertToVersion = async (versionIndex) => {
    try {
      const res = await axios.post(`/api/documents/${id}/revert/${versionIndex}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDocument(res.data);
      setVersions(res.data.versions);
    } catch (error) {
      alert('Failed to revert');
    }
  };

  return (
    <div className="editor-container">
      <header>
        <h1>{document.title}</h1>
        <button onClick={saveDocument}>Save</button>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </header>
      <div className="editor">
        <ReactQuill
          ref={quillRef}
          value={document.content}
          onChange={handleChange}
          theme="snow"
        />
      </div>
      <div className="versions">
        <h3>Version History</h3>
        {versions.map((version, index) => (
          <div key={index} className="version-item">
            <span>Version {index + 1} - {new Date(version.timestamp).toLocaleString()}</span>
            <button onClick={() => revertToVersion(index)}>Revert</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocumentEditor;