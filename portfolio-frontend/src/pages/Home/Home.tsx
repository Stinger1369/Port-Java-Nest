import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import "./Home.css";

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token); // Vérifie si l'utilisateur est connecté

  const handleStartNow = () => {
    if (token) {
      navigate("/portfolio"); // Redirige vers Portfolio si connecté
    } else {
      navigate("/login"); // Redirige vers Login si non connecté
    }
  };

  return (
    <div className="home-container">
      {/* Section Héroïque */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <i className="fas fa-paint-brush"></i> {t("home.heroTitle", "Créez Votre Portfolio Gratuit avec PortfolioCraft")}
          </h1>
          <p className="hero-subtitle">
            {t("home.heroSubtitle", "Donnez vie à vos projets et compétences avec un portfolio unique, simple et professionnel.")}
          </p>
          <div className="hero-cta">
            <button onClick={handleStartNow} className="btn btn-primary">
              <i className="fas fa-user-plus"></i> {t("home.startNow", "Commencer Maintenant")}
            </button>
            <Link to="/portfolio" className="btn btn-secondary">
              <i className="fas fa-eye"></i> {t("home.explore", "Découvrir des Exemples")}
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/portfolio-hero.png" alt="PortfolioCraft" className="hero-img" />
        </div>
      </header>

      {/* Section Fonctionnalités */}
      <section className="features-section">
        <h2 className="features-title">{t("home.featuresTitle", "Pourquoi Choisir PortfolioCraft ?")}</h2>
        <div className="features-grid">
          <div className="feature-card">
            <i className="fas fa-tools feature-icon"></i>
            <h3>{t("home.feature1Title", "Personnalisation Facile")}</h3>
            <p>{t("home.feature1Desc", "Personnalisez votre portfolio avec des modèles modernes en quelques clics.")}</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-cloud-upload-alt feature-icon"></i>
            <h3>{t("home.feature2Title", "Hébergement Gratuit")}</h3>
            <p>{t("home.feature2Desc", "Publiez votre portfolio en ligne sans frais supplémentaires.")}</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-mobile-alt feature-icon"></i>
            <h3>{t("home.feature3Title", "Responsive Design")}</h3>
            <p>{t("home.feature3Desc", "Votre portfolio est parfait sur tous les appareils.")}</p>
          </div>
        </div>
      </section>

      {/* Section Appel à l’Action */}
      <section className="cta-section">
        <h2 className="cta-title">{t("home.ctaTitle", "Prêt à Montrer Votre Talent au Monde ?")}</h2>
        <p className="cta-text">{t("home.ctaText", "Rejoignez des milliers de créateurs et commencez dès aujourd’hui.")}</p>
        <Link to="/register" className="btn btn-cta">
          <i className="fas fa-rocket"></i> {t("home.ctaButton", "Créer Mon Portfolio")}
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 PortfolioCraft. {t("home.footer", "Tous droits réservés.")}</p>
        <div className="footer-links">
          <a href="/about" className="footer-link"><i className="fas fa-info-circle"></i> À Propos</a>
          <a href="/contact" className="footer-link"><i className="fas fa-envelope"></i> Contact</a>
          <a href="/terms" className="footer-link"><i className="fas fa-file-alt"></i> Conditions</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;