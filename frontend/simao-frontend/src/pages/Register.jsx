import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import simaoLogo from '../assets/simao-logo.png';

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    empresa: '',
    telefone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Limpar erro quando usuário começar a digitar
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    if (formData.senha.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (formData.senha !== formData.confirmarSenha) {
      setError('Senhas não coincidem');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmarSenha, ...dadosRegistro } = formData;
      await register(dadosRegistro);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: 'Fraca', color: 'text-red-500' };
      case 2:
        return { text: 'Média', color: 'text-yellow-500' };
      case 3:
        return { text: 'Boa', color: 'text-blue-500' };
      case 4:
        return { text: 'Forte', color: 'text-green-500' };
      default:
        return { text: '', color: '' };
    }
  };

  const strength = passwordStrength(formData.senha);
  const strengthInfo = getPasswordStrengthText(strength);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Logo e título */}
        <div className="text-center">
          <img
            src={simaoLogo}
            alt="Simão IA Rural"
            className="mx-auto h-16 w-auto"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Comece a usar o Simão IA Rural hoje mesmo
          </p>
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para criar sua conta
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    name="empresa"
                    type="text"
                    value={formData.empresa}
                    onChange={handleChange}
                    placeholder="Nome da empresa"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha *</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    name="senha"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.senha}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formData.senha && (
                  <p className={`text-xs ${strengthInfo.color}`}>
                    Força da senha: {strengthInfo.text}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar senha *</Label>
                <div className="relative">
                  <Input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    placeholder="Digite a senha novamente"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {formData.confirmarSenha && formData.senha === formData.confirmarSenha && (
                  <p className="text-xs text-green-500 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Senhas coincidem
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Já tem uma conta? </span>
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Faça login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Informações adicionais */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Ao criar uma conta, você concorda com nossos{' '}
            <a href="#" className="underline hover:text-gray-700">
              Termos de Serviço
            </a>{' '}
            e{' '}
            <a href="#" className="underline hover:text-gray-700">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

