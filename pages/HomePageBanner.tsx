import React, { useState, useEffect } from 'react';
import { supabase, BUCKET_NAME } from '../supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

interface HomePageBanner {
  url: string;
  name: string;
  fullPath: string;
  updatedAt: string;
}

const HomePageBanner: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentBanner, setCurrentBanner] = useState<HomePageBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load current banner on component mount
  useEffect(() => {
    loadCurrentBanner();
  }, []);

  const loadCurrentBanner = async () => {
    try {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('homepage_settings')
        .select('*')
        .eq('key', 'banner')
        .maybeSingle();

      if (dbError) throw dbError;

      if (data) {
        setCurrentBanner({
          url: data.url,
          name: data.name,
          fullPath: data.full_path,
          updatedAt: data.updated_at
        });
      } else {
        setCurrentBanner(null);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error loading banner:', err);
      setError('Failed to load current banner from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate image file
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      // Delete old banner if exists
      if (currentBanner && currentBanner.fullPath) {
        try {
          if (currentBanner.fullPath.includes('/')) {
            await supabase.storage.from(BUCKET_NAME).remove([currentBanner.fullPath]);
            console.log('Old banner deleted from storage');
          }
        } catch (deleteErr: any) {
          console.warn('Error deleting old banner:', deleteErr);
        }
      }

      setUploadProgress(40);

      // Upload new banner
      const fileName = `homepage_banner_${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`;
      const filePath = `homepage/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // Get download URL after upload completes
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const downloadURL = urlData.publicUrl;

      setUploadProgress(90);

      // Save/Upsert to database
      const { error: dbError } = await supabase
        .from('homepage_settings')
        .upsert({
          key: 'banner',
          url: downloadURL,
          name: selectedFile.name,
          full_path: filePath,
          updated_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setUploadProgress(100);

      // Reload current banner
      await loadCurrentBanner();
      setSelectedFile(null);
      setUploadProgress(0);
      setError(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Upload failed: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-primary mb-6">Home Page Offer Banner</h2>

      {/* Current Banner Section */}
      <Card className="mb-6">
        <h3 className="text-xl font-bold text-primary mb-4">Current Banner</h3>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : currentBanner ? (
          <div>
            <div className="mb-4">
              <img
                src={currentBanner.url}
                alt={currentBanner.name}
                className="w-full rounded-lg shadow-md"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>File Name:</strong> {currentBanner.name}</p>
              <p><strong>Last Updated:</strong> {currentBanner.updatedAt 
                ? new Date(currentBanner.updatedAt).toLocaleString() 
                : 'Unknown'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No banner uploaded yet. Upload an image to get started.
          </div>
        )}
      </Card>

      {/* Upload Section */}
      <Card>
        <h3 className="text-xl font-bold text-primary mb-4">Upload New Banner</h3>
        <p className="text-gray-600 mb-4 text-sm">
          Upload a new banner image to replace the current one. The old banner will be automatically deleted.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Image File
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90 cursor-pointer"
            disabled={uploading}
          />
        </div>

        {selectedFile && (
          <div className="mb-4">
            <div className="p-3 bg-gray-50 rounded mb-3">
              <p className="text-sm text-gray-700">
                <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                style={{ maxHeight: '300px', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : currentBanner ? 'Replace Banner' : 'Upload Banner'}
        </Button>
      </Card>
    </div>
  );
};

export default HomePageBanner;

