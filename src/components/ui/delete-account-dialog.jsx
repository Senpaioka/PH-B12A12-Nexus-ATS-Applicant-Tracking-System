/**
 * Delete Account Confirmation Dialog
 * A secure confirmation dialog for account deletion
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button, Input, Label } from './common';

export function DeleteAccountDialog({ isOpen, onClose, onConfirm, accountData }) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setError('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (confirmationText !== 'DELETE MY ACCOUNT') {
      setError('Please type "DELETE MY ACCOUNT" exactly as shown.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await onConfirm(confirmationText);
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmationText === 'DELETE MY ACCOUNT';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isDeleting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-900 mb-2">⚠️ This action cannot be undone</h3>
            <p className="text-sm text-red-800">
              Deleting your account will permanently remove all your data from our servers, including:
            </p>
          </div>

          {/* Data summary */}
          {accountData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-900">Data to be deleted:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• {accountData.candidatesCount} candidates</li>
                <li>• {accountData.jobsCount} job postings</li>
                <li>• {accountData.interviewsCount} interviews</li>
                <li>• Your profile and account settings</li>
                <li>• All associated files and documents</li>
              </ul>
              <p className="text-sm font-medium text-gray-900 mt-2">
                Total items: {accountData.totalItems}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              To confirm deletion, please type <strong>"DELETE MY ACCOUNT"</strong> in the field below:
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirmation Text</Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className={`${
                  confirmationText && !isConfirmationValid 
                    ? 'border-red-500 focus:border-red-500' 
                    : isConfirmationValid 
                    ? 'border-green-500 focus:border-green-500' 
                    : ''
                }`}
                disabled={isDeleting}
              />
              {confirmationText && !isConfirmationValid && (
                <p className="text-xs text-red-600">
                  Please type "DELETE MY ACCOUNT" exactly as shown.
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting Account...' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </div>
  );
}