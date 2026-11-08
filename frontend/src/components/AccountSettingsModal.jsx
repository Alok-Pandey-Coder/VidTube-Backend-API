import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Camera, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { user, refreshUser } = useAuth();
  const { currentTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'branding'
  const [fullname, setFullname] = useState(user?.fullname || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullname.trim()) return;

    try {
      setLoading(true);
      setErrorMsg('');
      await authApi.updateAccount({ fullname: fullname.trim() });
      await refreshUser();
      showNotification('Profile updated successfully!');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update profile details', true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      showNotification('New password and confirm password do not match', true);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await authApi.changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showNotification('Password changed successfully!');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to change password. Check old password.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      await authApi.updateAvatar(formData);
      await refreshUser();
      setAvatarFile(null);
      setAvatarPreview(null);
      showNotification('Avatar photo updated!');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update avatar photo', true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCover = async () => {
    if (!coverFile) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('coverImage', coverFile);
      await authApi.updateCoverImage(formData);
      await refreshUser();
      setCoverFile(null);
      setCoverPreview(null);
      showNotification('Channel banner updated!');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update banner', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${currentTheme.color}20`, color: currentTheme.color }}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Channel & Account Settings <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-zinc-400">Manage your profile, branding, and credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-950/60 px-4 pt-2 gap-4 text-xs font-bold overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => { setActiveTab('profile'); setErrorMsg(''); }}
            className={`pb-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'profile'
                ? 'text-white border-white'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
            style={activeTab === 'profile' ? { borderColor: currentTheme.color, color: '#fff' } : {}}
          >
            Basic Profile
          </button>
          <button
            onClick={() => { setActiveTab('branding'); setErrorMsg(''); }}
            className={`pb-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'branding'
                ? 'text-white border-white'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
            style={activeTab === 'branding' ? { borderColor: currentTheme.color, color: '#fff' } : {}}
          >
            Avatar & Banner
          </button>
          <button
            onClick={() => { setActiveTab('security'); setErrorMsg(''); }}
            className={`pb-2.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'text-white border-white'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
            style={activeTab === 'security' ? { borderColor: currentTheme.color, color: '#fff' } : {}}
          >
            Password & Security
          </button>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border-b border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border-b border-red-800/80 text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* TAB 1: Profile Info */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  disabled
                  value={`@${user?.username || ''}`}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-zinc-500 cursor-not-allowed font-mono"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">Username cannot be changed after registration.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-white font-bold rounded-xl text-xs transition shadow-lg active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: currentTheme.color }}
                >
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Branding (Avatar & Banner) */}
          {activeTab === 'branding' && (
            <div className="space-y-5">
              {/* Avatar Section */}
              <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Profile Picture</span>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 shrink-0 bg-zinc-900">
                    <img
                      src={avatarPreview || user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-block px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition">
                      <span>Choose New Avatar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    {avatarFile && (
                      <button
                        onClick={handleUploadAvatar}
                        disabled={loading}
                        className="block px-3.5 py-1.5 text-white rounded-lg text-xs font-bold transition shadow"
                        style={{ backgroundColor: currentTheme.color }}
                      >
                        {loading ? 'Uploading...' : 'Save Avatar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Banner Section */}
              <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Channel Cover Banner</span>
                <div className="w-full h-24 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative">
                  {coverPreview || user?.coverImage ? (
                    <img
                      src={coverPreview || user?.coverImage}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      No banner uploaded yet
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <label className="inline-block px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition">
                    <span>Choose Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCoverFile(file);
                          setCoverPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {coverFile && (
                    <button
                      onClick={handleUploadCover}
                      disabled={loading}
                      className="px-3.5 py-1.5 text-white rounded-lg text-xs font-bold transition shadow"
                      style={{ backgroundColor: currentTheme.color }}
                    >
                      {loading ? 'Uploading...' : 'Save Banner'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !oldPassword || !newPassword}
                  className="w-full py-2.5 text-white font-bold rounded-xl text-xs transition shadow-lg active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: currentTheme.color }}
                >
                  {loading ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
