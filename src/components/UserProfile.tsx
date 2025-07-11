import React, { useState } from 'react';
import { User, LogOut, Settings, Edit2, Save, X, Mail, Calendar, Shield, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AvatarUpload from './AvatarUpload';
import { supabase } from '../lib/supabase';

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch user profile data
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          setFullName(data.full_name || '');
          
          // Handle avatar URL - check if it's stored locally
          if (data?.avatar_url) {
            if (data.avatar_url.startsWith('local_storage:')) {
              const key = data.avatar_url.replace('local_storage:', '');
              const localAvatar = localStorage.getItem(key);
              setAvatarUrl(localAvatar || '');
            } else {
              setAvatarUrl(data.avatar_url);
            }
          }
        }
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      await signOut();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal mengupdate profil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Mobile/Tablet Compact View */}
      <div className="lg:hidden">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  onAvatarUpdate={handleAvatarUpdate}
                  size="md"
                />
                <div className="text-white">
                  <h3 className="font-semibold text-lg">
                    {fullName || user?.user_metadata?.full_name || 'Pengguna'}
                  </h3>
                  <p className="text-blue-100 text-sm">{user?.email}</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Expandable Content */}
          {isExpanded && (
            <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors col-span-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
              </div>

              {/* Edit Form */}
              {isEditing && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Simpan</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Bergabung</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user?.created_at ? formatDate(user.created_at) : '-'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                    <Shield className="h-4 w-4" />
                    <span>Status</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">Aktif</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-3 rounded-lg transition-colors border border-red-200 dark:border-red-800"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Profil Pengguna</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-white/90 hover:text-white hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Keluar</span>
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                onAvatarUpdate={handleAvatarUpdate}
                size="lg"
              />
              
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/20 text-white placeholder-white/70"
                      placeholder="Nama lengkap"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>Simpan</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-xl">
                        {fullName || user?.user_metadata?.full_name || 'Pengguna'}
                      </h4>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-100">
                      <Mail className="h-4 w-4" />
                      <p>{user?.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">Bergabung sejak</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {user?.created_at ? formatDate(user.created_at) : '-'}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Aktif</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Email Verified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Terverifikasi</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Informasi Akun</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">User ID</span>
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                    {user?.id?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Provider</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">Email</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Last Sign In</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Tidak diketahui'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;