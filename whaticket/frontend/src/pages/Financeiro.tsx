import Card from '@/components/ui/Card';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

const Financeiro = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-600">Gestão financeira e faturamento</p>
      </div>

      <div className="text-center py-12">
        <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
        <p className="text-gray-600">O módulo financeiro estará disponível em breve.</p>
      </div>
    </div>
  );
};

export default Financeiro;