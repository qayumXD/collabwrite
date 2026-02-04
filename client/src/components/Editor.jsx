import React, { useEffect, useRef, useState, useContext } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { QuillBinding } from 'y-quill';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { stringToColor } from '../utils/colorUtils';
import ShareModal from './ShareModal';

const Editor = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const [status, setStatus] = useState('Connecting...');
    const [collaborators, setCollaborators] = useState([]);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [docTitle, setDocTitle] = useState('Untitled Document');

    // Check permissions and load title
    useEffect(() => {
        const checkAccess = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/documents/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDocTitle(res.data.title);
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    alert("You do not have permission to view this document.");
                    navigate('/dashboard');
                } else if (err.response && err.response.status === 404) {
                    alert("Document not found.");
                    navigate('/dashboard');
                }
            }
        };
        checkAccess();
    }, [id, navigate]);

    useEffect(() => {
        if (!editorRef.current || !user) return;

        // 1. Init Yjs Doc
        const ydoc = new Y.Doc();

        // 2. Connect to Websocket Provider
        const provider = new WebsocketProvider(
            'ws://localhost:5000',
            `collabwrite-doc-${id}`, // Room name
            ydoc
        );

        provider.on('status', event => {
            setStatus(event.status); // 'connected' or 'disconnected'
        });

        // 3. Define type
        const ytext = ydoc.getText('quill');

        // 4. Init Quill
        const editorContainer = editorRef.current;
        editorContainer.innerHTML = ''; // Clear previous
        const editorElement = document.createElement('div');
        editorContainer.appendChild(editorElement);

        const quill = new Quill(editorElement, {
            modules: {
                toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline'],
                    ['image', 'code-block']
                ],
                history: {
                    userOnly: true // Yjs handles history
                }
            },
            placeholder: 'Start collaborating...',
            theme: 'snow'
        });

        // 5. Bind Yjs to Quill
        const binding = new QuillBinding(ytext, quill, provider.awareness);

        // 6. Set user awareness (Real User Data)
        const userColor = stringToColor(user.username); // Consistent color
        provider.awareness.setLocalStateField('user', {
            name: user.username,
            color: userColor
        });

        // 7. Listen for Awareness Changes (Active Users)
        const updateCollaborators = () => {
            const states = provider.awareness.getStates();
            const activeUsers = [];
            states.forEach((state, clientId) => {
                if (state.user) {
                    activeUsers.push({
                        clientId,
                        ...state.user
                    });
                }
            });
            setCollaborators(activeUsers);
        };

        provider.awareness.on('change', updateCollaborators);
        updateCollaborators();

        return () => {
            provider.disconnect();
            ydoc.destroy();
        };
    }, [id, user]);

    const handleShare = async (email) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/documents/${id}/share`, { email }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Document shared with ${email}`);
            setIsShareOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Error sharing document');
        }
    };

    return (
        <div className="app-container">
            <div className="editor-container">
                <div className="status-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div className={`status-indicator ${status === 'connected' ? 'status-connected' : 'status-disconnected'}`}>
                            <div className="status-dot" style={{
                                display: 'inline-block', width: '10px', height: '10px',
                                borderRadius: '50%', background: status === 'connected' ? 'green' : 'red', marginRight: '5px'
                            }} />
                        </div>
                        <div style={{ fontWeight: 'bold' }}>{docTitle}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="collaborators-list" style={{ display: 'flex', gap: '5px' }}>
                            {collaborators.map(c => (
                                <div key={c.clientId} title={c.name} style={{
                                    width: '30px', height: '30px', borderRadius: '50%',
                                    background: c.color, color: '#fff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                                    border: '2px solid white', boxShadow: '0 0 0 1px #ccc'
                                }}>
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setIsShareOpen(true)} style={{ marginLeft: '10px', padding: '5px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Share</button>
                    </div>

                </div>
                <div ref={editorRef} className="quill-wrapper" />
            </div>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                onShare={handleShare}
            />
        </div>
    );
};

export default Editor;
