import Link from 'next/link';
import Image from 'next/image';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import PortfolioImage from '../assests/Rakshit_Icon.png';

const Footer = () => {
  return (
    <footer className="w-full py-4 px-4 bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-6">
          <Link 
            href="https://dev2th3core.site" 
            className="hover:opacity-80 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Portfolio"
          >
            <Image src={PortfolioImage} alt="Portfolio" width={35} height={35} />
          </Link>
          <Link 
            href="https://github.com/Rakshit4045" 
            className="hover:text-blue-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <FaGithub size={24} />
          </Link>
          <Link 
            href="https://linkedin.com/in/rakshit-shinde" 
            className="hover:text-blue-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={24} />
          </Link>
        </div>

        <div className="text-center md:text-left">
          <p className="text-sm md:text-base">
            Built with 🤍 by{' '}
            <Link 
              href="https://dev2th3core.site" 
              className="hover:text-blue-600 transition-colors"
            >
              Dev2th3Core
            </Link>
          </p>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} Dev2th3Core. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer; 