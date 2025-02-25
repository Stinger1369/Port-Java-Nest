import { Outlet, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../..//redux/store";
import "./Portfolio.css"; // Styles du Portfolio

const Portfolio = () => {
  const user = useSelector((state: RootState) => state.user.user);

  // ✅ Vérifier si le profil est incomplet
  const isProfileIncomplete = !user?.firstName || !user?.lastName;

  if (isProfileIncomplete) {
    return (
      <div className="portfolio-container">
        <h1 className="portfolio-title">Mon Portfolio</h1>
        <p className="incomplete-profile-message">
          ⚠️ Veuillez compléter votre profil pour générer un portfolio.{" "}
          <Link to="/edit-profile">Cliquez ici pour modifier votre profil</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="portfolio-container">
      <nav className="portfolio-navbar">
        <Link to="/portfolio/global">📜 Portfolio Global</Link>
        <Link to="/portfolio/education">🎓 Éducation</Link>
        <Link to="/portfolio/experience">💼 Expérience</Link>
        <Link to="/portfolio/skills">🛠️ Compétences</Link>
        <Link to="/portfolio/projects">📂 Projets</Link>
        <Link to="/portfolio/certifications">📜 Certifications</Link>
        <Link to="/portfolio/social">🌐 Réseaux Sociaux</Link>
        <Link to="/portfolio/languages">🗣️ Langues</Link>
        <Link to="/portfolio/recommendations">💬 Recommandations</Link>
        <Link to="/portfolio/interests">🎯 Centres d’intérêt</Link>
      </nav>
      <div className="portfolio-content">
        <Outlet /> {/* Affiche la section active */}
      </div>
    </div>
  );
};

export default Portfolio;