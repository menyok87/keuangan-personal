import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarUpdate: (avatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  currentAvatarUrl, 
  onAvatarUpdate, 
  size = 'md' 
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    try {
      setUploading(true);

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File harus berupa gambar');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ukuran file maksimal 5MB');
      }

      // Convert file to base64 for local storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          // Store the base64 data in localStorage with user ID as key
          const avatarKey = `avatar_${user.id}`;
          localStorage.setItem(avatarKey, base64Data);

          // Update user profile in database with a reference to local storage
          const avatarUrl = `local_storage:${avatarKey}`;
          
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (updateError) {
            throw updateError;
          }

          // Clean up old avatar from localStorage if it was stored locally
          if (currentAvatarUrl && currentAvatarUrl.startsWith('local_storage:')) {
            const oldKey = currentAvatarUrl.replace('local_storage:', '');
            localStorage.removeItem(oldKey);
          }

          onAvatarUpdate(base64Data); // Pass the actual base64 data for immediate display
          setShowUploadModal(false);
          setPreview(null);

        } catch (error: any) {
          console.error('Error saving avatar:', error);
          throw error;
        }
      };

      reader.onerror = () => {
        throw new Error('Gagal membaca file');
      };

      reader.readAsDataURL(file);

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(error.message || 'Gagal mengupload avatar');
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setShowUploadModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const confirmUpload = () => {
    if (fileInputRef.current?.files?.[0]) {
      uploadAvatar(fileInputRef.current.files[0]);
    }
  };

  // Function to get avatar URL - check if it's stored locally
  const getAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) return null;
    
    if (avatarUrl.startsWith('local_storage:')) {
      const key = avatarUrl.replace('local_storage:', '');
      return localStorage.getItem(key);
    }
    
    if (avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }
    
    return avatarUrl;
  };

  const displayAvatarUrl = getAvatarUrl(currentAvatarUrl);

  return (
    <>
      <div className="relative group">
        {/* Avatar Display */}
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center relative`}>
          {displayAvatarUrl ? (
            <img
              src={displayAvatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to default avatar if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <User className={`${iconSizes[size]} text-white`} />
          )}
          
          {/* Upload Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
               onClick={() => fileInputRef.current?.click()}>
            <Camera className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors shadow-lg"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Camera className="h-3 w-3" />
          )}
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Upload Avatar</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setPreview(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Preview */}
              {preview && (
                <div className="mb-6">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Drag & drop gambar di sini atau
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  pilih file
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  PNG, JPG, GIF hingga 5MB
                </p>
              </div>

              {/* Action Buttons */}
              {preview && (
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setPreview(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                    disabled={uploading}
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmUpload}
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarUpload;