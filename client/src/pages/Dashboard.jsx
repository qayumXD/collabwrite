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
            await axios.post('http://localhost:5000/api/documents', { id, title: 'Untitled Document' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate(`/documents/${id}`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Welcome, {user?.username}</h1>
                <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Logout</button>
            </div>

            <div className="mb-8">
                <button onClick={createDocument} className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 text-lg font-semibold">+ Create New Document</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {documents.map(doc => (
                    <div key={doc._id} className="bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between">
                        <h3 className="text-xl font-semibold text-white mb-4">{doc.title || 'Untitled'}</h3>
                        <Link to={`/documents/${doc._id}`} className="text-blue-400 hover:underline self-start">Open</Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
