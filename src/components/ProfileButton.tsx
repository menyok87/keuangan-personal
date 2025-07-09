import React, { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ProfileModal from './ProfileModal';

const ProfileButton: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Fetch user profile data
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await fetch(`/api/profile?userId=${user.id}`).then(res => res.json());
          if (data && !error) {
            setAvatarUrl(data.avatar_url || '');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    };
    
    fetchProfile();
  }, [user]);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200"
        title="Lihat Profil"
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Profile" 
            className="w-6 h-6 rounded-full object-cover"
            onError={() => setAvatarUrl('')}
          />
        ) : (
          <User className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        )}
      </button>
      
      <ProfileModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ProfileButton;