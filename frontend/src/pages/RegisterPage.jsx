import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, UserPlus, Image as ImageIcon, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function RegisterPage() {
  const { register, login } = useAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullname.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!avatar) {
      setError('Avatar profile picture is required by VidTube.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('fullname', fullname.trim());
      formData.append('username', username.trim().toLowerCase());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('avatar', avatar);
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      await register(formData);

      // Automatically sign in upon registration
      try {
        await login(username.trim().toLowerCase(), password);
        navigate('/');
      } catch {
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error', err);
      setError(err.response?.data?.message || 'Registration failed. Check if username or email already exists.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6 my-4">
      <div className="w-full max-w-lg bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Glow */}
        <div 
          className="absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-25"
          style={{ backgroundColor: currentTheme.color }}
        />

        <div className="flex flex-col items-center text-center mb-6">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-xl mb-3 transition-transform duration-300 hover:scale-105"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${currentTheme.color}, #f43f5e)`,
              boxShadow: `0 0 20px ${currentTheme.bgGlow}` 
            }}
          >
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create VidTube Account</h1>
          <p className="text-xs text-zinc-400 mt-1">Join the creator platform to upload and share videos</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-950/50 border border-red-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar & Cover Upload Preview row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center shrink-0">
              <label className="relative cursor-pointer group">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-zinc-500 bg-zinc-900 flex items-center justify-center transition">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-zinc-500 group-hover:text-white transition" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={loading}
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] font-semibold text-zinc-400 mt-1.5">Avatar *</span>
            </div>

            {/* Cover Image */}
            <div className="flex-1 w-full flex flex-col justify-center">
              <label className="relative cursor-pointer group block w-full h-16 rounded-xl border-2 border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 overflow-hidden flex items-center justify-center transition">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center gap-2 text-zinc-500 group-hover:text-white transition text-xs">
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload banner (optional)</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={loading}
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="Alok Pandey"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder="alok_dev"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              disabled={loading}
              placeholder="alok@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              disabled={loading}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
            style={{ 
              backgroundColor: currentTheme.color,
              boxShadow: `0 0 16px ${currentTheme.bgGlow}` 
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="font-bold hover:underline transition"
            style={{ color: currentTheme.color }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
