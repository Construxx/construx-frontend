'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BoQImportView } from '../../../../../src/components/projects/BoQImportView';

export default function BoQImportPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100 p-6 sm:p-8">
      <BoQImportView
        onProjectCreated={(project) => {
          // Navigate to project dashboard
          if (router) {
            router.push(`/projects/${project.id}`);
          }
        }}
        onCancel={() => {
          if (router) {
            router.back();
          }
        }}
      />
    </div>
  );
}
