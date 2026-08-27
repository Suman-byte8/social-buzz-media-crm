'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, saveSettings, uploadLogo, clearMessages } from '@/redux/slices/settingsSlice';
import LoginAccessCard from '@/components/settings/LoginAccessCard';
import RequireAdmin from '@/components/auth/RequireAdmin';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { data: settingsData, loading, uploadingLogo, error, successMessage } = useSelector(
    (state) => state.settings
  );

  const [formData, setFormData] = useState({
    logo: '',
    name: '',
    email: '',
    website: '',
    address: '',
    gstNumber: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fileError, setFileError] = useState(null);

  // Fetch settings from server DB on mount
  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  // Synchronize local form state with Redux store data (including decrypted password)
  useEffect(() => {
    if (settingsData) {
      setFormData({
        logo: settingsData.logo || '',
        name: settingsData.name || '',
        email: settingsData.email || '',
        website: settingsData.website || '',
        address: settingsData.address || '',
        gstNumber: settingsData.gstNumber || '',
        password: settingsData.password || '',
      });
    }
  }, [settingsData]);

  // Format image URL for backend logo proxy or full URLs
  const getFormattedImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/api')) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const host = apiBase.replace(/\/api\/?$/, '');
      return `${host}${url}`;
    }
    return url;
  };

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (successMessage || error || fileError) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
        setFileError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, fileError, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Logo Upload to Google Drive (Max 5MB Validation)
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // Validate size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('File size exceeds the 5MB maximum limit. Please choose a smaller image.');
      return;
    }

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setFileError('Invalid file type. Please upload an image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    try {
      const result = await dispatch(uploadLogo(file)).unwrap();
      if (result.logoUrl) {
        setFormData((prev) => ({ ...prev, logo: result.logoUrl }));
      }
    } catch (err) {
      console.error('Logo upload error:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(saveSettings(formData));
  };

  const logoSrc = getFormattedImageUrl(formData.logo);

  return (
    <RequireAdmin>
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Toast Banners */}
        {successMessage && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              <span className="font-body-md text-sm font-medium">{successMessage}</span>
            </div>
            <button onClick={() => dispatch(clearMessages())} className="text-green-600 hover:text-green-800 cursor-pointer">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {(error || fileError) && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">error</span>
              <span className="font-body-md text-sm font-medium">{fileError || error}</span>
            </div>
            <button onClick={() => { dispatch(clearMessages()); setFileError(null); }} className="text-red-600 hover:text-red-800 cursor-pointer">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* General Settings Section */}
        <section className="card-bg rounded-lg p-6 md:p-8 border border-outline-variant/50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">business</span>
              <h3 className="font-title-lg text-title-lg text-on-surface">General Settings</h3>
            </div>
            {(loading || uploadingLogo) && (
              <span className="text-xs text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                {uploadingLogo ? 'Uploading logo to Google Drive...' : 'Syncing with server...'}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center p-4 bg-surface-container/50 rounded-lg border border-outline-variant/40">
              <div className="w-28 h-28 rounded-lg bg-surface-container-highest border border-outline-variant flex items-center justify-center relative overflow-hidden group shadow-inner bg-white">
                {logoSrc ? (
                  <img
                    className="w-full h-full object-contain p-1 absolute inset-0 z-0"
                    alt="Agency Logo"
                    src={logoSrc}
                    onError={(e) => {
                      // Fallback logic if primary proxy link fails
                      if (logoSrc.includes('/logo-proxy/')) {
                        const fileId = logoSrc.split('/logo-proxy/')[1];
                        e.target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                      } else {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=Agency+Logo';
                      }
                    }}
                  />
                ) : (
                  <span className="material-symbols-outlined text-secondary text-4xl">image</span>
                )}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity z-10"
                >
                  <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                  <span className="text-[10px] font-medium mt-1">Upload</span>
                </div>
              </div>

              <div className="flex-1 space-y-2 w-full">
                <label className="font-label-md text-label-md text-on-surface block">
                  Agency Logo (Uploaded to Google Drive)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-4 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] rounded font-label-md text-label-md hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {uploadingLogo ? 'sync' : 'upload'}
                    </span>
                    {uploadingLogo ? 'Uploading to Drive...' : 'Upload Logo'}
                  </button>
                  <span className="text-xs text-secondary">
                    Max size: 5MB (JPG, PNG, WEBP, SVG)
                  </span>
                </div>
                <input
                  name="logo"
                  type="text"
                  placeholder="Logo URL or Drive Link"
                  value={formData.logo}
                  onChange={handleChange}
                  className="w-full bg-surface border border-outline-variant rounded-md px-3 py-1.5 font-body-sm text-body-sm text-secondary focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all mt-2"
                />
              </div>
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Agency Name */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block">
                  Agency Name
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Social Buzz Media"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Primary Contact Email */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block">
                  Primary Contact Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="e.g. hello@socialbuzzmedia.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Website URL */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block">
                  Website URL
                </label>
                <input
                  name="website"
                  type="url"
                  placeholder="https://socialbuzzmedia.com"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              {/* GST Number */}
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface block">
                  GST Number
                </label>
                <input
                  name="gstNumber"
                  type="text"
                  placeholder="e.g. 07AABCS1429B1Z0"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Physical Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface block">
                  Physical Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="Enter agency office address..."
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              {/* Account Password */}
              <div className="space-y-2 md:col-span-2">
                <label className="font-label-md text-label-md text-on-surface block">
                  Agency Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter agency password..."
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-surface border border-outline-variant rounded-md px-4 py-2 font-body-md text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface cursor-pointer"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="font-body-sm text-xs text-secondary">
                  Encrypted securely with AES-256 in the database &amp; decrypted for viewing.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading || uploadingLogo}
                className="px-6 py-2 bg-[#E8262A] text-white rounded font-label-md text-label-md hover:bg-[#c00016] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {(loading || uploadingLogo) && (
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                )}
                Save Settings
              </button>
            </div>
          </form>
        </section>

        <LoginAccessCard />
      </div>
    </main>
    </RequireAdmin>
  );
}
