import { PortfolioProvider } from '@/context/PortfolioContext'
import React from 'react'
import GrainyOverlay from './textures/GrainyOverlay'
import FilmGrainOverlay from './textures/FilmGrainOverlay'
import GlobalStyles from './layout/GlobalStyles'
import LandingSection from './sections/LandingSection'
import AboutSection from './sections/AboutSection'
import ProjectsSection from './sections/ProjectsSection'
import ProjectModal from './ui/ProjectModal'
import NowSection from './sections/NowSection'
import ContactSection from './sections/ContactSection'

function ZarceroPortfolio() {
  return (
    <PortfolioProvider>
        <div className="bg-black text-white min-h-screen font-mono overflow-x-hidden relative">
            {/* Background Textures */}
            <GrainyOverlay />
            <FilmGrainOverlay />

            {/* Global Styles */}
            <GlobalStyles />

            {/* Sections */}
            <LandingSection />
            <AboutSection />
            <ProjectsSection />
            <NowSection />
            <ContactSection />

            {/* Modals */}
            <ProjectModal />
        </div>
    </PortfolioProvider>
  )
}

export default ZarceroPortfolio