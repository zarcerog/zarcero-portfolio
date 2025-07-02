import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Project, MousePosition, SectionVisibility, SectionRefs } from '../types';

interface PortfolioContextType {
  // Scroll and visibility
  scrollY: number;
  isVisible: SectionVisibility;
  sectionsRef: React.MutableRefObject<SectionRefs>;
  
  // Mouse tracking
  mousePosition: MousePosition;
  
  // Projects
  projects: Project[];
  hoveredProject: Project | null;
  selectedProject: Project | null;
  setHoveredProject: (project: Project | null) => void;
  setSelectedProject: (project: Project | null) => void;
  
  // Stickers
  peeledStickers: Set<string>;
  handleStickerPeel: (stickerId: string) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

interface PortfolioProviderProps {
  children: ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState<SectionVisibility>({});
  const sectionsRef = useRef<SectionRefs>({});
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [peeledStickers, setPeeledStickers] = useState(new Set<string>());

  const projects: Project[] = [
    {
      id: 1,
      title: "DentOS",
      description: "Modular dental ERP. Features: digital odontogram, patient records, scheduling, billing, and staff time tracking — all in one clean, unified interface.",
      tech: "React, Next.js, MongoDB",
      link: "#",
      image: "/zarcero-portfolio/dentos.png",
      gif: "/zarcero-portfolio/dentos.gif",
      longDescription:
        "DentOS is a modular web-based ERP platform built for modern dental practices. Designed with usability and scalability in mind, it offers core tools like a Digital Odontogram, Patient Management, Appointment Scheduling, Billing, and Time Reporting for clinic staff — all within a sleek, unified interface. Developed with React, Next.js, and a component-based architecture, DentOS brings together the clinical and operational sides of dentistry into one intuitive workspace.",
      features: [
        "on-going development",
        "modular architecture",
        "tailwindcss styling",
        "responsive ui",
        "webgl support (planned for odontogram)",
      ],
      year: "2025",
    },
    {
      id: 2,
      title: "Memento",
      description: "Memento is an app where users complete daily missions by sharing photos or videos.",
      tech: "React Native",
      link: "#",
      image: "/zarcero-portfolio/memento.png",
      gif: "/zarcero-portfolio/memento.gif",
      longDescription:
        `Memento is a React Native social app where users complete daily photo/video "missions" to document life creatively. I built a custom camera, integrated S3 media uploads, and designed a real-time feed where posts are linked to unique challenge types. The app handles image/video encoding, dynamic S3 storage, and contextual post display—all focused on self-expression.`,
      features: [
        "Photo & video sharing",
        "S3 media storage",
        "Mission-based feed",
        "Mood-driven prompts",
        "Daily creative missions",
      ],
      year: "2024",
    },
    {
      id: 3,
      title: "zarcerog.com",
      description: "This portfolio website, showcasing my work and personality.",
      tech: "React, TypeScript, Tailwind CSS",
      link: "#",
      image: "/zarcero-portfolio/portfolio.png",
      gif: "/zarcero-portfolio/portfolio.gif",
      longDescription:
        "A portfolio that merges street aesthetics with modern web development. Features interactive peelable stickers, film grain textures, and gritty black-and-white design. Built with React, it proves professional work doesn't have to be corporate.",
      features: [
        "Hover project previews",
        "Responsive street sign contact",
        "Raw monochrome design",
        "Modal project details"
      ],
      year: "2025",
    },
  ];

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for section visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionsRef.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Mouse position tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleStickerPeel = (stickerId: string) => {
    setPeeledStickers((prev) => new Set([...prev, stickerId]));
  };

  const value: PortfolioContextType = {
    scrollY,
    isVisible,
    sectionsRef,
    mousePosition,
    projects,
    hoveredProject,
    selectedProject,
    setHoveredProject,
    setSelectedProject,
    peeledStickers,
    handleStickerPeel,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};