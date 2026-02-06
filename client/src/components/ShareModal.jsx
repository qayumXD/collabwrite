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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold text-white mb-6">Share Document</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Enter email to share with"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="p-3 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-4 justify-end">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Share</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShareModal;
