import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    occupation: '',
    phone: '',
    location: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    transactionCount: 0,
    budgetCount: 0,
    goalCount: 0,
    debtCount: 0,
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfileData({
          fullName: data.full_name || '',
          occupation: data.occupation || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const [transRes, budgetRes, goalRes, debtRes] = await Promise.all([
        supabase.from('transactions').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('budgets').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('financial_goals').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('debts').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);

      setStats({
        transactionCount: transRes.count || 0,
        budgetCount: budgetRes.count || 0,
        goalCount: goalRes.count || 0,
        debtCount: debtRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsEditing(false);
      Alert.alert('Sukses', 'Profil berhasil diperbarui!');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengupdate profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Gagal keluar dari akun');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Icon name="person" size={40} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profileData.fullName || user?.user_metadata?.full_name || 'Pengguna'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {profileData.occupation && (
              <Text style={styles.profileOccupation}>{profileData.occupation}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Icon name={isEditing ? 'close' : 'edit'} size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Edit Form */}
        {isEditing && (
          <View style={styles.editForm}>
            <Text style={styles.formTitle}>Edit Profil</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                value={profileData.fullName}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, fullName: text }))}
                placeholder="Nama lengkap Anda"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pekerjaan</Text>
              <TextInput
                style={styles.input}
                value={profileData.occupation}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, occupation: text }))}
                placeholder="Pekerjaan atau jabatan Anda"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nomor Telepon</Text>
              <TextInput
                style={styles.input}
                value={profileData.phone}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                placeholder="Nomor telepon Anda"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lokasi</Text>
              <TextInput
                style={styles.input}
                value={profileData.location}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, location: text }))}
                placeholder="Kota atau negara Anda"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={profileData.bio}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
                placeholder="Ceritakan sedikit tentang diri Anda..."
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Details */}
        {!isEditing && (
          <View style={styles.profileDetails}>
            {profileData.bio && (
              <Text style={styles.profileBio}>{profileData.bio}</Text>
            )}
            
            <View style={styles.detailsGrid}>
              {profileData.location && (
                <View style={styles.detailItem}>
                  <Icon name="location-on" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{profileData.location}</Text>
                </View>
              )}
              
              {profileData.phone && (
                <View style={styles.detailItem}>
                  <Icon name="phone" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{profileData.phone}</Text>
                </View>
              )}
              
              <View style={styles.detailItem}>
                <Icon name="calendar-today" size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  Bergabung {user?.created_at ? formatDate(user.created_at) : '-'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Account Status */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Status Akun</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Icon name="verified" size={20} color="#10B981" />
              <Text style={styles.statusText}>Aktif</Text>
            </View>
            <View style={styles.statusItem}>
              <Icon name="security" size={20} color="#3B82F6" />
              <Text style={styles.statusText}>Email Terverifikasi</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistik</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.transactionCount}</Text>
              <Text style={styles.statLabel}>Transaksi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.budgetCount}</Text>
              <Text style={styles.statLabel}>Anggaran</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.goalCount}</Text>
              <Text style={styles.statLabel}>Target</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.debtCount}</Text>
              <Text style={styles.statLabel}>Hutang/Piutang</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Icon name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileOccupation: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  editForm: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileDetails: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileBio: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});

export default ProfileScreen;