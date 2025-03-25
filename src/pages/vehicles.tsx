import { motion } from 'framer-motion';
import { Filter, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ReservationModal } from '../components/reservation-modal';
import toast from 'react-hot-toast';

interface Vehicle {
  id: string;
  name: string;
  model: string;
  price_per_day: number;
  image_url: string;
  available: boolean;
}

export function VehiclesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('available', true)
        .order('name');

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error('Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  const handleReservationClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsReservationOpen(true);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const priceMatch = selectedPrice === 'all' || 
      (selectedPrice === 'low' && vehicle.price_per_day <= 150000) ||
      (selectedPrice === 'medium' && vehicle.price_per_day <= 200000) ||
      (selectedPrice === 'high' && vehicle.price_per_day > 200000);
    return priceMatch;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 pt-24 pb-32"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold">Nos Véhicules</h1>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="mt-4 md:mt-0 flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors md:hidden"
        >
          <Filter className="w-5 h-5" />
          Filtrer
          <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters - Desktop */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block space-y-6"
        >
          <div>
            <h3 className="font-medium mb-3">Prix</h3>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'Tous les prix' },
                { value: 'low', label: '≤ 150,000 FCFA' },
                { value: 'medium', label: '≤ 200,000 FCFA' },
                { value: 'high', label: '> 200,000 FCFA' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedPrice(option.value)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedPrice === option.value
                      ? 'bg-primary-100 text-primary-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Filters - Mobile */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ 
            height: isFilterOpen ? 'auto' : 0,
            opacity: isFilterOpen ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="lg:hidden overflow-hidden"
        >
          <div className="space-y-6 pb-6">
            <div>
              <h3 className="font-medium mb-3">Prix</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Tous' },
                  { value: 'low', label: '≤ 150k' },
                  { value: 'medium', label: '≤ 200k' },
                  { value: 'high', label: '> 200k' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedPrice(option.value)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      selectedPrice === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vehicle Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des véhicules...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Aucun véhicule disponible pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
                >
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <img
                      src={vehicle.image_url}
                      alt={vehicle.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {vehicle.name}
                    </h3>
                    <p className="text-gray-600 mb-2">{vehicle.model}</p>
                    <p className="text-primary-600 font-medium mb-4">
                      {vehicle.price_per_day.toLocaleString()} FCFA/jour
                    </p>
                    <button
                      onClick={() => handleReservationClick(vehicle)}
                      className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Réserver maintenant
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedVehicle && (
        <ReservationModal
          isOpen={isReservationOpen}
          onClose={() => {
            setIsReservationOpen(false);
            setSelectedVehicle(null);
          }}
          vehicle={selectedVehicle}
        />
      )}
    </motion.div>
  );
}