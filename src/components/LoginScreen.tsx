import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  AlertCircle, 
  Loader2, 
  LogIn,
  Shield
} from 'lucide-react';
import { TechnicianUser } from '../types/auth';
import { loginWithCredentialsService } from '../services/authService';

interface LoginScreenProps {
  onSuccess: (tech: TechnicianUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Por favor, informe seu usuário.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha.');
      return;
    }

    setIsLoading(true);
    try {
      const tech = await loginWithCredentialsService(username, password);
      onSuccess(tech);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Usuário ou senha incorretos.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 via-[#1a0003] to-zinc-950 flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-red-600 selection:text-white">
      {/* Luz ambiente suave de fundo em vermelho degradê */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[450px] bg-red-600/12 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-red-800/10 rounded-full blur-[110px]"></div>
      </div>

      {/* Container Principal */}
      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho da Empresa Amilco Home Center */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-xl shadow-red-950/80 border border-red-500/40 mb-3">
            <Smartphone className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              AMILCO HOME CENTER
            </h1>
            <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded tracking-wide uppercase shadow-xs">
              PATRIMÔNIO
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Controle de Celulares e Termos de Responsabilidade
          </p>
        </div>

        {/* Card Profissional Dark com Borda Degradê Vermelho */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden relative border-t-2 border-t-red-600">
          
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span>Acesso do Técnico</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Digite seu usuário e senha para entrar no sistema
              </p>
            </div>

            {/* Alerta de Erro */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-red-950/80 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
            )}

            {/* FORMULÁRIO COM APENAS OS 2 CAMPOS: LOGIN E SENHA */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo 1: Usuário */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Usuário
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário (ex: Amilcoti)"
                    required
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="w-full pl-10 pr-4 py-3 text-xs bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-medium transition-all"
                  />
                </div>
              </div>

              {/* Campo 2: Senha */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="w-full pl-10 pr-10 py-3 text-xs bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-zinc-400 hover:text-white transition-colors cursor-pointer p-0.5"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botão de Entrar */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Rodapé discreto somente com a marca Amilco */}
          <div className="px-6 py-3 bg-zinc-950/80 border-t border-zinc-800/80 text-center">
            <span className="text-zinc-500 text-[11px] font-medium">
              Amilco Home Center · Segurança de Acesso T.I.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
