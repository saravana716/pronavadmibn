import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// Firebase configuration for Storage
const storageConfig = {
  apiKey: "AIzaSyD1JxUUTKta_i0vUaYMx8vxJu7sBFTq3LY",
  authDomain: "datastore-4c889.firebaseapp.com",
  projectId: "datastore-4c889",
  storageBucket: "datastore-4c889.appspot.com",
  messagingSenderId: "894842595998",
  appId: "1:894842595998:web:8902e80ecdf7b59d65a98f"
};

// Firebase configuration for Firestore/Database
const firestoreConfig = {
  apiKey: "AIzaSyA1mtHVRk0TyWhGFc50JGfVMsFK4tLoxWg",
  authDomain: "pranav-global-school---pgs.firebaseapp.com",
  projectId: "pranav-global-school---pgs",
  storageBucket: "pranav-global-school---pgs.firebasestorage.app",
  messagingSenderId: "1052193372039",
  appId: "1:1052193372039:web:f38831d3dbf591eee7c522"
};

// Initialize Firebase apps
const storageApp = initializeApp(storageConfig, 'storage');
const firestoreApp = initializeApp(firestoreConfig, 'firestore');

// Get Storage from storage app
const storage = getStorage(storageApp);

// Get Firestore from firestore app
const db = getFirestore(firestoreApp);

interface HomePageVideo {
  url: string;
  name: string;
  fullPath: string;
  updatedAt: Timestamp;
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
      const videoDocRef = doc(db, 'homePage', 'video');
      const videoDoc = await getDoc(videoDocRef);
      
      if (videoDoc.exists()) {
        const data = videoDoc.data();
        setCurrentVideo({
          url: data.url,
          name: data.name,
          fullPath: data.fullPath,
          updatedAt: data.updatedAt
        });
      } else {
        setCurrentVideo(null);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error loading video:', err);
      setError('Failed to load current video. Please check Firestore permissions.');
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
    setUploadProgress(0);

    try {
      // Delete old video if exists
      if (currentVideo) {
        try {
          const oldFileRef = ref(storage, currentVideo.fullPath);
          await deleteObject(oldFileRef);
          console.log('Old video deleted from storage');
        } catch (deleteErr: any) {
          console.warn('Error deleting old video (may not exist):', deleteErr);
          // Continue even if old file deletion fails
        }
      }

      // Upload new video
      const fileName = `homepage_video_${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, `homepage/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              // Get download URL after upload completes
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Video uploaded successfully. URL:', downloadURL);
              
              // Save to Firestore (replace existing)
              const videoDocRef = doc(db, 'homePage', 'video');
              await setDoc(videoDocRef, {
                url: downloadURL,
                name: selectedFile.name,
                fullPath: uploadTask.snapshot.ref.fullPath,
                updatedAt: Timestamp.now()
              });
              
              console.log('Video saved to Firestore');
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
      });

      // Reload current video
      await loadCurrentVideo();
      setSelectedFile(null);
      setUploadProgress(0);
      setError(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      
      if (err.code === 'storage/unauthorized' || err.code === 'permission-denied') {
        setError(`Permission denied: Please update Firebase Storage security rules for bucket "${storage.app.options.storageBucket}". Rules should allow write access to "homepage/*" path.`);
      } else if (err.code === 'permission-denied' || err.code === 'firestore/permission-denied') {
        setError(`Firestore permission denied: Please update Firestore security rules for project "${db.app.options.projectId}". Rules should allow write access to "homePage" collection.`);
      } else {
        setError(`Upload failed: ${err.message}`);
      }
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
              <p><strong>Last Updated:</strong> {currentVideo.updatedAt instanceof Timestamp 
                ? new Date(currentVideo.updatedAt.toMillis()).toLocaleString() 
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

