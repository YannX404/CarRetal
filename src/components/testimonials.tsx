import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sophie K.",
    role: "Cliente satisfaite",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    content: "Service exceptionnel ! La voiture était impeccable et la livraison à l'heure. Je recommande vivement WilkaDeals.",
    rating: 5
  },
  {
    name: "Marc D.",
    role: "Client régulier",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
    content: "Cela fait plusieurs fois que je fais appel à leurs services. Des véhicules de qualité et une équipe professionnelle.",
    rating: 5
  },
  {
    name: "Anne M.",
    role: "Cliente",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop",
    content: "Prix compétitifs et service client au top. La livraison à domicile est vraiment pratique.",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Ce que disent nos clients</h2>
          <p className="mt-4 text-lg text-gray-600">Découvrez les avis de nos clients satisfaits</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary-500 text-primary-500" />
                ))}
              </div>
              <p className="mt-4 text-gray-600">{testimonial.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}