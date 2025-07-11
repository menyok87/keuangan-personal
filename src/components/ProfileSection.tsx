import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, MapPin, Briefcase, Phone, Shield, Activity, FileText, Edit2, Save, X, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import AvatarUpload from './AvatarUpload';

interface ProfileSectionProps {
  className?: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ className = '' }) => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    avatarUrl: '',
    occupation: '',
    phone: '',
    location: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    transactionCount: 0,
    budgetCount: 0,
    goalCount: 0,
    debtCount: 0
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (data && !error) {
            setProfileData({
              fullName: data.full_name || '',
              avatarUrl: data.avatar_url || '',
              occupation: data.occupation || '',
              phone: data.phone || '',
              location: data.location || '',
              bio: data.bio || ''
            });
          }
          
          // Fetch stats
          const [transRes, budgetRes, goalRes, debtRes] = await Promise.all([
            supabase.from('transactions').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('budgets').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('financial_goals').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('debts').select('id', { count: 'exact' }).eq('user_id', user.id)
          ]);
          
          setStats({
            transactionCount: transRes.count || 0,
            budgetCount: budgetRes.count || 0,
            goalCount: goalRes.count || 0,
            debtCount: debtRes.count || 0
          });
          
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchProfile();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSignOut = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      try {
        await signOut();
        alert('Anda berhasil keluar');
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Gagal keluar. Silakan coba lagi.');
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          full_name: profileData.fullName,
          occupation: profileData.occupation,
          phone: profileData.phone,
          location: profileData.location,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setIsEditing(false);
      alert('Profil berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal mengupdate profil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfileData(prev => ({
      ...prev,
      avatarUrl: newAvatarUrl
    }));
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-16 w-16"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {isEditing ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Profil</h3>
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 flex flex-col items-center">
              <AvatarUpload
                currentAvatarUrl={profileData.avatarUrl}
                onAvatarUpdate={handleAvatarUpdate}
                size="lg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Klik untuk ubah foto</p>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nama lengkap Anda"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pekerjaan
                </label>
                <input
                  type="text"
                  value={profileData.occupation}
                  onChange={(e) => setProfileData(prev => ({ ...prev, occupation: e.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Pekerjaan atau jabatan Anda"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nomor telepon Anda"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Kota atau negara Anda"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder="Ceritakan sedikit tentang diri Anda..."
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Save className="h-3 w-3" />
              )}
              <span>Simpan</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
              <AvatarUpload
                currentAvatarUrl={profileData.avatarUrl}
                onAvatarUpdate={handleAvatarUpdate}
                size="lg"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                  {profileData.fullName || user?.user_metadata?.full_name || 'Pengguna'}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-gray-600 dark:text-gray-300 mb-4">
                <div className="flex items-center justify-center md:justify-start gap-1">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs">{user?.email}</span>
                </div>
                
                {profileData.occupation && (
                  <div className="flex items-center justify-center md:justify-start gap-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-xs">{profileData.occupation}</span>
                  </div>
                )}
              </div>
              
              {profileData.bio && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 max-w-lg">
                  {profileData.bio}
                </p>
              )}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {profileData.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                    <MapPin className="h-3 w-3" />
                    <span>{profileData.location}</span>
                  </div>
                )}
                
                {profileData.phone && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                    <Phone className="h-3 w-3" />
                    <span>{profileData.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  <Calendar className="h-3 w-3" />
                  <span>Bergabung {user?.created_at ? formatDate(user.created_at) : '-'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">Status Akun</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Aktif</span>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                <Shield className="h-4 w-4" />
                <span className="text-xs font-medium">Verifikasi</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Email Terverifikasi</span>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                <User className="h-4 w-4" />
                <span className="text-xs font-medium">User ID</span>
              </div>
              <div className="flex items-center">
                <span className="font-mono text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-gray-700 dark:text-gray-300 truncate max-w-full">
                  {user?.id?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.transactionCount}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Transaksi</div>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.budgetCount}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">Anggaran</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.goalCount}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Target</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.debtCount}</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Hutang/Piutang</div>
            </div>
          </div>
          
          {/* Logout Button */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700 mt-3">
            <button 
              onClick={handleSignOut}
              className="w-full py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;