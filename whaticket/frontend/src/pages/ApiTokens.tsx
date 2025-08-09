import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { KeyIcon, PlusIcon } from '@heroicons/react/24/outline';

const ApiTokens = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tokens API</h1>
          <p className="text-gray-600">Gerencie tokens de acesso à API</p>
        </div>
        <Button leftIcon={<PlusIcon className="w-4 h-4" />}>Novo Token</Button>
      </div>

      <div className="text-center py-12">
        <KeyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
        <p className="text-gray-600">O gerenciamento de tokens estará disponível em breve.</p>
      </div>
    </div>
  );
};

export default ApiTokens;