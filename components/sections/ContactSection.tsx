import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Github, Linkedin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const ContactSection: React.FC = () => {
  const { sectionsRef } = usePortfolio();
  const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
  const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
  const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            {
            from_name: formData.name,
            from_email: formData.email,
            message: formData.message
            },
            EMAILJS_PUBLIC_KEY
        );
        
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
        console.error('EmailJS error:', error);
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      ref={el => { sectionsRef.current.contact = el }}
      id="contact"
      className="py-20 px-4 min-h-screen flex items-center justify-center"
    >
      <div className="text-center max-w-2xl mx-auto">
        {/* Highway Street Sign with Form Inside */}
        <div className="relative">
          {/* Street Sign Background */}
          <div className="bg-green-700 border-8 border-white shadow-2xl transform -rotate-1 relative overflow-hidden">
            {/* Sign Content */}
            <div className="relative z-10 p-8">
              {/* Sign Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-wider mb-2 font-mono">
                  YOU MADE IT
                </h2>
                <p className="text-lg md:text-2xl font-bold text-white font-mono">NOW SAY HI</p>
                <div className="w-full h-1 bg-white mt-4 mb-6"></div>
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-600 border-2 border-white text-white rounded flex items-center justify-center space-x-2">
                  <CheckCircle size={20} />
                  <span className="font-bold">MESSAGE SENT! I'LL GET BACK TO YOU SOON.</span>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-600 border-2 border-white text-white rounded flex items-center justify-center space-x-2">
                  <AlertCircle size={20} />
                  <span className="font-bold">SOMETHING WENT WRONG. TRY AGAIN.</span>
                </div>
              )}

              {/* Contact Form Inside Sign */}
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-white text-sm font-bold mb-2 font-mono uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-black border-2 p-3 text-white font-mono text-sm focus:outline-none transition-colors ${
                      errors.name 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-white focus:border-gray-400'
                    }`}
                    placeholder="Your name here..."
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-red-300 text-xs mt-1 font-mono">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-bold mb-2 font-mono uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-black border-2 p-3 text-white font-mono text-sm focus:outline-none transition-colors ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-white focus:border-gray-400'
                    }`}
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-red-300 text-xs mt-1 font-mono">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white text-sm font-bold mb-2 font-mono uppercase tracking-wider">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`w-full bg-black border-2 p-3 text-white font-mono text-sm h-24 focus:outline-none resize-none transition-colors ${
                      errors.message 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-white focus:border-gray-400'
                    }`}
                    placeholder="Let's build something cool together..."
                    disabled={isSubmitting}
                  />
                  {errors.message && (
                    <p className="text-red-300 text-xs mt-1 font-mono">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full p-4 font-black font-mono text-lg border-4 border-black transform uppercase tracking-wider transition-all duration-300 flex items-center justify-center space-x-2 ${
                    isSubmitting
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      <span>SENDING...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>

              {/* Social Links */}
              <div className="flex justify-center space-x-6 mt-8 pt-6 border-t-2 border-white">
                <a 
                  href="https://github.com/zarcerog" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-300 hover:scale-110 transition-all"
                  aria-label="GitHub Profile"
                >
                  <Github size={32} />
                </a>
                <a 
                  href="https://www.linkedin.com/in/zarcerog/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-300 hover:scale-110 transition-all"
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin size={32} />
                </a>
                <a 
                  href="mailto:nzarcerogarcia@gmail.com" 
                  className="text-white hover:text-gray-300 hover:scale-110 transition-all"
                  aria-label="Send Email"
                >
                  <Mail size={32} />
                </a>
              </div>
            </div>

            {/* Mounting holes */}
            <div className="absolute top-4 left-4 w-3 h-3 bg-white rounded-full border border-gray-600"></div>
            <div className="absolute top-4 right-4 w-3 h-3 bg-white rounded-full border border-gray-600"></div>
            <div className="absolute bottom-4 left-4 w-3 h-3 bg-white rounded-full border border-gray-600"></div>
            <div className="absolute bottom-4 right-4 w-3 h-3 bg-white rounded-full border border-gray-600"></div>
          </div>

          {/* Shadow */}
          <div className="absolute inset-0 bg-black/20 transform translate-x-2 translate-y-2 -z-10 blur-sm"></div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;