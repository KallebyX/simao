interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-sky-600 to-sky-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Oryum BusinessAI</h1>
          <p className="text-gray-600 mt-2">Sistema de Atendimento WhatsApp</p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-xl px-8 py-10">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>&copy; 2024 Oryum Tech. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;