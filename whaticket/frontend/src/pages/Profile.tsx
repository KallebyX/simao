import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdateProfile = async () => {
    try {
      await updateProfile(profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }
    
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Informações Pessoais" className="p-6">
          <div className="flex items-center space-x-6 mb-6">
            <Avatar name={user?.name} size="xl" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-sm text-sky-600 font-medium capitalize">{user?.profile}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Nome"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              leftIcon={<UserIcon />}
            />
            <Input
              label="E-mail"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
            />
            <Button onClick={handleUpdateProfile}>Salvar Alterações</Button>
          </div>
        </Card>

        <Card title="Alterar Senha" className="p-6">
          <div className="space-y-4">
            <Input
              label="Senha Atual"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              leftIcon={<LockClosedIcon />}
            />
            <Input
              label="Nova Senha"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              leftIcon={<LockClosedIcon />}
            />
            <Input
              label="Confirmar Nova Senha"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              leftIcon={<LockClosedIcon />}
            />
            <Button onClick={handleChangePassword}>Alterar Senha</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;