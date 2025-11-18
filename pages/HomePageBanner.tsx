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

interface HomePageBanner {
  url: string;
  name: string;
  fullPath: string;
  updatedAt: Timestamp;
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
      const bannerDocRef = doc(db, 'homePage', 'banner');
      const bannerDoc = await getDoc(bannerDocRef);
      
      if (bannerDoc.exists()) {
        const data = bannerDoc.data();
        setCurrentBanner({
          url: data.url,
          name: data.name,
          fullPath: data.fullPath,
          updatedAt: data.updatedAt
        });
      } else {
        setCurrentBanner(null);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error loading banner:', err);
      setError('Failed to load current banner. Please check Firestore permissions.');
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
    setUploadProgress(0);

    try {
      // Delete old banner if exists
      if (currentBanner) {
        try {
          const oldFileRef = ref(storage, currentBanner.fullPath);
          await deleteObject(oldFileRef);
          console.log('Old banner deleted from storage');
        } catch (deleteErr: any) {
          console.warn('Error deleting old banner (may not exist):', deleteErr);
          // Continue even if old file deletion fails
        }
      }

      // Upload new banner
      const fileName = `homepage_banner_${Date.now()}_${selectedFile.name}`;
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
              console.log('Banner uploaded successfully. URL:', downloadURL);
              
              // Save to Firestore (replace existing)
              const bannerDocRef = doc(db, 'homePage', 'banner');
              await setDoc(bannerDocRef, {
                url: downloadURL,
                name: selectedFile.name,
                fullPath: uploadTask.snapshot.ref.fullPath,
                updatedAt: Timestamp.now()
              });
              
              console.log('Banner saved to Firestore');
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        );
      });

      // Reload current banner
      await loadCurrentBanner();
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
              <p><strong>Last Updated:</strong> {currentBanner.updatedAt instanceof Timestamp 
                ? new Date(currentBanner.updatedAt.toMillis()).toLocaleString() 
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

