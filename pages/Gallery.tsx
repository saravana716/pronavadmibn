import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// Firebase configuration for Storage
// NOTE: If you get "Permission denied" errors, you need to update Firebase Storage security rules.
// See FIREBASE_STORAGE_SETUP.md for detailed instructions.
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

type Category = 'All' | 'Junior' | 'Senior' | 'K1' | 'K2' | 'Day Care';

interface GalleryItem {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video';
  fullPath: string;
  category?: Category;
  createdAt?: Timestamp;
}

const categories: Category[] = ['All', 'Junior', 'Senior', 'K1', 'K2', 'Day Care'];

const Gallery: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [uploadCategory, setUploadCategory] = useState<Category>('Junior');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load gallery items on component mount
  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      const galleryCollection = collection(db, 'gallery');
      const snapshot = await getDocs(galleryCollection);
      
      const items: GalleryItem[] = [];
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        items.push({
          id: docSnapshot.id,
          url: data.url,
          name: data.name,
          type: data.type,
          fullPath: data.fullPath,
          category: data.category || 'Junior', // Default to Junior for old items
          createdAt: data.createdAt
        });
      });
      
      // Sort by createdAt (newest first)
      items.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
          const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
          return bTime - aTime;
        }
        return 0;
      });
      
      setGalleryItems(items);
      setError(null);
    } catch (err: any) {
      console.error('Error loading gallery:', err);
      setError('Failed to load gallery items. Please check Firestore permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    const progress: { [key: string]: number } = {};

    try {
      // Verify storage instance is using the correct config
      console.log('Using storage bucket:', storage.app.options.storageBucket);
      
      const uploadPromises = files.map(async (file) => {
        const fileName = `${Date.now()}_${file.name}`;
        // Explicitly use storage from storageApp
        const storageRef = ref(storage, `gallery/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              progress[fileName] = progressValue;
              setUploadProgress({ ...progress });
            },
            (error) => {
              console.error('Upload error:', error);
              console.error('Error code:', error.code);
              console.error('Error message:', error.message);
              console.error('Storage bucket:', storage.app.options.storageBucket);
              reject(error);
            },
            async () => {
              try {
                // Get download URL after upload completes
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('File uploaded successfully. URL:', downloadURL);
                
                // Determine file type
                const type = file.type.startsWith('video/') ? 'video' : 'image';
                
                // Save to Firestore
                console.log('Saving to Firestore...', {
                  projectId: db.app.options.projectId,
                  collection: 'gallery'
                });
                
                try {
                  const docRef = await addDoc(collection(db, 'gallery'), {
                    url: downloadURL,
                    name: file.name,
                    type: type,
                    fullPath: uploadTask.snapshot.ref.fullPath,
                    category: uploadCategory,
                    createdAt: Timestamp.now()
                  });
                  console.log('Saved to Firestore with ID:', docRef.id);
                  resolve();
                } catch (firestoreError: any) {
                  console.error('Firestore save error:', firestoreError);
                  console.error('Firestore error code:', firestoreError.code);
                  console.error('Firestore error message:', firestoreError.message);
                  console.error('Firestore project:', db.app.options.projectId);
                  
                  // Reject with Firestore-specific error
                  reject(new Error(`Firestore error: ${firestoreError.message} (Code: ${firestoreError.code}). Please check Firestore security rules for project "${db.app.options.projectId}"`));
                }
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      });

      await Promise.all(uploadPromises);
      setFiles([]);
      setUploadProgress({});
      setUploadCategory('Junior'); // Reset to default
      await loadGalleryItems();
      setError(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        storageBucket: storage.app.options.storageBucket
      });
      
      if (err.code === 'storage/unauthorized' || err.code === 'permission-denied') {
        setError(`Permission denied: Please update Firebase Storage security rules for bucket "${storage.app.options.storageBucket}". Rules should allow write access to "gallery/*" path.`);
      } else if (err.message && err.message.includes('Firestore error')) {
        setError(err.message);
      } else if (err.code === 'permission-denied' || err.code === 'firestore/permission-denied') {
        setError(`Firestore permission denied: Please update Firestore security rules for project "${db.app.options.projectId}". Rules should allow write access to "gallery" collection.`);
      } else {
        setError(`Upload failed: ${err.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, fullPath: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      // Delete from Storage
      const fileRef = ref(storage, fullPath);
      await deleteObject(fileRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'gallery', id));
      
      await loadGalleryItems();
      setError(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(`Failed to delete ${name}: ${err.message}`);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-primary mb-6">Gallery</h2>

      {/* Upload Section */}
      <Card className="mb-6">
        <h3 className="text-xl font-bold text-primary mb-4">Upload Images & Videos</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Files (Images or Videos)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90 cursor-pointer"
            disabled={uploading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value as Category)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={uploading}
          >
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="K1">K1</option>
            <option value="K2">K2</option>
            <option value="Day Care">Day Care</option>
          </select>
        </div>

        {files.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    disabled={uploading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Progress:</h4>
            {Object.entries(uploadProgress).map(([fileName, progress]) => {
              const progressValue = typeof progress === 'number' ? progress : 0;
              return (
                <div key={fileName} className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{fileName}</span>
                    <span>{Math.round(progressValue)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressValue}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </Card>

      {/* Gallery Grid */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-primary">Gallery Items</h3>
          <Button onClick={loadGalleryItems} variant="secondary" className="text-sm px-3 py-1.5">
            Refresh
          </Button>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'All' && (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {category === 'Junior' && (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
                {category === 'Senior' && (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222 4 2.222V20" />
                  </svg>
                )}
                {category === 'K1' && (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
                {category === 'K2' && (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {category === 'Day Care' && (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                <span>{category}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading gallery...</div>
        ) : (() => {
          const filteredItems = selectedCategory === 'All' 
            ? galleryItems 
            : galleryItems.filter(item => item.category === selectedCategory);
          
          return filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items found in {selectedCategory === 'All' ? 'gallery' : selectedCategory} category. Upload some files to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
              <div key={item.id} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleDelete(item.id, item.fullPath, item.name)}
                      className="opacity-0 group-hover:opacity-100 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 truncate" title={item.name}>
                    {item.name}
                  </p>
                  {item.category && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          );
        })()}
      </Card>
    </div>
  );
};

export default Gallery;

