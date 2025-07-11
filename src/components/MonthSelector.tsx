import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ currentMonth, onMonthChange }) => {
  const getCurrentMonthName = () => {
    const date = new Date(currentMonth + '-01');
    return date.toLocaleDateString('id-ID', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonth);
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 transition-colors">
      <button
        onClick={() => changeMonth('prev')}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>
      
      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
        {getCurrentMonthName()}
      </h2>
      
      <button
        onClick={() => changeMonth('next')}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <ChevronRight className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
};

export default MonthSelector;