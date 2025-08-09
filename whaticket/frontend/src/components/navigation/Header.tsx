import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SignalIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

const Header = ({ onToggleSidebar, sidebarCollapsed }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/tickets': 'Tickets',
      '/contacts': 'Contatos',
      '/users': 'Usuários',
      '/queues': 'Filas Inteligentes',
      '/whatsapp-connections': 'Conexões WhatsApp AI',
      '/campaigns': 'Campanhas Inteligentes',
      '/quick-messages': 'Mensagens Rápidas',
      '/chatbot': 'Chatbot AI',
      '/tags': 'Tags',
      '/api-tokens': 'Tokens API',
      '/reports': 'Relatórios',
      '/settings': 'Configurações',
      '/financeiro': 'Financeiro',
      '/profile': 'Perfil'
    };

    // Check for dynamic routes
    if (path.startsWith('/tickets/')) return 'Detalhes do Ticket';
    if (path.startsWith('/contacts/')) return 'Detalhes do Contato';
    if (path.startsWith('/campaigns/')) return 'Detalhes da Campanha';

    return titles[path] || 'Oryum BusinessAI';
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          {/* Page title */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
            
            {/* Connection status indicator */}
            <div className="flex items-center">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-emerald-600" title="Conectado">
                  <SignalIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Online</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-600" title="Desconectado">
                  <SignalSlashIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Offline</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">Notificações</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 text-center text-sm text-gray-500">
                    Nenhuma notificação no momento
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <button className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                    Ver todas as notificações
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-sky-600 to-sky-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.profile}</p>
              </div>
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-sky-600 capitalize font-medium mt-1">{user?.profile}</p>
                </div>
                
                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserCircleIcon className="w-4 h-4 mr-3" />
                    Meu Perfil
                  </Link>
                  
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-3" />
                    Configurações
                  </Link>
                </div>
                
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;