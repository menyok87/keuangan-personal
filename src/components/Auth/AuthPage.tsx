import React, { useState } from 'react';
import { BarChart3, TrendingUp, Shield, Smartphone } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  const features = [
    {
      icon: BarChart3,
      title: 'Analisis Mendalam',
      description: 'Dapatkan insight keuangan dengan grafik dan laporan detail'
    },
    {
      icon: TrendingUp,
      title: 'Pelacakan Real-time',
      description: 'Monitor pengeluaran dan pemasukan secara real-time'
    },
    {
      icon: Shield,
      title: 'Keamanan Terjamin',
      description: 'Data keuangan Anda aman dengan enkripsi tingkat bank'
    },
    {
      icon: Smartphone,
      title: 'Akses Dimana Saja',
      description: 'Kelola keuangan dari perangkat apapun, kapan saja'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-white">
          <div className="mb-12">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                <BarChart3 className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Akuntansi Keuangan</h1>
                <p className="text-blue-100">Sistem manajemen keuangan personal</p>
              </div>
            </div>
            <p className="text-xl text-blue-100 leading-relaxed">
              Kelola keuangan pribadi Anda dengan mudah dan efisien. 
              Pantau pengeluaran, buat anggaran, dan capai target keuangan Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-white/20 rounded-xl p-3 flex-shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-blue-100 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md text-sm">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 w-16 h-16 mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Akuntansi Keuangan</h1>
            <p className="text-gray-600 dark:text-gray-300">Kelola keuangan pribadi dengan mudah</p>
          </div>

          {isLogin ? (
            <LoginForm
              onSuccess={onAuthSuccess}
              onSwitchToSignup={() => setIsLogin(false)}
            />
          ) : (
            <SignupForm
              onSuccess={onAuthSuccess}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
          
          {/* Help Text */}
          <div className="mt-6 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>💡 Tips:</strong> Jika mengalami masalah pendaftaran, coba gunakan email lain atau login dengan akun admin:
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Email: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">admin@akuntansi.com</code> | 
                Password: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">admin123</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;