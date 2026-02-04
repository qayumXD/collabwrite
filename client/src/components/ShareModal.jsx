import React, { useState } from 'react';

const ShareModal = ({ isOpen, onClose, onShare }) => {
    const [email, setEmail] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onShare(email);
        setEmail('');
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '300px' }}>
                <h3>Share Document</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="Enter email to share with"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.5rem' }}>Cancel</button>
                        <button type="submit" style={{ padding: '0.5rem', background: '#30bced', color: 'white', border: 'none' }}>Share</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShareModal;
