import { motion } from 'framer-motion';
import { Shield, Clock, MapPin, Heart, Users, Award, ChevronRight, Car, Star } from 'lucide-react';

export function AboutPage() {
  const stats = [
    { label: "Véhicules", value: "50+" },
    { label: "Clients satisfaits", value: "1000+" },
    { label: "Années d'expérience", value: "5+" },
    { label: "Villes desservies", value: "10+" }
  ];

  const values = [
    {
      icon: Shield,
      title: "Qualité",
      description: "Nous maintenons les plus hauts standards de qualité pour notre flotte"
    },
    {
      icon: Clock,
      title: "Ponctualité",
      description: "Nous respectons scrupuleusement les horaires de livraison"
    },
    {
      icon: MapPin,
      title: "Proximité",
      description: "Nous sommes présents dans toutes les grandes villes"
    },
    {
      icon: Heart,
      title: "Passion",
      description: "Notre passion pour l'automobile guide chacune de nos actions"
    },
    {
      icon: Users,
      title: "Service client",
      description: "Une équipe dédiée à votre satisfaction 24/7"
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Reconnus pour notre service d'exception"
    }
  ];

  const timeline = [
    {
      year: "2019",
      title: "Création de WilkaDeals",
      description: "Lancement avec une flotte de 10 véhicules premium"
    },
    {
      year: "2020",
      title: "Expansion régionale",
      description: "Ouverture dans 5 nouvelles villes"
    },
    {
      year: "2021",
      title: "Innovation digitale",
      description: "Lancement de notre plateforme de réservation en ligne"
    },
    {
      year: "2022",
      title: "Certification qualité",
      description: "Obtention de la certification ISO 9001"
    },
    {
      year: "2023",
      title: "Leader du marché",
      description: "Plus grand parc automobile premium de Côte d'Ivoire"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pt-24 pb-32"
    >
      {/* Hero Section */}
      <div className="relative h-[60vh] mb-16">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury car"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        </div>
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="text-white max-w-2xl">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl font-bold mb-6 leading-tight"
            >
              Redéfinir l'expérience de location automobile
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-gray-200 mb-8"
            >
              Leader de la location de véhicules premium en Côte d'Ivoire
            </motion.p>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Découvrir notre flotte
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Story Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold mb-6">Notre Histoire</h2>
            <div className="prose max-w-none text-gray-600 space-y-4">
              <p className="text-lg">
                Fondée en 2019, WilkaDeals est née de la passion pour l'automobile et
                de la volonté d'offrir un service de location haut de gamme en Côte d'Ivoire.
              </p>
              <p className="text-lg">
                Notre mission est simple : rendre accessible l'expérience des véhicules
                premium tout en garantissant un service irréprochable.
              </p>
              <p className="text-lg">
                Aujourd'hui, nous sommes fiers d'être le leader de la location de
                véhicules de luxe dans le pays, avec une présence dans plus de 10 villes.
              </p>
            </div>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary-600 text-white px-6 py-3 rounded-full hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Car className="w-5 h-5" />
                Notre flotte
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-primary-600 px-6 py-3 rounded-full hover:bg-primary-50 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Star className="w-5 h-5" />
                Nos services
              </motion.button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-w-16 aspect-h-9">
              <img
                src="https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=2000&auto=format&fit=crop"
                alt="Our story"
                className="rounded-2xl object-cover shadow-2xl"
              />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl p-6 shadow-xl">
              <div className="text-4xl font-bold text-primary-600 mb-2">5+</div>
              <div className="text-gray-600">Années d'excellence</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <h2 className="text-4xl font-bold mb-12 text-center">Notre Parcours</h2>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-primary-100" />
          {timeline.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'} mb-8`}
            >
              <div className={`w-1/2 ${index % 2 === 0 ? 'pr-12' : 'pl-12'}`}>
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-primary-600 font-bold text-xl mb-2">{item.year}</div>
                  <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary-600 rounded-full" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Nos Valeurs</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Ces valeurs guident chacune de nos actions et nous permettent de
            maintenir l'excellence de notre service
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="inline-flex p-4 bg-primary-100 rounded-2xl text-primary-600 mb-6">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold mb-4">{value.title}</h3>
                <p className="text-gray-600 text-lg">{value.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}