import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail, ArrowUpRight, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-t from-indigo-50/50 to-white py-12 border-t border-gray-100">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Brand section */}
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">#Project01</h2>
            <p className="text-gray-600 mb-6">Reimagining UX annotation with MLLMs.</p>
            <div className="flex space-x-4">
              <Link href="https://jesshew.com" className="text-gray-500 hover:text-indigo-600 transition">
                <Globe className="w-5 h-5" />
              </Link>
              <Link href="https://linkedin.com/in/jesshewyz" className="text-gray-500 hover:text-indigo-600 transition">
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>



          {/* Contact section */}
          <div className="col-span-1">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Contact</h3>
            <p className="text-gray-600 text-sm mb-4">Building something cool too? I would love to connect!</p>
            <Link 
              href="mailto:jess.hewyz@gmail.com" 
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              <Mail className="mr-2 w-4 h-4" /> jess.hewyz@gmail.com
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-gray-100"></div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} JessHew.
          </p>
          {/* <div className="flex space-x-6">
            <Link href="#" className="text-gray-500 hover:text-indigo-600 transition text-sm">
              
            </Link>
            <Link href="#" className="text-gray-500 hover:text-indigo-600 transition text-sm">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-500 hover:text-indigo-600 transition text-sm">
              Cookie Policy
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer; 