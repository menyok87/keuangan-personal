import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, MapPin, Briefcase, Phone, Shield, Activity, FileText, Edit2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import AvatarUpload from './AvatarUpload';

interface ProfileSectionProps {
  className?: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    fullName: '',
    avatarUrl: '',
    occupation: '',
    phone: '',
    location: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
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
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex flex-col space-y-6">
        {/* Profile Header */}
        <div className="flex items-start space-x-4">
          <AvatarUpload
            currentAvatarUrl={profileData.avatarUrl}
            onAvatarUpdate={handleAvatarUpdate}
            size="md"
          />
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                {profileData.fullName || user?.user_metadata?.full_name || 'Pengguna'}
              </h3>
              <button
                onClick={() => {}}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user?.email}</span>
            </div>
            
            {profileData.occupation && (
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300 mt-1">
                <Briefcase className="h-3 w-3" />
                <span>{profileData.occupation}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Profile Details */}
        <div className="space-y-3 text-sm">
          <div className="profile-field">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>Bergabung sejak {user?.created_at ? formatDate(user.created_at) : '-'}</span>
          </div>
          
          {profileData.location && (
            <div className="profile-field">
              <MapPin className="h-4 w-4 text-red-500" />
              <span>{profileData.location}</span>
            </div>
          )}
          
          {profileData.phone && (
            <div className="profile-field">
              <Phone className="h-4 w-4 text-green-500" />
              <span>{profileData.phone}</span>
            </div>
          )}
          
          <div className="profile-field">
            <Activity className="h-4 w-4 text-purple-500" />
            <span>Status: <span className="profile-badge">Aktif</span></span>
          </div>
          
          <div className="profile-field">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span>Email: <span className="profile-badge">Terverifikasi</span></span>
          </div>
        </div>
        
        {/* Bio */}
        {profileData.bio && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-start space-x-2">
              <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-1" />
              <p className="text-sm text-gray-600 dark:text-gray-300">{profileData.bio}</p>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
      </div>
    </div>
  );
};

export default ProfileSection;