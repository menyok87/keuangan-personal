import React, { useState } from 'react';
import { User, LogOut, Settings, Edit2, Save, X, Camera } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AvatarUpload from './AvatarUpload';
import { supabase } from '../lib/supabase';

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
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
          setAvatarUrl(data.avatar_url || '');
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Profil Pengguna</h3>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Keluar</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-4">
          {/* Avatar Upload Component */}
          <div className="flex-shrink-0">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              onAvatarUpdate={handleAvatarUpdate}
              size="lg"
            />
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama lengkap"
                />
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800">
                    {fullName || user?.user_metadata?.full_name || 'Pengguna'}
                  </h4>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Stats */}
        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Bergabung sejak</span>
              <span className="font-medium text-gray-800">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-emerald-600 flex items-center space-x-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Aktif</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email Verified</span>
              <span className="font-medium text-emerald-600">✓ Terverifikasi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;