
import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { JobApplication, Status } from '../types';
import { STATUS_OPTIONS } from '../constants';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';

// Firebase configuration for Firestore/Database
const firestoreConfig = {
  apiKey: "AIzaSyA1mtHVRk0TyWhGFc50JGfVMsFK4tLoxWg",
  authDomain: "pranav-global-school---pgs.firebaseapp.com",
  projectId: "pranav-global-school---pgs",
  storageBucket: "pranav-global-school---pgs.firebasestorage.app",
  messagingSenderId: "1052193372039",
  appId: "1:1052193372039:web:f38831d3dbf591eee7c522"
};

// Initialize Firebase app for Firestore
const firestoreApp = initializeApp(firestoreConfig, 'job-firestore');
const db = getFirestore(firestoreApp);

const ITEMS_PER_PAGE = 5;

const JobApplications: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableApp, setEditableApp] = useState<JobApplication | null>(null);

  // Load job applications from Firestore
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobApplicationsRef = collection(db, 'jobApplications');
      const snapshot = await getDocs(jobApplicationsRef);
      
      const apps: JobApplication[] = [];
      
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        
        // Convert Firestore Timestamp to string
        let createdAtStr = '';
        if (data.createdAt) {
          if (data.createdAt instanceof Timestamp) {
            createdAtStr = data.createdAt.toDate().toLocaleDateString();
          } else if (data.createdAt.toDate) {
            createdAtStr = data.createdAt.toDate().toLocaleDateString();
          } else {
            createdAtStr = new Date(data.createdAt).toLocaleDateString();
          }
        } else {
          createdAtStr = new Date().toLocaleDateString();
        }
        
        // Map Firestore data to JobApplication interface
        apps.push({
          id: docSnapshot.id,
          name: data.fullName || data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          city: data.city || '',
          position: data.position || '',
          resumeUrl: data.resumeUrl || '',
          coverLetter: data.coverLetter || data.message || '',
          status: (data.status as Status) || Status.New,
          createdAt: createdAtStr
        });
      });
      
      // Sort by createdAt (newest first)
      apps.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setApplications(apps);
    } catch (err: any) {
      console.error('Error loading job applications:', err);
      setError('Failed to load job applications. Please check Firestore permissions.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredApplications = useMemo(() => {
    return applications
      .filter(app => {
        if (statusFilter !== 'All' && app.status !== statusFilter) {
          return false;
        }
        if (debouncedSearchTerm && !app.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) && !app.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [applications, debouncedSearchTerm, statusFilter]);
  
  const { currentData, currentPage, maxPage, jump, next, prev } = usePagination({ data: filteredApplications, itemsPerPage: ITEMS_PER_PAGE });

  useEffect(() => {
    if (currentPage > maxPage && maxPage > 0) {
      jump(maxPage);
    }
  }, [filteredApplications, currentPage, maxPage, jump]);

  const handleView = (app: JobApplication) => {
    setSelectedApp(app);
    setEditableApp({ ...app });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
    setEditableApp(null);
  };

  const handleSave = async () => {
    if (editableApp) {
      try {
        setError(null);
        // Update in Firestore
        const appRef = doc(db, 'jobApplications', editableApp.id);
        await updateDoc(appRef, {
          fullName: editableApp.name,
          email: editableApp.email,
          phone: editableApp.phone,
          position: editableApp.position,
          resumeUrl: editableApp.resumeUrl,
          coverLetter: editableApp.coverLetter,
          status: editableApp.status
        });
        
        // Update local state
        setApplications(prev => prev.map(app => app.id === editableApp.id ? editableApp : app));
        handleCloseModal();
      } catch (err: any) {
        console.error('Error updating application:', err);
        setError(`Failed to update application: ${err.message}`);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (editableApp) {
      setEditableApp({ ...editableApp, [e.target.name]: e.target.value });
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-primary mb-6">Job Applications</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div className="w-full md:w-1/2 lg:w-1/3">
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
            </Select>
            <Button onClick={loadApplications} variant="secondary" className="text-sm px-3 py-2">
              Refresh
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading job applications...</div>
        ) : currentData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No job applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Email</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Position</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map(app => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-700 font-mono">{app.id.substring(0, 8)}...</td>
                  <td className="p-3 text-sm font-medium text-gray-900">{app.name}</td>
                  <td className="p-3 text-sm text-gray-700">{app.email}</td>
                  <td className="p-3 text-sm text-gray-700">{app.position}</td>
                  <td className="p-3 text-sm text-gray-700"><Badge status={app.status} /></td>
                  <td className="p-3 text-sm text-gray-700">{app.createdAt}</td>
                  <td className="p-3 text-sm text-gray-700">
                    <Button variant="secondary" onClick={() => handleView(app)}>View</Button>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && currentData.length > 0 && (
          <Pagination currentPage={currentPage} maxPage={maxPage} onPrev={prev} onNext={next} onJump={jump} />
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Application: ${selectedApp?.id}`}
        footer={
          <div className="space-x-2">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        }
      >
        {editableApp && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Name" name="name" value={editableApp.name} onChange={handleInputChange} />
              <Input label="Email" name="email" type="email" value={editableApp.email} onChange={handleInputChange} />
            </div>
            <div>
              <Input label="Phone" name="phone" value={editableApp.phone} onChange={handleInputChange} />
            </div>
            <div>
              <Input label="Position Applied For" name="position" value={editableApp.position} onChange={handleInputChange} />
            </div>
            {editableApp.resumeUrl && (
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-1">Resume</p>
                <a 
                  href={editableApp.resumeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent hover:underline text-sm"
                >
                  View Resume
                </a>
              </div>
            )}
            <div>
              <Select label="Status" name="status" value={editableApp.status} onChange={handleInputChange}>
                {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
              </Select>
            </div>
            {editableApp.coverLetter && (
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</p>
                <p className="text-gray-600 p-2 border rounded-md bg-gray-50 whitespace-pre-wrap min-h-[100px]">
                  {editableApp.coverLetter || 'No cover letter provided.'}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobApplications;
