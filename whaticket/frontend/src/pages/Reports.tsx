import Card from '@/components/ui/Card';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600">Análises e métricas do sistema</p>
      </div>

      <div className="text-center py-12">
        <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
        <p className="text-gray-600">Os relatórios estarão disponíveis em breve.</p>
      </div>
    </div>
  );
};

export default Reports;