import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Phone, Mail, Lock, User, Upload, Download, CheckCircle, XCircle, Clock, Calendar, MapPin, Car } from 'lucide-react';
import { useAuth } from '../contexts/auth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const REQUIRED_DOCUMENTS = [
  { type: 'cni', label: "Carte Nationale d'Identité" },
  { type: 'permis', label: 'Permis de Conduire' },
  { type: 'facture', label: 'Facture de Domiciliation' }
];

interface Document {
  id: string;
  type: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: string;
  status: string;
}

interface Reservation {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  deposit_amount: number;
  deposit_status: string;
  receipt_url: string | null;
  vehicle: {
    name: string;
    model: string;
    image_url: string;
  };
  delivery_location: {
    name: string;
    price: number;
  } | null;
  with_driver: boolean;
  driver_fee: number;
}

export function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'reservations'>('profile');

  useEffect(() => {
    if (user) {
      loadProfile();
      loadDocuments();
      loadReservations();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erreur lors du chargement du profil');
    }
  };

  const loadDocuments = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Erreur lors du chargement des documents');
    }
  };

  const loadReservations = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          vehicle:vehicles(name, model, image_url),
          delivery_location:delivery_locations(name, price)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
      toast.error('Erreur lors du chargement des réservations');
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    try {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast.error('Type de fichier non supporté');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error('Le fichier est trop volumineux (max 5MB)');
        return;
      }

      setUploading(type);

      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Supprimer l'ancien fichier s'il existe
      const existingDoc = documents.find(d => d.type === type);
      if (existingDoc) {
        const oldFilePath = existingDoc.file_url.split('/').pop();
        if (oldFilePath) {
          await supabase.storage
            .from('documents')
            .remove([`${user?.id}/${oldFilePath}`]);
        }
      }

      // Upload du nouveau fichier
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Créer une URL publique temporaire
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Mettre à jour ou créer l'entrée dans la base de données
      const { error: dbError } = await supabase
        .from('documents')
        .upsert({
          user_id: user?.id,
          type,
          file_url: publicUrl,
          status: 'pending'
        }, {
          onConflict: 'user_id,type'
        });

      if (dbError) throw dbError;

      // Vérifier si tous les documents sont soumis
      const updatedDocuments = [...documents];
      const existingIndex = updatedDocuments.findIndex(d => d.type === type);
      if (existingIndex !== -1) {
        updatedDocuments[existingIndex] = {
          ...updatedDocuments[existingIndex],
          file_url: publicUrl,
          status: 'pending'
        };
      } else {
        updatedDocuments.push({
          id: '',
          type,
          file_url: publicUrl,
          status: 'pending'
        });
      }

      // Mettre à jour le statut de l'utilisateur si tous les documents sont soumis
      const allDocumentsSubmitted = REQUIRED_DOCUMENTS.every(doc =>
        updatedDocuments.some(d => d.type === doc.type)
      );

      if (allDocumentsSubmitted && profile?.status === 'pending') {
        const { error: userError } = await supabase
          .from('users')
          .update({ status: 'submitted' })
          .eq('id', user?.id);

        if (userError) throw userError;
        
        // Mettre à jour le profil localement
        setProfile(prev => prev ? { ...prev, status: 'submitted' } : null);
        
        toast.success('Tous les documents ont été soumis avec succès !');
      } else {
        toast.success('Document téléchargé avec succès');
      }

      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(null);
    }
  };

  const handleDownload = async (fileUrl: string) => {
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
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen pt-24 pb-32 bg-gray-50"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Connexion requise
            </h2>
            <p className="text-gray-600 mb-8">
              Veuillez vous connecter pour accéder à votre compte et gérer vos documents
            </p>
            <button
              onClick={() => navigate('/?login=true')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-24 pb-32 bg-gray-50"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mon Profil
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'documents'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mes Documents
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'reservations'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mes Réservations
          </button>
        </div>

        {/* Profile Section */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Mon Profil</h2>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.status === 'approved' ? 'bg-green-100 text-green-800' :
                  profile?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {getStatusIcon(profile?.status || 'pending')}
                  <span className="ml-2">
                    {profile?.status === 'approved' ? 'Approuvé' :
                     profile?.status === 'rejected' ? 'Rejeté' :
                     profile?.status === 'submitted' ? 'En attente' : 'En cours'}
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{profile?.full_name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{profile?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{profile?.phone_number}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-lg">
                  <Lock className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="capitalize">{profile?.role}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Section */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Mes Documents</h2>
            
            <div className="space-y-6">
              {REQUIRED_DOCUMENTS.map((doc) => {
                const uploadedDoc = documents.find(d => d.type === doc.type);
                return (
                  <div key={doc.type} className="border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">{doc.label}</h3>
                      {uploadedDoc && (
                        <div className="flex items-center">
                          {getStatusIcon(uploadedDoc.status)}
                          <span className={`ml-2 text-sm font-medium ${getStatusColor(uploadedDoc.status)}`}>
                            {uploadedDoc.status === 'approved' ? 'Approuvé' :
                             uploadedDoc.status === 'rejected' ? 'Rejeté' : 'En attente'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex-1">
                        <input
                          type="file"
                          className="hidden"
                          accept={ACCEPTED_FILE_TYPES.join(',')}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(doc.type, file);
                          }}
                        />
                        <div className={`flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          uploading === doc.type
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                        }`}>
                          <Upload className={`w-5 h-5 mr-2 ${
                            uploading === doc.type ? 'text-primary-600' : 'text-gray-400'
                          }`} />
                          <span className={uploading === doc.type ? 'text-primary-600' : 'text-gray-600'}>
                            {uploading === doc.type ? 'Téléchargement...' : 'Télécharger'}
                          </span>
                        </div>
                      </label>

                      {uploadedDoc && (
                        <button
                          onClick={() => handleDownload(uploadedDoc.file_url)}
                          className="flex items-center px-4 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Download className="w-5 h-5 mr-2 text-gray-600" />
                          <span>Télécharger</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reservations Section */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            {/* Payment Instructions */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Instructions de paiement</h2>
              <div className="prose max-w-none">
                <p className="text-gray-600">Pour effectuer le paiement de votre réservation :</p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-gray-600">
                    <span className="w-32 font-medium">Orange Money :</span>
                    <span>+225 07 59 69 04 34</span>
                  </li>
                  <li className="flex items-center text-gray-600">
                    <span className="w-32 font-medium">Wave CI :</span>
                    <span>+225 85 82 75 93</span>
                  </li>
                </ul>
                <p className="mt-4 text-gray-600">
                  Après le paiement, envoyez la capture d'écran sur WhatsApp au +225 85 82 75 93
                </p>
              </div>
            </div>

            {/* Reservations List */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Mes Réservations</h2>
              
              <div className="space-y-6">
                {reservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-600">Aucune réservation pour le moment</p>
                  </div>
                ) : (
                  reservations.map((reservation) => (
                    <div key={reservation.id} className="border rounded-xl p-6">
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
                          <p className="text-gray-600 mb-4">
                            {reservation.vehicle.model}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-5 h-5 mr-2" />
                              <span>
                                Du {formatDate(reservation.start_date)} au {formatDate(reservation.end_date)}
                              </span>
                            </div>
                            {reservation.delivery_location && (
                              <div className="flex items-center text-gray-600">
                                <MapPin className="w-5 h-5 mr-2" />
                                <span>Livraison à {reservation.delivery_location.name}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Prix total</p>
                              <p className="text-lg font-semibold">
                                {reservation.total_price.toLocaleString()} FCFA
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Avance requise</p>
                              <p className="text-lg font-semibold text-primary-600">
                                {reservation.deposit_amount.toLocaleString()} FCFA
                              </p>
                            </div>
                          </div>
                          {reservation.with_driver && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Avec chauffeur</span>
                              {' - '}
                              {reservation.driver_fee.toLocaleString()} FCFA
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}