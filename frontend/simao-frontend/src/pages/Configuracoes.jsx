import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Bot,
  Palette,
  MessageSquare,
  Bell,
  Shield,
  Save,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  Smartphone,
  Zap,
} from 'lucide-react';

const Configuracoes = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Estados para as configurações
  const [profileData, setProfileData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    empresa: user?.empresa || '',
    telefone: user?.telefone || '',
  });

  const [botConfig, setBotConfig] = useState({
    nome_bot: 'Simão',
    mensagem_boas_vindas: 'Olá! Sou o Simão, seu assistente virtual para agronegócio. Como posso ajudá-lo hoje?',
    mensagem_ausencia: 'Obrigado pela sua mensagem! Nossa equipe retornará em breve.',
    horario_funcionamento_inicio: '08:00',
    horario_funcionamento_fim: '18:00',
    dias_funcionamento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
    auto_resposta_ativa: true,
    qualificacao_automatica: true,
    contexto_conversa: true,
    limite_mensagens_dia: 100,
  });

  const [brandingConfig, setBrandingConfig] = useState({
    logo_url: user?.logo_url || '',
    cor_primaria: user?.cor_primaria || '#0e0385',
    cor_secundaria: user?.cor_secundaria || '#e4c645',
    nome_empresa: user?.empresa || '',
  });

  const [notificationConfig, setNotificationConfig] = useState({
    email_novos_leads: true,
    email_mensagens: false,
    webhook_url: '',
    notificacao_whatsapp: true,
  });

  const [integrationConfig, setIntegrationConfig] = useState({
    openai_api_key: '',
    wppconnect_session: '',
    stripe_webhook_secret: '',
  });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      // Carregar configurações do backend
      // Por enquanto usando dados do usuário
      setProfileData({
        nome: user?.nome || '',
        email: user?.email || '',
        empresa: user?.empresa || '',
        telefone: user?.telefone || '',
      });
    } catch (err) {
      setError('Erro ao carregar configurações');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      await updateUser(profileData);
      setSuccess('Perfil atualizado com sucesso!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBotConfig = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Salvar configurações do bot via API
      // await api.updateBotConfig(botConfig);
      
      setSuccess('Configurações do bot atualizadas!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar configurações do bot');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    try {
      setLoading(true);
      setError('');
      
      await updateUser(brandingConfig);
      setSuccess('Configurações de marca atualizadas!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar configurações de marca');
    } finally {
      setLoading(false);
    }
  };

  const diasSemana = [
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Settings className="mr-2 h-6 w-6" />
          Configurações
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Gerencie suas preferências e configurações do sistema
        </p>
      </div>

      {/* Alertas */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs de configuração */}
      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="bot">Bot IA</TabsTrigger>
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        {/* Aba Perfil */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    value={profileData.nome}
                    onChange={(e) => setProfileData({...profileData, nome: e.target.value})}
                    placeholder="Seu nome completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={profileData.empresa}
                    onChange={(e) => setProfileData({...profileData, empresa: e.target.value})}
                    placeholder="Nome da sua empresa"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={profileData.telefone}
                    onChange={(e) => setProfileData({...profileData, telefone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Bot IA */}
        <TabsContent value="bot">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="mr-2 h-5 w-5" />
                  Configurações do Bot
                </CardTitle>
                <CardDescription>
                  Personalize o comportamento e mensagens do seu assistente virtual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_bot">Nome do Bot</Label>
                  <Input
                    id="nome_bot"
                    value={botConfig.nome_bot}
                    onChange={(e) => setBotConfig({...botConfig, nome_bot: e.target.value})}
                    placeholder="Nome do seu bot"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mensagem_boas_vindas">Mensagem de Boas-vindas</Label>
                  <Textarea
                    id="mensagem_boas_vindas"
                    value={botConfig.mensagem_boas_vindas}
                    onChange={(e) => setBotConfig({...botConfig, mensagem_boas_vindas: e.target.value})}
                    placeholder="Mensagem inicial para novos contatos"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mensagem_ausencia">Mensagem de Ausência</Label>
                  <Textarea
                    id="mensagem_ausencia"
                    value={botConfig.mensagem_ausencia}
                    onChange={(e) => setBotConfig({...botConfig, mensagem_ausencia: e.target.value})}
                    placeholder="Mensagem para fora do horário de funcionamento"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="horario_inicio">Horário de Funcionamento - Início</Label>
                    <Input
                      id="horario_inicio"
                      type="time"
                      value={botConfig.horario_funcionamento_inicio}
                      onChange={(e) => setBotConfig({...botConfig, horario_funcionamento_inicio: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="horario_fim">Horário de Funcionamento - Fim</Label>
                    <Input
                      id="horario_fim"
                      type="time"
                      value={botConfig.horario_funcionamento_fim}
                      onChange={(e) => setBotConfig({...botConfig, horario_funcionamento_fim: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Dias de Funcionamento</Label>
                  <div className="flex flex-wrap gap-2">
                    {diasSemana.map((dia) => (
                      <Badge
                        key={dia.value}
                        variant={botConfig.dias_funcionamento.includes(dia.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const dias = botConfig.dias_funcionamento.includes(dia.value)
                            ? botConfig.dias_funcionamento.filter(d => d !== dia.value)
                            : [...botConfig.dias_funcionamento, dia.value];
                          setBotConfig({...botConfig, dias_funcionamento: dias});
                        }}
                      >
                        {dia.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-resposta Ativa</Label>
                      <p className="text-sm text-gray-600">
                        Responder automaticamente a mensagens recebidas
                      </p>
                    </div>
                    <Switch
                      checked={botConfig.auto_resposta_ativa}
                      onCheckedChange={(checked) => setBotConfig({...botConfig, auto_resposta_ativa: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Qualificação Automática</Label>
                      <p className="text-sm text-gray-600">
                        Qualificar leads automaticamente com IA
                      </p>
                    </div>
                    <Switch
                      checked={botConfig.qualificacao_automatica}
                      onCheckedChange={(checked) => setBotConfig({...botConfig, qualificacao_automatica: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Contexto de Conversa</Label>
                      <p className="text-sm text-gray-600">
                        Manter contexto entre mensagens
                      </p>
                    </div>
                    <Switch
                      checked={botConfig.contexto_conversa}
                      onCheckedChange={(checked) => setBotConfig({...botConfig, contexto_conversa: checked})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="limite_mensagens">Limite de Mensagens por Dia</Label>
                  <Input
                    id="limite_mensagens"
                    type="number"
                    value={botConfig.limite_mensagens_dia}
                    onChange={(e) => setBotConfig({...botConfig, limite_mensagens_dia: parseInt(e.target.value)})}
                    min="1"
                    max="1000"
                  />
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveBotConfig} disabled={loading}>
                    {loading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Branding */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Personalização da Marca
              </CardTitle>
              <CardDescription>
                Customize a aparência do sistema com sua identidade visual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo_url">URL do Logo</Label>
                <div className="flex space-x-2">
                  <Input
                    id="logo_url"
                    value={brandingConfig.logo_url}
                    onChange={(e) => setBrandingConfig({...brandingConfig, logo_url: e.target.value})}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cor_primaria">Cor Primária</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="cor_primaria"
                      type="color"
                      value={brandingConfig.cor_primaria}
                      onChange={(e) => setBrandingConfig({...brandingConfig, cor_primaria: e.target.value})}
                      className="w-16 h-10"
                    />
                    <Input
                      value={brandingConfig.cor_primaria}
                      onChange={(e) => setBrandingConfig({...brandingConfig, cor_primaria: e.target.value})}
                      placeholder="#0e0385"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="cor_secundaria"
                      type="color"
                      value={brandingConfig.cor_secundaria}
                      onChange={(e) => setBrandingConfig({...brandingConfig, cor_secundaria: e.target.value})}
                      className="w-16 h-10"
                    />
                    <Input
                      value={brandingConfig.cor_secundaria}
                      onChange={(e) => setBrandingConfig({...brandingConfig, cor_secundaria: e.target.value})}
                      placeholder="#e4c645"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nome_empresa_branding">Nome da Empresa</Label>
                <Input
                  id="nome_empresa_branding"
                  value={brandingConfig.nome_empresa}
                  onChange={(e) => setBrandingConfig({...brandingConfig, nome_empresa: e.target.value})}
                  placeholder="Nome da sua empresa"
                />
              </div>
              
              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveBranding} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Notificações */}
        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Configurações de Notificação
              </CardTitle>
              <CardDescription>
                Gerencie como e quando você quer ser notificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email para Novos Leads</Label>
                    <p className="text-sm text-gray-600">
                      Receber email quando um novo lead for criado
                    </p>
                  </div>
                  <Switch
                    checked={notificationConfig.email_novos_leads}
                    onCheckedChange={(checked) => setNotificationConfig({...notificationConfig, email_novos_leads: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email para Mensagens</Label>
                    <p className="text-sm text-gray-600">
                      Receber email para cada nova mensagem
                    </p>
                  </div>
                  <Switch
                    checked={notificationConfig.email_mensagens}
                    onCheckedChange={(checked) => setNotificationConfig({...notificationConfig, email_mensagens: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações WhatsApp</Label>
                    <p className="text-sm text-gray-600">
                      Receber notificações via WhatsApp
                    </p>
                  </div>
                  <Switch
                    checked={notificationConfig.notificacao_whatsapp}
                    onCheckedChange={(checked) => setNotificationConfig({...notificationConfig, notificacao_whatsapp: checked})}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="webhook_url">URL do Webhook</Label>
                <Input
                  id="webhook_url"
                  value={notificationConfig.webhook_url}
                  onChange={(e) => setNotificationConfig({...notificationConfig, webhook_url: e.target.value})}
                  placeholder="https://seu-sistema.com/webhook"
                />
                <p className="text-sm text-gray-600">
                  URL para receber notificações via webhook
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Integrações */}
        <TabsContent value="integracoes">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Integrações
                </CardTitle>
                <CardDescription>
                  Configure integrações com serviços externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openai_key">Chave da API OpenAI</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="openai_key"
                      type={showApiKey ? "text" : "password"}
                      value={integrationConfig.openai_api_key}
                      onChange={(e) => setIntegrationConfig({...integrationConfig, openai_api_key: e.target.value})}
                      placeholder="sk-..."
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wppconnect_session">Sessão WPPConnect</Label>
                  <Input
                    id="wppconnect_session"
                    value={integrationConfig.wppconnect_session}
                    onChange={(e) => setIntegrationConfig({...integrationConfig, wppconnect_session: e.target.value})}
                    placeholder="simao_session"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe_webhook">Stripe Webhook Secret</Label>
                  <Input
                    id="stripe_webhook"
                    type="password"
                    value={integrationConfig.stripe_webhook_secret}
                    onChange={(e) => setIntegrationConfig({...integrationConfig, stripe_webhook_secret: e.target.value})}
                    placeholder="whsec_..."
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="mr-2 h-5 w-5" />
                  Status das Integrações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>OpenAI GPT-4</span>
                    <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>WPPConnect</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Configurando</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stripe</span>
                    <Badge className="bg-red-100 text-red-800">Desconectado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;

