import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { QuillBinding } from 'y-quill';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useStore from '../store/useStore';
import { stringToColor } from '../utils/colorUtils';
import ShareModal from './ShareModal';

const Editor = () => {
    const { id } = useParams();
    const { user, token } = useStore();
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const [status, setStatus] = useState('Connecting...');
    const [collaborators, setCollaborators] = useState([]);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [docTitle, setDocTitle] = useState('Untitled Document');

    useEffect(() => {
        const checkAccess = async () => {
            try {
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
        if (token) checkAccess();
    }, [id, navigate, token]);

    useEffect(() => {
        if (!editorRef.current || !user) return;

        const ydoc = new Y.Doc();
        const provider = new WebsocketProvider('ws://localhost:5000', `collabwrite-doc-${id}`, ydoc);
        provider.on('status', event => setStatus(event.status));
        const ytext = ydoc.getText('quill');

        const editorContainer = editorRef.current;
        editorContainer.innerHTML = '';
        const editorElement = document.createElement('div');
        editorContainer.appendChild(editorElement);

        const quill = new Quill(editorElement, {
            modules: {
                toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline'],
                    ['image', 'code-block']
                ],
                history: { userOnly: true }
            },
            placeholder: 'Start collaborating...',
            theme: 'snow'
        });

        const binding = new QuillBinding(ytext, quill, provider.awareness);
        const userColor = stringToColor(user.username);
        provider.awareness.setLocalStateField('user', { name: user.username, color: userColor });

        const updateCollaborators = () => {
            const states = provider.awareness.getStates();
            const activeUsers = Array.from(states.values()).filter(state => state.user).map(state => state.user);
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
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <div className="flex-grow flex flex-col">
                <div className="flex justify-between items-center p-3 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${status === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
                            <span className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            <span className="text-sm font-medium">{status}</span>
                        </div>
                        <div className="text-lg font-semibold">{docTitle}</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {collaborators.map(c => (
                                <div key={c.name} title={c.name} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900" style={{ backgroundColor: c.color }}>
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setIsShareOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Share</button>
                    </div>
                </div>
                <div ref={editorRef} className="flex-grow relative quill-wrapper" />
            </div>
            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} onShare={handleShare} />
            <style jsx global>{`
                .ql-editor {
                    color: #fff;
                }
                .ql-toolbar {
                    background-color: #1f2937;
                    border-bottom: 1px solid #374151 !important;
                }
                .ql-toolbar .ql-stroke {
                    stroke: #9ca3af;
                }
                .ql-toolbar .ql-fill {
                    fill: #9ca3af;
                }
                .ql-toolbar .ql-picker-label {
                    color: #9ca3af;
                }
            `}</style>
        </div>
    );
};

export default Editor;
