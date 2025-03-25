import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, Upload, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: {
    id: string;
    user_id: string;
    total_price: number;
    deposit_amount: number;
    user: {
      full_name: string;
      email: string;
    };
  };
  onSuccess?: () => void;
}

export function ReceiptModal({ isOpen, onClose, reservation, onSuccess }: ReceiptModalProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Le fichier est trop volumineux (max 5MB)');
        return;
      }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Format de fichier non supporté (PDF, JPEG, PNG uniquement)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `receipt_${reservation.id}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update reservation with receipt URL
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          receipt_url: publicUrl,
          deposit_status: 'received'
        })
        .eq('id', reservation.id);

      if (updateError) throw updateError;

      // Create notification for user
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: reservation.user_id,
          title: 'Reçu de paiement disponible',
          message: 'Le reçu de votre paiement est maintenant disponible dans votre espace client.',
          type: 'receipt'
        });

      if (notifError) throw notifError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          reservation_id: reservation.id,
          amount: reservation.deposit_amount,
          receipt_url: publicUrl
        });

      if (paymentError) throw paymentError;

      toast.success('Reçu envoyé avec succès');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error('Erreur lors de l\'envoi du reçu');
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium text-gray-900"
                  >
                    Envoyer un reçu
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-2">Détails de la réservation</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p>Client: {reservation.user.full_name}</p>
                    <p>Email: {reservation.user.email}</p>
                    <p>Montant total: {reservation.total_price.toLocaleString()} FCFA</p>
                    <p>Avance payée: {reservation.deposit_amount.toLocaleString()} FCFA</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reçu de paiement
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="receipt"
                            className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                          >
                            <span>Télécharger un fichier</span>
                            <input
                              id="receipt"
                              name="receipt"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileSelect}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, PNG, JPG jusqu'à 5MB
                        </p>
                        {selectedFile && (
                          <p className="text-sm text-primary-600">
                            {selectedFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900"
                    >
                      Annuler
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          Envoyer
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}