
'use client';

import { useEffect, useState, FormEvent, ChangeEvent, Fragment, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { PlusCircle, Upload, LogOut } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { Dialog, Transition } from '@headlessui/react';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: string;
}

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phoneNumber: '', status: 'New' });
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && user) {
      fetchLeads();
    }
  }, [user, loading, logout]);

  useEffect(() => {
    let filtered = leads;
    if (statusFilter !== 'All') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      } else {
        console.error('Failed to fetch leads');
        if (res.status === 401) {
          logout();
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  }, [logout]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingLead) {
      setEditingLead({ ...editingLead, [name]: value });
    } else {
      setNewLead({ ...newLead, [name]: value });
    }
  };

  const handleAddLead = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newLead)
      });
      if (res.ok) {
        fetchLeads();
        handleModalClose();
      } else {
        console.error('Failed to add lead');
      }
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  const handleUpdateLead = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/leads/${editingLead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingLead)
      });
      if (res.ok) {
        fetchLeads();
        handleModalClose();
      } else {
        console.error('Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/leads/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchLeads();
        } else {
          console.error('Failed to delete lead');
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead({ ...lead });
    setShowAddLeadModal(true);
  };

  const handleModalClose = () => {
    setShowAddLeadModal(false);
    setEditingLead(null);
    setNewLead({ name: '', email: '', phoneNumber: '', status: 'New' });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    const formData = new FormData();
    formData.append('csvFile', csvFile);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/leads/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        alert(result.message);
        fetchLeads();
        setShowUploadModal(false);
        setCsvFile(null);
      } else {
        const errorData = await res.json();
        alert(`Upload failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An error occurred during file upload.');
    }
  };

  if (loading || !user) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user.name}
          </h1>
          <button
            onClick={logout}
            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border rounded px-3 py-2 w-full sm:w-auto text-gray-900"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded px-3 py-2 text-gray-900"
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Lost">Lost</option>
                  <option value="Won">Won</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add Lead
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map(lead => (
                    <tr key={lead._id}>
                      <td className="py-4 px-6 whitespace-nowrap text-gray-900">{lead.name}</td>
                      <td className="py-4 px-6 whitespace-nowrap text-gray-900">{lead.email}</td>
                      <td className="py-4 px-6 whitespace-nowrap text-gray-900">{lead.phoneNumber}</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                          lead.status === 'Lost' ? 'bg-red-100 text-red-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                        <button type="button" onClick={() => handleEditClick(lead)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                        <button onClick={() => handleDeleteLead(lead._id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Transition appear show={showAddLeadModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleModalClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {editingLead ? 'Edit Lead' : 'Add New Lead'}
                  </Dialog.Title>
                  <form onSubmit={editingLead ? handleUpdateLead : handleAddLead} className="mt-4">
                    <div className="space-y-4">
                      <input type="text" name="name" value={editingLead ? editingLead.name : newLead.name} onChange={handleInputChange} placeholder="Name" className="w-full border rounded px-3 py-2 text-gray-900" required />
                      <input type="email" name="email" value={editingLead ? editingLead.email : newLead.email} onChange={handleInputChange} placeholder="Email" className="w-full border rounded px-3 py-2 text-gray-900" required />
                      <input type="text" name="phoneNumber" value={editingLead ? editingLead.phoneNumber : newLead.phoneNumber} onChange={handleInputChange} placeholder="Phone Number" className="w-full border rounded px-3 py-2 text-gray-900" required />
                      <select name="status" value={editingLead ? editingLead.status : newLead.status} onChange={handleInputChange} className="w-full border rounded px-3 py-2 text-gray-900">
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Lost">Lost</option>
                        <option value="Won">Won</option>
                      </select>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                      <button type="button" onClick={handleModalClose} className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                        Cancel
                      </button>
                      <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                        {editingLead ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={showUploadModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowUploadModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Upload CSV
                  </Dialog.Title>
                  <form onSubmit={handleUploadSubmit} className="mt-4">
                    <div className="mt-4">
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="w-full text-gray-900" />
                      <p className="text-sm text-gray-500 mt-2">CSV must contain &apos;name&apos;, &apos;email&apos;, and &apos;phoneNumber&apos; columns.</p>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2">
                      <button type="button" onClick={() => setShowUploadModal(false)} className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                        Cancel
                      </button>
                      <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2" disabled={!csvFile}>
                        Upload
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
