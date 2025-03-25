import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Car, Image, MapPin, Receipt, AlertCircle, CheckCircle, 
  XCircle, Upload, Download, Plus, Trash, Edit, Save, FileText,
  Eye, EyeOff, Calendar, Phone, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ReceiptModal } from '../components/receipt-modal';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  status: string;
  created_at: string;
  documents: Document[];
}

interface Document {
  id: string;
  type: string;
  file_url: string;
  status: string;
}

interface Vehicle {
  id: string;
  name: string;
  model: string;
  price_per_day: number;
  image_url: string;
  available: boolean;
  is_popular: boolean;
}

interface DeliveryLocation {
  id: string;
  name: string;
  price: number;
}

interface Reservation {
  id: string;
  user_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  deposit_amount: number;
  deposit_status: string;
  receipt_url: string | null;
  with_driver: boolean;
  driver_fee: number;
  created_at: string;
  user: {
    full_name: string;
    email: string;
    phone_number: string;
  };
  vehicle: {
    name: string;
    model: string;
    image_url: string;
  };
  delivery_location: {
    name: string;
    price: number;
  } | null;
}

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'vehicles' | 'locations' | 'reservations'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [showPending, setShowPending] = useState(true);

  useEffect(() => {
    checkAdmin();
    loadData();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;
      if (userData.role !== 'admin') {
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load users with documents
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_users_with_documents');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('name');

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // Load locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('delivery_locations')
        .select('*')
        .order('name');

      if (locationsError) throw locationsError;
      setLocations(locationsData || []);

      // Load reservations
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select(`
          *,
          user:users(full_name, email, phone_number),
          vehicle:vehicles(name, model, image_url),
          delivery_location:delivery_locations(name, price)
        `)
        .order('created_at', { ascending: false });

      if (reservationsError) throw reservationsError;
      setReservations(reservationsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatus = async (userId: string, status: string) => {
    try {
      if (status === 'approved') {
        await supabase.rpc('admin_approve_user', { user_id_param: userId });
      } else if (status === 'rejected') {
        await supabase.rpc('admin_reject_user', { user_id_param: userId });
      }

      toast.success(`Statut mis à jour : ${status}`);
      await loadData();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDocumentDownload = async (fileUrl: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileUrl.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erreur lors du téléchargement du fichier');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const filteredUsers = showPending
    ? users.filter(user => user.status === 'submitted')
    : users;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-24 pb-32"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex space-x-4 mb-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-5 h-5 inline-block mr-2" />
                Utilisateurs
              </button>
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'vehicles'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Car className="w-5 h-5 inline-block mr-2" />
                Véhicules
              </button>
              <button
                onClick={() => setActiveTab('locations')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'locations'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MapPin className="w-5 h-5 inline-block mr-2" />
                Lieux de livraison
              </button>
              <button
                onClick={() => setActiveTab('reservations')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'reservations'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Receipt className="w-5 h-5 inline-block mr-2" />
                Réservations
              </button>
            </div>

            {/* Users Section */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
                  <button
                    onClick={() => setShowPending(!showPending)}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {showPending ? (
                      <>
                        <Eye className="w-5 h-5" />
                        <span>Voir tous</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-5 h-5" />
                        <span>Voir en attente</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-semibold">{user.full_name}</h3>
                          <div className="mt-2 space-y-1 text-gray-600">
                            <p className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {user.email}
                            </p>
                            <p className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {user.phone_number}
                            </p>
                            <p className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Inscrit le {formatDate(user.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {user.status === 'submitted' ? (
                            <>
                              <button
                                onClick={() => handleUserStatus(user.id, 'approved')}
                                className="mr-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approuver
                              </button>
                              <button
                                onClick={() => handleUserStatus(user.id, 'rejected')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Rejeter
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              {user.status === 'approved' ? (
                                <button
                                  onClick={() => handleUserStatus(user.id, 'rejected')}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Rejeter
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserStatus(user.id, 'approved')}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approuver
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['cni', 'permis', 'facture'].map((type) => {
                          const doc = user.documents.find(d => d.type === type);
                          return (
                            <div key={type} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">
                                  {type === 'cni' ? "CNI" :
                                   type === 'permis' ? "Permis" : "Facture"}
                                </h4>
                                {doc && (
                                  <span className={`flex items-center ${getStatusColor(doc.status)}`}>
                                    {getStatusIcon(doc.status)}
                                  </span>
                                )}
                              </div>
                              {doc ? (
                                <button
                                  onClick={() => handleDocumentDownload(doc.file_url)}
                                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Télécharger
                                </button>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  Document non soumis
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reservations Section */}
            {activeTab === 'reservations' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Gestion des réservations</h2>
                
                <div className="grid grid-cols-1 gap-6">
                  {reservations.map((reservation) => (
                    <div key={reservation.id} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-start gap-6">
                        <img
                          src={reservation.vehicle.image_url}
                          alt={reservation.vehicle.name}
                          className="w-32 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold">
                              {reservation.vehicle.name}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              reservation.deposit_status === 'received'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {reservation.deposit_status === 'received'
                                ? 'Payé'
                                : 'En attente de paiement'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1 text-gray-600">
                              <p className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                {reservation.user.full_name}
                              </p>
                              <p className="flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                {reservation.user.email}
                              </p>
                              <p className="flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                {reservation.user.phone_number}
                              </p>
                            </div>
                            <div className="space-y-1 text-gray-600">
                              <p className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Du {formatDate(reservation.start_date)} au {formatDate(reservation.end_date)}
                              </p>
                              {reservation.delivery_location && (
                                <p className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  Livraison à {reservation.delivery_location.name}
                                </p>
                              )}
                              {reservation.with_driver && (
                                <p className="flex items-center">
                                  <User className="w-4 h-4 mr-2" />
                                  Avec chauffeur (+{reservation.driver_fee.toLocaleString()} FCFA)
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="space-x-8">
                              <span className="text-gray-600">
                                Total : <span className="font-semibold">{reservation.total_price.toLocaleString()} FCFA</span>
                              </span>
                              <span className="text-primary-600">
                                Avance : <span className="font-semibold">{reservation.deposit_amount.toLocaleString()} FCFA</span>
                              </span>
                            </div>
                            {reservation.deposit_status === 'pending' ? (
                              <button
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setIsReceiptModalOpen(true);
                                }}
                                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Ajouter reçu
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDocumentDownload(reservation.receipt_url!)}
                                className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Voir reçu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedReservation && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedReservation(null);
          }}
          reservation={selectedReservation}
          onSuccess={loadData}
        />
      )}
    </motion.div>
  );
}