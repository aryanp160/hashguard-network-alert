import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Network, CheckCircle, Lock, Zap } from 'lucide-react';
import { SiSolana } from 'react-icons/si';

const FeatureGrid = () => {
  const features = [
    {
      icon: Shield,
      title: "Advanced Security",
      description: "Military-grade encryption with blockchain verification for ultimate data protection",
      gradient: "from-cyan-500 to-blue-600"
    },
    {
      icon: Network,
      title: "Trusted Networks",
      description: "Build and manage your network of trusted peers for secure file verification",
      gradient: "from-purple-500 to-pink-600"
    },
    {
      icon: CheckCircle,
      title: "Real-time Alerts",
      description: "Instant notifications when file duplications are detected across your network",
      gradient: "from-green-500 to-teal-600"
    },
    {
      icon: Lock,
      title: "Data Integrity",
      description: "Cryptographic hashing ensures your files remain unchanged and authentic",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Powered by Solana's high-speed blockchain for instant verification",
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      icon: () => <SiSolana className="w-8 h-8 text-white" />,
      title: "Decentralized",
      description: "No single point of failure with distributed verification across the network",
      gradient: "from-indigo-500 to-purple-600"
    }
  ];

  return (
    <div className="relative">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Why Choose Oper8a?
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Experience next-generation file management with blockchain-powered security
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto bg-black/5 backdrop-blur-sm rounded-xl p-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="glass-card hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group"
            >
              <CardHeader className="text-center pb-4">
                <div className="relative inline-block mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-[0_0_12px_rgba(0,246,255,0.15)]`}>
                    {typeof feature.icon === "function" ? (
                      <feature.icon />
                    ) : (
                      <feature.icon className="w-8 h-8 text-white" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-200 text-center leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureGrid;
