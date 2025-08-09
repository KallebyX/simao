import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/auth';
import useNotificationStore from '@/stores/notificationStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const ForgotPassword = () => {
  const { showSuccess, showError } = useNotificationStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      showError('Por favor, insira seu e-mail');
      return;
    }

    setLoading(true);
    
    try {
      await authService.forgotPassword(email);
      setEmailSent(true);
      showSuccess('E-mail de recuperação enviado com sucesso!');
    } catch (error: any) {
      showError(error.message || 'Erro ao enviar e-mail de recuperação');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    
    try {
      await authService.forgotPassword(email);
      showSuccess('E-mail reenviado com sucesso!');
    } catch (error: any) {
      showError(error.message || 'Erro ao reenviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">E-mail Enviado!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enviamos as instruções para redefinir sua senha para:
          </p>
          <p className="mt-1 text-sm font-medium text-sky-600">{email}</p>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-sky-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-sky-800">
                Verifique sua caixa de entrada e siga as instruções no e-mail para redefinir sua senha.
                Se não receber o e-mail em alguns minutos, verifique sua pasta de spam.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            fullWidth
            onClick={handleResendEmail}
            loading={loading}
          >
            Reenviar E-mail
          </Button>
          
          <Link
            to="/login"
            className="flex items-center justify-center space-x-2 text-sm text-sky-600 hover:text-sky-500 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Voltar ao Login</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Esqueceu a Senha?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Digite seu e-mail e enviaremos as instruções para redefinir sua senha
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="email"
          name="email"
          label="E-mail"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<EnvelopeIcon />}
          required
          autoComplete="email"
        />

        <div className="space-y-3">
          <Button
            type="submit"
            loading={loading}
            disabled={!email}
            fullWidth
            size="lg"
            className="!py-3"
          >
            Enviar Instruções
          </Button>
          
          <Link
            to="/login"
            className="flex items-center justify-center space-x-2 text-sm text-sky-600 hover:text-sky-500 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Voltar ao Login</span>
          </Link>
        </div>
      </form>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-600">
              <strong>Lembrou da senha?</strong> Você pode{' '}
              <Link to="/login" className="font-medium text-sky-600 hover:text-sky-500">
                fazer login aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;