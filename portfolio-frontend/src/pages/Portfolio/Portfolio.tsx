import { Outlet, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTranslation } from "react-i18next";
import { useState } from "react"; // Ajout pour gérer l'état des messages
import "./Portfolio.css";

const Portfolio = () => {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user.user);
  const portfolio = useSelector((state: RootState) => state.portfolio.portfolio);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null); // État pour les messages

  const isProfileIncomplete = !user?.firstName || !user?.lastName;

  const baseURL = "http://localhost:5173/portfolio";
  const portfolioURL = user
    ? `${baseURL}/${user.firstName || "unknown"}/${user.lastName || "unknown"}/${user.slug || ""}`
    : "";

  if (isProfileIncomplete) {
    return (
      <div className="portfolio-container">
        <h1 className="portfolio-title">{t("portfolio.incompleteTitle", "Mon Portfolio")}</h1>
        <p className="incomplete-profile-message">
          ⚠️ {t("portfolio.incompleteMessage", "Veuillez compléter votre profil pour générer un portfolio.")}{" "}
          <Link to="/edit-profile">{t("portfolio.editProfile", "Cliquez ici pour modifier votre profil")}</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="portfolio-container">
      {message && (
        <div className={`portfolio-message ${message.type === "error" ? "error" : "success"}`}>
          {message.text}
        </div>
      )}
      {/* Navbar principal */}
      <nav className="portfolio-navbar">
        <ul className="navbar-list">
          <li><Link to="/portfolio/global"><i className="fas fa-scroll"></i> {t("portfolio.global", "Portfolio Global")}</Link></li>
          <li><Link to="/portfolio/education"><i className="fas fa-graduation-cap"></i> {t("portfolio.education", "Éducation")}</Link></li>
          <li><Link to="/portfolio/experience"><i className="fas fa-briefcase"></i> {t("portfolio.experience", "Expérience")}</Link></li>
          <li><Link to="/portfolio/skills"><i className="fas fa-tools"></i> {t("portfolio.skills", "Compétences")}</Link></li>
          <li><Link to="/portfolio/projects"><i className="fas fa-folder"></i> {t("portfolio.projects", "Projets")}</Link></li>
          <li><Link to="/portfolio/certifications"><i className="fas fa-certificate"></i> {t("portfolio.certifications", "Certifications")}</Link></li>
          <li><Link to="/portfolio/social"><i className="fas fa-globe"></i> {t("portfolio.social", "Réseaux Sociaux")}</Link></li>
          <li><Link to="/portfolio/languages"><i className="fas fa-language"></i> {t("portfolio.languages", "Langues")}</Link></li>
          <li><Link to="/portfolio/recommendations"><i className="fas fa-comment"></i> {t("portfolio.recommendations", "Recommandations")}</Link></li>
          <li><Link to="/portfolio/interests"><i className="fas fa-bullseye"></i> {t("portfolio.interests", "Centres d’intérêt")}</Link></li>
        </ul>
      </nav>

      {/* Sous-navbar */}
      <nav className="portfolio-subnavbar">
        <ul className="subnavbar-list">
          <li><Link to="#"><i className="fas fa-filter"></i> {t("portfolio.filterByDate", "Filtrer par date")}</Link></li>
          <li><Link to="#"><i className="fas fa-sort-amount-down"></i> {t("portfolio.sortByRelevance", "Trier par pertinence")}</Link></li>
          <li><Link to="#"><i className="fas fa-file-pdf"></i> {t("portfolio.exportPDF", "Exporter PDF")}</Link></li>
        </ul>
      </nav>

      {/* Lien public */}
      {user && portfolioURL && (
        <div className="portfolio-public-url">
          <p>
            <i className="fas fa-link"></i> {t("portfolio.publicLink", "Lien public : ")}
            <span className="portfolio-url-text">{portfolioURL}</span>
          </p>
          <button
            className="portfolio-link-btn"
            onClick={() => {
              navigator.clipboard
                .writeText(portfolioURL)
                .then(() => {
                  setMessage({ text: t("portfolio.linkCopied", "Lien copié !"), type: "success" });
                  setTimeout(() => setMessage(null), 3000); // Disparition après 3 secondes
                })
                .catch((err) => {
                  console.error("Erreur lors de la copie:", err);
                  setMessage({
                    text: t("portfolio.copyError", "Erreur lors de la copie. Copiez manuellement : ") + portfolioURL,
                    type: "error",
                  });
                  setTimeout(() => setMessage(null), 5000); // Plus long pour l'erreur
                });
            }}
          >
            {t("portfolio.copy", "Copier")}
          </button>
        </div>
      )}

      {/* Contenu dynamique */}
      <div className="portfolio-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Portfolio;