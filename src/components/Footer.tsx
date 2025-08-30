import React from 'react';
import { FaGithub, FaMedium } from 'react-icons/fa';
import { SiIeee } from 'react-icons/si';

const Footer = () => {
  return (
    <footer className="glass-card border-t border-white/10 mt-8">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-300 space-y-4 sm:space-y-0">
        <a href="/" className="inline-flex items-center justify-center px-2 py-1 rounded-md hover:bg-white/5 transition-all">
          © {new Date().getFullYear()} Oper8a. All rights reserved.
        </a>
        <div className="flex space-x-4">
          <a href="/privacy" className="inline-flex items-center justify-center px-2 py-1 rounded-md hover:bg-white/5 transition-all">
            Privacy Policy
          </a>
          <a href="/terms" className="inline-flex items-center justify-center px-2 py-1 rounded-md hover:bg-white/5 transition-all">
            Terms of Service
          </a>
          <a href="/contact" className="inline-flex items-center justify-center px-2 py-1 rounded-md hover:bg-white/5 transition-all">
            Contact
          </a>
        </div>
        <div className="flex space-x-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]"
          >
            <FaGithub size={20} />
          </a>
          <a
            href="https://ieee.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="IEEE"
            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]"
          >
            <SiIeee size={20} />
          </a>
          <a
            href="https://medium.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Medium"
            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]"
          >
            <FaMedium size={20} />
          </a>
        </div>
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div className="glass-card px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg border border-white/10 transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:bg-white/5">
          <span className="text-gray-300 text-sm">harnessed by</span>
          <a 
            href="https://www.syn8x.tech" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors drop-shadow-[0_0_6px_rgba(0,255,255,0.6)] font-semibold"
          >
            syn8x
          </a>
        </div>
        <div className="glass-card px-4 py-2 rounded-lg flex items-center space-x-4 shadow-lg border border-white/10 transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] hover:bg-white/5">
          <span className="text-gray-300 text-sm">Fueled by</span>
          <a 
            href="https://superteam.fun/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center"
          >
            <img 
              src="./src/assets/superteam-india-new.jpg" 
              alt="Superteam India" 
              className="h-6 w-auto hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" 
            />
          </a>
          <a 
            href="https://solana.org/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center"
          >
            <img 
              src="./src/assets/logo.png" 
              alt="Solana Foundation" 
              className="h-6 w-auto hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(0,255,180,0.6)]" 
            />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
