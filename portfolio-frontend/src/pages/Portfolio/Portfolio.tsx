import { Outlet, Link } from "react-router-dom";
import "./Portfolio.css"; // On ajoutera un style plus tard

const Portfolio = () => {
  return (
    <div className="portfolio-container">
      <nav className="portfolio-navbar">
        <Link to="/portfolio/education">Éducation</Link>
        <Link to="/portfolio/experience">Expérience</Link>
        <Link to="/portfolio/skills">Compétences</Link>
        <Link to="/portfolio/projects">Projets</Link>
        <Link to="/portfolio/certifications">Certifications</Link>
        <Link to="/portfolio/social">Réseaux Sociaux</Link>
      </nav>
      <div className="portfolio-content">
        <Outlet /> {/* Va afficher la section active */}
      </div>
    </div>
  );
};

export default Portfolio;
