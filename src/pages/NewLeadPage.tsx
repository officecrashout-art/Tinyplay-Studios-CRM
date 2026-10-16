import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateLeadModal } from '@/components/modals/CreateLeadModal';

export const NewLeadPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="py-6">
      <CreateLeadModal
        isOpen={true}
        onClose={() => navigate('/leads')}
        onSuccess={(_newLead) => navigate('/leads')}
      />
    </div>
  );
};
