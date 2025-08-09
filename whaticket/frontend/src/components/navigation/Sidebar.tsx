import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon,
  UsersIcon,
  PhoneIcon,
  QueueListIcon,
  MegaphoneIcon,
  ChatBubbleBottomCenterTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  TagIcon,
  KeyIcon,
  CurrencyDollarIcon,
  BoltIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const Sidebar = ({ collapsed, onToggleCollapsed }: SidebarProps) => {
  const { user, hasPermission, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      permission: 'dashboard:view'
    },
    {
      name: 'Tickets',
      href: '/tickets',
      icon: ChatBubbleLeftRightIcon,
      permission: null
    },
    {
      name: 'Contatos',
      href: '/contacts',
      icon: UsersIcon,
      permission: null
    },
    {
      name: 'Mensagens Rápidas',
      href: '/quick-messages',
      icon: BoltIcon,
      permission: null
    },
    {
      name: 'Tags',
      href: '/tags',
      icon: TagIcon,
      permission: null
    }
  ];

  const adminNavigation = [
    {
      name: 'Usuários',
      href: '/users',
      icon: UsersIcon,
      permission: 'user:create'
    },
    {
      name: 'Filas',
      href: '/queues',
      icon: QueueListIcon,
      permission: 'queue:create'
    },
    {
      name: 'Conexões WhatsApp',
      href: '/whatsapp-connections',
      icon: PhoneIcon,
      permission: 'whatsapp:create'
    },
    {
      name: 'Campanhas',
      href: '/campaigns',
      icon: MegaphoneIcon,
      permission: 'campaign:create'
    },
    {
      name: 'Chatbot',
      href: '/chatbot',
      icon: ChatBubbleBottomCenterTextIcon,
      permission: 'queue:edit'
    },
    {
      name: 'Tokens API',
      href: '/api-tokens',
      icon: KeyIcon,
      permission: 'settings:edit'
    }
  ];

  const managementNavigation = [
    {
      name: 'Relatórios',
      href: '/reports',
      icon: ChartBarIcon,
      permission: 'reports:view'
    },
    {
      name: 'Financeiro',
      href: '/financeiro',
      icon: CurrencyDollarIcon,
      permission: 'settings:edit'
    },
    {
      name: 'Configurações',
      href: '/settings',
      icon: Cog6ToothIcon,
      permission: 'settings:edit'
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const renderNavItem = (item: any) => {
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <NavLink
        key={item.name}
        to={item.href}
        className={`
          flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
          ${active 
            ? 'bg-sky-50 text-sky-700 border-r-2 border-sky-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
        title={collapsed ? item.name : ''}
      >
        <Icon className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
        {!collapsed && (
          <span className="truncate">{item.name}</span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-sky-700 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Oryum BusinessAI</h2>
                <p className="text-xs text-gray-500">v3.5</p>
              </div>
            </div>
          )}
          
          {collapsed && (
            <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-sky-700 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
            </div>
          )}

          <button
            onClick={onToggleCollapsed}
            className="hidden lg:flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="sidebar-content">
        <nav className="px-3 space-y-1">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigation.map(renderNavItem)}
          </div>

          {/* Admin Navigation */}
          {adminNavigation.some(item => !item.permission || hasPermission(item.permission)) && (
            <>
              <div className="pt-4">
                {!collapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Administração
                  </h3>
                )}
                <div className="space-y-1">
                  {adminNavigation.map(renderNavItem)}
                </div>
              </div>
            </>
          )}

          {/* Management Navigation */}
          {managementNavigation.some(item => !item.permission || hasPermission(item.permission)) && (
            <>
              <div className="pt-4">
                {!collapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Gestão
                  </h3>
                )}
                <div className="space-y-1">
                  {managementNavigation.map(renderNavItem)}
                </div>
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-medium text-gray-700">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.profile}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => logout()}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sair"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}

        {collapsed && (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sair"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;