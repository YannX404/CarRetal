import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, Mail, Lock, User, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/auth';
import { signUpSchema, signInSchema } from '../lib/validators';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
  });
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const validatedData = signInSchema.parse(formData);
        await signIn(validatedData.email, validatedData.password);
        onClose();
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Les mots de passe ne correspondent pas');
          return;
        }
        
        try {
          const validatedData = signUpSchema.parse(formData);
          await signUp(
            validatedData.email,
            validatedData.password,
            validatedData.fullName,
            validatedData.phoneNumber
          );
          setIsLogin(true);
        } catch (error) {
          if (error instanceof Error) {
            // Simplifier le message d'erreur pour les mots de passe
            if (error.message.includes('password')) {
              toast.error('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre');
              return;
            }
            toast.error(error.message);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900"
                  >
                    {isLogin ? 'Connexion' : 'Inscription'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="text-center mb-8">
                  <img
                    src="/images/logo.png"
                    alt="WilkaDeals"
                    className="h-16 w-auto mx-auto"
                  />
                  <p className="mt-4 text-gray-600 text-lg">
                    {isLogin 
                      ? "Connectez-vous pour accéder à votre compte" 
                      : "Créez votre compte pour commencer l'aventure"}
                  </p>
                </div>

                <motion.form
                  key={isLogin ? 'login' : 'register'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                  onSubmit={handleSubmit}
                >
                  {!isLogin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                          Nom complet
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="fullName"
                            id="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="pl-10 w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 transition-shadow duration-200 shadow-sm hover:shadow-md"
                            placeholder="John Doe"
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            name="phoneNumber"
                            id="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="pl-10 w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 transition-shadow duration-200 shadow-sm hover:shadow-md"
                            placeholder="+225 07 07 07 07 07"
                          />
                        </div>
                      </motion.div>
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 transition-shadow duration-200 shadow-sm hover:shadow-md"
                        placeholder="john@example.com"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 transition-shadow duration-200 shadow-sm hover:shadow-md"
                        placeholder="••••••••"
                      />
                    </div>
                    {!isLogin && (
                      <p className="mt-2 text-sm text-gray-500">
                        Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre
                      </p>
                    )}
                  </motion.div>

                  {!isLogin && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="pl-10 w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 transition-shadow duration-200 shadow-sm hover:shadow-md"
                          placeholder="••••••••"
                        />
                      </div>
                    </motion.div>
                  )}

                  {isLogin && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                          Se souvenir de moi
                        </label>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl font-medium"
                  >
                    {isLogin ? 'Se connecter' : "S'inscrire"}
                  </motion.button>

                  <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                      {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                      {" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="font-medium text-primary-600 hover:text-primary-500"
                      >
                        {isLogin ? "S'inscrire" : "Se connecter"}
                      </button>
                    </p>
                  </div>
                </motion.form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}