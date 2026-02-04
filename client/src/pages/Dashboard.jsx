import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [documents, setDocuments] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/documents', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDocuments(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        if (user) fetchDocs();
    }, [user]);

    const createDocument = async () => {
        const id = uuidv4();
        try {
            const token = localStorage.getItem('token');
            // Assuming we want to persist it immediately or we can just navigate to editor and let editor create it?
            // Let's create it on server so we have 'owner' set correctly.
            await axios.post('http://localhost:5000/api/documents', { id, title: 'Untitled Document' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate(`/documents/${id}`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Welcome, {user?.username}</h1>
                <button onClick={logout} style={{ background: 'red', color: 'white', padding: '0.5rem' }}>Logout</button>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <button onClick={createDocument} style={{ padding: '0.5rem 1rem', fontSize: '1.1rem' }}>+ Create New Document</button>
            </div>

            <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {documents.map(doc => (
                    <div key={doc._id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                        <h3 style={{ margin: '0 0 1rem 0' }}>{doc.title || 'Untitled'}</h3>
                        <Link to={`/documents/${doc._id}`} style={{ display: 'block', marginTop: 'auto' }}>Open</Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
