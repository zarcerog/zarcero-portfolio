import { PortfolioProvider } from '@/context/PortfolioContext'
import React from 'react'
import GrainyOverlay from './textures/GrainyOverlay'
import FilmGrainOverlay from './textures/FilmGrainOverlay'
import GlobalStyles from './layout/GlobalStyles'
import LandingSection from './sections/landing'

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
        </div>
    </PortfolioProvider>
  )
}

export default ZarceroPortfolio