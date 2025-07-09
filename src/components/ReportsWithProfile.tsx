import React from 'react';
import Reports from './Reports';
import ProfileReportSection from './ProfileReportSection';
import { Transaction } from '../types';

interface ReportsWithProfileProps {
  transactions: Transaction[];
}

const ReportsWithProfile: React.FC<ReportsWithProfileProps> = ({ transactions }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3">
        <Reports transactions={transactions} />
      </div>
      <div className="lg:col-span-1">
        <ProfileReportSection />
      </div>
    </div>
  );
};

export default ReportsWithProfile;