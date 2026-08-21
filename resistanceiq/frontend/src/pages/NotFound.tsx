import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="page-wrap py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6 text-[#0BDFA0]">
        <Compass size={32} />
      </div>
      <h1 className="display-md mb-2">404 — Scientific Route Not Found</h1>
      <p className="text-sm text-[#9AACBE] max-w-md mx-auto mb-8">
        The requested resource, dataset partition, or intelligence route does not exist within the current workspace schema.
      </p>
      <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
        <ArrowLeft size={16} />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
