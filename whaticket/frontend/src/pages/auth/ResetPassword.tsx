import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import useNotificationStore from '@/stores/notificationStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LockClosedIcon, EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotificationStore();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    if (!token) {
      showError('Token de recuperação inválido');
      navigate('/login');
    }
  }, [token, navigate, showError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password: string) => {
    const errors = [];
    
    if (password.length < 6) {
      errors.push('Pelo menos 6 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Pelo menos 1 letra maiúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Pelo menos 1 letra minúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Pelo menos 1 número');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || !formData.confirmPassword) {
      showError('Preencha todos os campos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('As senhas não coincidem');
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      showError(`Senha deve ter: ${passwordErrors.join(', ')}`);
      return;
    }

    if (!token) {
      showError('Token de recuperação inválido');
      return;
    }

    setLoading(true);
    
    try {
      await authService.resetPassword(token, formData.password);
      setResetComplete(true);
      showSuccess('Senha redefinida com sucesso!');
    } catch (error: any) {
      showError(error.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  const passwordErrors = validatePassword(formData.password);
  const isPasswordValid = formData.password && passwordErrors.length === 0;
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  if (resetComplete) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckIcon className="w-8 h-8 text-emerald-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">Senha Redefinida!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
          </p>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/login')}
          className="!py-3"
        >
          Ir para Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Nova Senha</h2>
        <p className="mt-2 text-sm text-gray-600">
          Crie uma nova senha segura para sua conta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Nova Senha"
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
            autoComplete="new-password"
          />

          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            label="Confirmar Nova Senha"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            leftIcon={<LockClosedIcon />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            }
            required
            autoComplete="new-password"
          />
        </div>

        {/* Password requirements */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Requisitos da senha:</p>
          <div className="space-y-2">
            {[
              { text: 'Pelo menos 6 caracteres', valid: formData.password.length >= 6 },
              { text: 'Pelo menos 1 letra maiúscula', valid: /[A-Z]/.test(formData.password) },
              { text: 'Pelo menos 1 letra minúscula', valid: /[a-z]/.test(formData.password) },
              { text: 'Pelo menos 1 número', valid: /\d/.test(formData.password) }
            ].map((req, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  req.valid ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                }`}>
                  {req.valid && <CheckIcon className="w-3 h-3" />}
                </div>
                <span className={`text-xs ${req.valid ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Password match indicator */}
        {formData.confirmPassword && (
          <div className={`flex items-center space-x-2 ${
            passwordsMatch ? 'text-emerald-600' : 'text-red-600'
          }`}>
            <div className="w-4 h-4 rounded-full flex items-center justify-center bg-current bg-opacity-10">
              {passwordsMatch ? (
                <CheckIcon className="w-3 h-3" />
              ) : (
                <span className="text-xs font-bold">!</span>
              )}
            </div>
            <span className="text-sm">
              {passwordsMatch ? 'Senhas coincidem' : 'Senhas não coincidem'}
            </span>
          </div>
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={!isPasswordValid || !passwordsMatch}
          fullWidth
          size="lg"
          className="!py-3"
        >
          Redefinir Senha
        </Button>
      </form>

      <div className="text-center">
        <Link
          to="/login"
          className="text-sm text-sky-600 hover:text-sky-500 transition-colors"
        >
          Voltar ao Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;