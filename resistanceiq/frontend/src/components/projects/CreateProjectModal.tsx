import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FolderPlus } from 'lucide-react';
import { api } from '../../api/client.ts';
import { useToast } from '../../context/ToastContext.tsx';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: async () => {
      return await api.createProject({ name, description });
    },
    onSuccess: (newProj) => {
      showToast(`Research project "${newProj.name}" created successfully.`, 'success', 'Project Created');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setName('');
      setDescription('');
      onClose();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create project.', 'error', 'Error');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg p-6 rounded-2xl bg-[#0B1017] border border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0BDFA0]/10 flex items-center justify-center text-[#0BDFA0]">
              <FolderPlus size={20} />
            </div>
            <h2 className="text-lg font-semibold text-[#F1F5F9]">Create Research Project</h2>
          </div>
          <button onClick={onClose} className="text-[#7C8A9A] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neonicotinoid Resistance Series"
              required
              className="w-full h-11 px-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#7C8A9A] uppercase tracking-wider mb-2">
              Description & Objectives
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lead optimization for nAChR target resistance avoidance in Myzus persicae."
              rows={3}
              className="w-full p-4 rounded-lg bg-[#05070B] border border-white/[0.08] text-sm text-[#F1F5F9] focus:outline-none focus:border-[#0BDFA0]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.04]">
            <button type="button" onClick={onClose} className="btn btn-ghost text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="btn btn-primary text-xs"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
