import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, Calendar, MapPin, CreditCard, AlertCircle, Car, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/auth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    name: string;
    price_per_day: number;
    image_url: string;
  };
}

interface DeliveryLocation {
  id: string;
  name: string;
  price: number;
}

interface Promotion {
  duration_weeks: number;
  discount: number;
}

export function ReservationModal({ isOpen, onClose, vehicle }: ReservationModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selfPickup, setSelfPickup] = useState(false);
  const [withDriver, setWithDriver] = useState(false);
  const DRIVER_FEE = 10000; // 10,000 FCFA fixed fee for driver

  useEffect(() => {
    loadLocations();
    loadPromotions();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      calculatePrice();
    }
  }, [startDate, endDate, selectedLocation, selfPickup, withDriver]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_locations')
        .select('*')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Erreur lors du chargement des lieux de livraison');
    }
  };

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('duration_weeks');

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const calculatePrice = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    
    let basePrice = days * vehicle.price_per_day;
    
    // Apply promotion if applicable
    let discount = 0;
    if (weeks >= 1) {
      const promotion = promotions.find(p => weeks >= p.duration_weeks);
      if (promotion) {
        discount = promotion.discount;
      }
    }

    // Add delivery fee if needed
    const deliveryPrice = !selfPickup && selectedLocation
      ? locations.find(l => l.id === selectedLocation)?.price || 0
      : 0;

    // Add driver fee if selected
    const driverPrice = withDriver ? DRIVER_FEE : 0;

    const total = basePrice + deliveryPrice + driverPrice - discount;
    setTotalPrice(total);
    setDepositAmount(Math.ceil(total * 0.5)); // 50% deposit
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Vous devez être connecté pour faire une réservation');
      onClose();
      navigate('/?login=true');
      return;
    }

    try {
      setLoading(true);

      // Check user status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('status')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      if (userData.status !== 'approved') {
        toast.error('Votre compte doit être approuvé pour faire une réservation');
        onClose();
        navigate('/account');
        return;
      }

      // Create reservation
      const { error: reservationError } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          vehicle_id: vehicle.id,
          start_date: startDate,
          end_date: endDate,
          delivery_location_id: selfPickup ? null : selectedLocation,
          total_price: totalPrice,
          deposit_amount: depositAmount,
          deposit_status: 'pending',
          with_driver: withDriver,
          driver_fee: withDriver ? DRIVER_FEE : 0
        });

      if (reservationError) throw reservationError;

      toast.success('Réservation créée avec succès');
      
      // Show payment instructions
      toast((t) => (
        <div className="p-4">
          <h3 className="font-bold mb-2">Instructions de paiement</h3>
          <p className="mb-2">Veuillez effectuer le paiement de l'avance de {depositAmount.toLocaleString()} FCFA via :</p>
          <ul className="list-disc pl-4 mb-2">
            <li>Orange Money : +225 07 59 69 04 34</li>
            <li>Wave CI : +225 85 82 75 93</li>
          </ul>
          <p className="text-sm">Envoyez la capture d'écran du paiement sur WhatsApp au +225 85 82 75 93</p>
        </div>
      ), {
        duration: 10000,
        style: {
          maxWidth: '500px',
        },
      });

      onClose();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  // Format the date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = formatDate(today);

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900"
                  >
                    Réserver {vehicle.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {!user ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-primary-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Connexion requise
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Vous devez être connecté pour faire une réservation
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/?login=true');
                      }}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Se connecter
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de début
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="date"
                            min={minDate}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="pl-10 w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date de fin
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="date"
                            min={startDate || minDate}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            className="pl-10 w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </motion.div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={withDriver}
                            onChange={(e) => setWithDriver(e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Avec chauffeur (+{DRIVER_FEE.toLocaleString()} FCFA)
                          </span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selfPickup}
                            onChange={(e) => {
                              setSelfPickup(e.target.checked);
                              if (e.target.checked) {
                                setSelectedLocation('');
                              }
                            }}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700 flex items-center">
                            <Car className="w-4 h-4 mr-2" />
                            Je viendrai chercher le véhicule moi-même
                          </span>
                        </label>
                      </div>

                      {!selfPickup && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lieu de livraison
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                              value={selectedLocation}
                              onChange={(e) => setSelectedLocation(e.target.value)}
                              required
                              className="pl-10 w-full px-4 py-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="">Sélectionner un lieu</option>
                              {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                  {location.name} (+{location.price.toLocaleString()} FCFA)
                                </option>
                              ))}
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {startDate && endDate && (selfPickup || selectedLocation) && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-lg mb-4">Récapitulatif</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Prix total</span>
                            <span className="font-medium">{totalPrice.toLocaleString()} FCFA</span>
                          </div>
                          {withDriver && (
                            <div className="flex justify-between text-gray-600">
                              <span>Dont chauffeur</span>
                              <span>{DRIVER_FEE.toLocaleString()} FCFA</span>
                            </div>
                          )}
                          <div className="flex justify-between text-primary-600">
                            <span>Avance requise (50%)</span>
                            <span className="font-medium">{depositAmount.toLocaleString()} FCFA</span>
                          </div>
                          <div className="pt-4 text-sm text-gray-500">
                            <div className="flex items-start gap-2">
                              <CreditCard className="h-5 w-5 flex-shrink-0 mt-1" />
                              <p>
                                L'avance doit être payée via Orange Money (+225 07 59 69 04 34) 
                                ou Wave CI (+225 85 82 75 93). Envoyez la capture d'écran 
                                du paiement sur WhatsApp au +225 85 82 75 93
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Création...' : 'Réserver'}
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}