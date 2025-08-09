import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PlusIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

const ChatBot = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbot AI</h1>
          <p className="text-gray-600">Configure fluxos de atendimento inteligentes</p>
        </div>
        <Button leftIcon={<PlusIcon className="w-4 h-4" />}>Novo Fluxo</Button>
      </div>

      <div className="text-center py-12">
        <ChatBubbleBottomCenterTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
        <p className="text-gray-600">O construtor de chatbot estará disponível em breve.</p>
      </div>
    </div>
  );
};

export default ChatBot;