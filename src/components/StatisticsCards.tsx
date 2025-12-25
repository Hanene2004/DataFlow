import { Database, FileSpreadsheet, BarChart3, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatisticsCardsProps {
  rowCount: number;
  columnCount: number;
  missingCount: number;
  numericColumns: number;
}

export function StatisticsCards({ rowCount, columnCount, missingCount, numericColumns }: StatisticsCardsProps) {
  const cards = [
    {
      title: 'Total Rows',
      value: rowCount.toLocaleString(),
      icon: Database,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Columns',
      value: columnCount.toLocaleString(),
      icon: FileSpreadsheet,
      color: 'bg-green-500',
    },
    {
      title: 'Numeric Columns',
      value: numericColumns.toLocaleString(),
      icon: BarChart3,
      color: 'bg-orange-500',
    },
    {
      title: 'Missing Values',
      value: missingCount.toLocaleString(),
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`${card.color} p-3 rounded-xl shadow-lg shadow-current/20`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{card.title}</p>
            <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
