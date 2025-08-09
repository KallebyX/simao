import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData);
      
      // Redirect to intended page
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      // Error is handled by the useAuth hook
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Fazer Login</h2>
        <p className="mt-2 text-sm text-gray-600">
          Entre com suas credenciais para acessar o sistema
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="email"
          name="email"
          label="E-mail"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={handleChange}
          leftIcon={<EnvelopeIcon />}
          required
          autoComplete="email"
        />

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Senha"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            leftIcon={<LockClosedIcon />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            }
            required
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Lembrar-me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-sky-600 hover:text-sky-500 transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={!isFormValid}
          fullWidth
          size="lg"
          className="!py-3"
        >
          Entrar
        </Button>
      </form>

      <div className="text-center text-sm text-gray-600">
        <p>
          Credenciais padrão: 
          <span className="font-mono bg-gray-100 px-2 py-1 rounded mx-1">admin@admin.com</span>
          /
          <span className="font-mono bg-gray-100 px-2 py-1 rounded mx-1">adminpro</span>
        </p>
      </div>

      {/* Quick login buttons for development */}
      {import.meta.env.DEV && (
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 text-center mb-3">Desenvolvimento - Login rápido:</p>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                setFormData({ email: 'admin@admin.com', password: 'adminpro' });
              }}
            >
              Admin
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;