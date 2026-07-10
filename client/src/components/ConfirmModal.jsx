import React from 'react';

const ConfirmModal = ({ isOpen, title = 'Confirm', message = '', onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onCancel} />
      <div className="bg-white rounded-lg p-6 z-10 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-100">{cancelText}</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
