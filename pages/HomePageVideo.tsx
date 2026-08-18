import React, { useState, useEffect } from 'react';
import { supabase, BUCKET_NAME } from '../supabase';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

interface HomePageVideo {
  url: string;
  name: string;
  fullPath: string;
  updatedAt: string;
}

const HomePageVideo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentVideo, setCurrentVideo] = useState<HomePageVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load current video on component mount
  useEffect(() => {
    loadCurrentVideo();
  }, []);

  const loadCurrentVideo = async () => {
    try {
      setLoading(true);
      const { data, error: dbError } = await supabase
        .from('homepage_settings')
        .select('*')
        .eq('key', 'video')
        .maybeSingle();
      
      if (dbError) throw dbError;

      if (data) {
        setCurrentVideo({
          url: data.url,
          name: data.name,
          fullPath: data.full_path,
          updatedAt: data.updated_at
        });
      } else {
        setCurrentVideo(null);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error loading video:', err);
      setError('Failed to load current video from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate video file
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      // Delete old video if exists
      if (currentVideo && currentVideo.fullPath) {
        try {
          if (currentVideo.fullPath.includes('/')) {
            await supabase.storage.from(BUCKET_NAME).remove([currentVideo.fullPath]);
            console.log('Old video deleted from storage');
          }
        } catch (deleteErr: any) {
          console.warn('Error deleting old video:', deleteErr);
        }
      }

      setUploadProgress(40);

      // Upload new video
      const fileName = `homepage_video_${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`;
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
          key: 'video',
          url: downloadURL,
          name: selectedFile.name,
          full_path: filePath,
          updated_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setUploadProgress(100);

      // Reload current video
      await loadCurrentVideo();
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
      <h2 className="text-3xl font-bold text-primary mb-6">Home Page Video</h2>

      {/* Current Video Section */}
      <Card className="mb-6">
        <h3 className="text-xl font-bold text-primary mb-4">Current Video</h3>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : currentVideo ? (
          <div>
            <div className="mb-4">
              <video
                src={currentVideo.url}
                controls
                className="w-full rounded-lg shadow-md"
                style={{ maxHeight: '500px' }}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>File Name:</strong> {currentVideo.name}</p>
              <p><strong>Last Updated:</strong> {currentVideo.updatedAt 
                ? new Date(currentVideo.updatedAt).toLocaleString() 
                : 'Unknown'}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No video uploaded yet. Upload a video to get started.
          </div>
        )}
      </Card>

      {/* Upload Section */}
      <Card>
        <h3 className="text-xl font-bold text-primary mb-4">Upload New Video</h3>
        <p className="text-gray-600 mb-4 text-sm">
          Upload a new video to replace the current one. The old video will be automatically deleted.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Video File
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90 cursor-pointer"
            disabled={uploading}
          />
        </div>

        {selectedFile && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-700">
              <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
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
          {uploading ? 'Uploading...' : currentVideo ? 'Replace Video' : 'Upload Video'}
        </Button>
      </Card>
    </div>
  );
};

export default HomePageVideo;

