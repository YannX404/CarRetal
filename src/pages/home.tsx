import { HeroSlider } from '../components/hero-slider';
import { Testimonials } from '../components/testimonials';
import { motion } from 'framer-motion';
import { ArrowUp, Car, Shield, Clock, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface PopularVehicle {
  id: string;
  name: string;
  model: string;
  price_per_day: number;
  image_url: string;
  is_popular: boolean;
}

export function HomePage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [popularVehicles, setPopularVehicles] = useState<PopularVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadPopularVehicles();
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadPopularVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_popular', true)
        .order('name');

      if (error) throw error;
      setPopularVehicles(data || []);
    } catch (error) {
      console.error('Error loading popular vehicles:', error);
      toast.error('Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const features = [
    {
      icon: Car,
      title: "Véhicules Premium",
      description: "Une flotte de véhicules haut de gamme régulièrement renouvelée"
    },
    {
      icon: Shield,
      title: "Assurance Complete",
      description: "Tous nos véhicules sont entièrement assurés pour votre tranquillité"
    },
    {
      icon: Clock,
      title: "Service 24/7",
      description: "Une équipe disponible à tout moment pour vous accompagner"
    },
    {
      icon: MapPin,
      title: "Livraison Partout",
      description: "Livraison et récupération à l'endroit de votre choix"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <HeroSlider />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Pourquoi choisir WilkaDeals ?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Une expérience de location premium adaptée à vos besoins
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="inline-flex p-3 bg-primary-100 rounded-lg text-primary-600 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Vehicles Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Nos véhicules populaires
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Découvrez notre sélection de véhicules haut de gamme
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des véhicules...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {popularVehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  onClick={() => navigate(`/vehicles?id=${vehicle.id}`)}
                  className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <img
                      src={vehicle.image_url}
                      alt={vehicle.name}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-900">
                      {vehicle.model}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {vehicle.name}
                    </h3>
                    <p className="text-primary-600 font-medium">
                      À partir de {vehicle.price_per_day.toLocaleString()} FCFA/jour
                    </p>
                    <button className="mt-4 w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                      Réserver maintenant
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Testimonials />

      {/* Back to Top Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollTop ? 1 : 0 }}
        onClick={scrollToTop}
        className="fixed bottom-32 right-8 z-30 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
      >
        <ArrowUp className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
}