import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Configure as opções do BusinessAI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Configurações Gerais" className="p-6">
          <div className="space-y-4">
            <Input label="Nome da Empresa" defaultValue="Minha Empresa" />
            <Input label="E-mail de Suporte" defaultValue="suporte@empresa.com" />
            <Button>Salvar</Button>
          </div>
        </Card>

        <Card title="WhatsApp" className="p-6">
          <div className="space-y-4">
            <Input label="Token da API" placeholder="Digite o token" />
            <Input label="Webhook URL" placeholder="https://..." />
            <Button>Salvar</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;