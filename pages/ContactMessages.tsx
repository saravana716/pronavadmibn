
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
import { ContactMessage, Status } from '../types';
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
const firestoreApp = initializeApp(firestoreConfig, 'contact-firestore');
const db = getFirestore(firestoreApp);

const ITEMS_PER_PAGE = 5;

const ContactMessages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableMsg, setEditableMsg] = useState<ContactMessage | null>(null);

  // Load contact messages from Firestore
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const contactFormsRef = collection(db, 'contactForms');
      const snapshot = await getDocs(contactFormsRef);
      
      const msgs: ContactMessage[] = [];
      
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
        
        // Map Firestore data to ContactMessage interface
        msgs.push({
          id: docSnapshot.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          subject: data.subject || '',
          message: data.message || data.additionalMessage || '',
          status: (data.status as Status) || Status.New,
          createdAt: createdAtStr
        });
      });
      
      // Sort by createdAt (newest first)
      msgs.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setMessages(msgs);
    } catch (err: any) {
      console.error('Error loading contact messages:', err);
      setError('Failed to load contact messages. Please check Firestore permissions.');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredMessages = useMemo(() => {
    return messages
      .filter(msg => {
        if (statusFilter !== 'All' && msg.status !== statusFilter) {
          return false;
        }
        const fullName = `${msg.firstName} ${msg.lastName}`.toLowerCase();
        if (debouncedSearchTerm && !fullName.includes(debouncedSearchTerm.toLowerCase()) && !msg.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages, debouncedSearchTerm, statusFilter]);

  const { currentData, currentPage, maxPage, jump, next, prev } = usePagination({ data: filteredMessages, itemsPerPage: ITEMS_PER_PAGE });

   useEffect(() => {
    if (currentPage > maxPage && maxPage > 0) {
      jump(maxPage);
    }
  }, [filteredMessages, currentPage, maxPage, jump]);

  const handleView = (msg: ContactMessage) => {
    setSelectedMsg(msg);
    setEditableMsg({ ...msg });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMsg(null);
    setEditableMsg(null);
  };

  const handleSave = async () => {
    if (editableMsg) {
      try {
        setError(null);
        // Update in Firestore
        const msgRef = doc(db, 'contactForms', editableMsg.id);
        await updateDoc(msgRef, {
          firstName: editableMsg.firstName,
          lastName: editableMsg.lastName,
          email: editableMsg.email,
          subject: editableMsg.subject,
          message: editableMsg.message,
          status: editableMsg.status
        });
        
        // Update local state
        setMessages(prev => prev.map(msg => msg.id === editableMsg.id ? editableMsg : msg));
        handleCloseModal();
      } catch (err: any) {
        console.error('Error updating message:', err);
        setError(`Failed to update message: ${err.message}`);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (editableMsg) {
      setEditableMsg({ ...editableMsg, [e.target.name]: e.target.value });
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-primary mb-6">Contact Messages</h2>
      
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
            <Button onClick={loadMessages} variant="secondary" className="text-sm px-3 py-2">
              Refresh
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading contact messages...</div>
        ) : currentData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No contact messages found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-sm font-semibold text-gray-600">ID</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Email</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Subject</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
                  <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map(msg => (
                  <tr key={msg.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm text-gray-700 font-mono">{msg.id.substring(0, 8)}...</td>
                  <td className="p-3 text-sm font-medium text-gray-900">{`${msg.firstName} ${msg.lastName}`}</td>
                  <td className="p-3 text-sm text-gray-700">{msg.email}</td>
                  <td className="p-3 text-sm text-gray-700">{msg.subject}</td>
                  <td className="p-3 text-sm text-gray-700"><Badge status={msg.status} /></td>
                  <td className="p-3 text-sm text-gray-700">{msg.createdAt}</td>
                  <td className="p-3 text-sm text-gray-700">
                    <Button variant="secondary" onClick={() => handleView(msg)}>View</Button>
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
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Message: ${selectedMsg?.subject}`}
        footer={
          <div className="space-x-2">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        }
      >
        {editableMsg && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="First Name" name="firstName" value={editableMsg.firstName} onChange={handleInputChange} />
              <Input label="Last Name" name="lastName" value={editableMsg.lastName} onChange={handleInputChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Email" name="email" type="email" value={editableMsg.email} onChange={handleInputChange} />
              <Input label="Subject" name="subject" value={editableMsg.subject} onChange={handleInputChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                name="message"
                value={editableMsg.message}
                onChange={handleInputChange}
                rows={6}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
              />
            </div>
            <div>
              <Select label="Status" name="status" value={editableMsg.status} onChange={handleInputChange}>
                {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
              </Select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContactMessages;
