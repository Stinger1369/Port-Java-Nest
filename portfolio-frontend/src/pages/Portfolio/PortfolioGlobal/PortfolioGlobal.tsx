import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchPortfolioByUser, fetchPortfolioByUsername } from "../../../redux/features/portfolioSlice";
import { useParams, Link } from "react-router-dom";
import "./PortfolioGlobal.css";

// ✅ Définir les types pour le portfolio
interface Education { id: string; degree: string; schoolName: string; startDate: string; }
interface Experience { id: string; jobTitle: string; companyName: string; startDate: string; }
interface Skill { id: string; name: string; }
interface Project { id: string; title: string; }
interface Certification { id: string; name: string; }
interface SocialLink { id: string; platform: string; url: string; }
interface Language { id: string; name: string; }
interface Recommendation { id: string; content: string; }
interface Interest { id: string; name: string; }

interface Portfolio {
  id?: string;
  userId: string;
  isPublic: boolean;
  educations: Education[];
  experiences: Experience[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  socialLinks: SocialLink[];
  languages: Language[];
  recommendations: Recommendation[];
  interests: Interest[];
}

const PortfolioGlobal = () => {
  console.log("🔄 Rendering PortfolioGlobal");

  const dispatch = useDispatch<AppDispatch>();
  const { firstName, lastName, slug } = useParams<{ firstName?: string; lastName?: string; slug?: string }>();

  const { portfolio, status: portfolioStatus, error: portfolioError } = useSelector(
    (state: RootState) => state.portfolio
  );
  const user = useSelector((state: RootState) => state.user.user);

  const isPublicView = Boolean(firstName && lastName && slug);
  const isUserAuthenticated = Boolean(user && !isPublicView);

  useEffect(() => {
    if (isPublicView && firstName && lastName && slug) {
      dispatch(fetchPortfolioByUsername({ firstName, lastName, slug }));
    } else if (isUserAuthenticated) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        dispatch(fetchPortfolioByUser(userId));
      }
    }
  }, [dispatch, firstName, lastName, slug, isPublicView, isUserAuthenticated]);

  const baseURL = "http://localhost:5173/portfolio";
  const portfolioURL = user ? `${baseURL}/${user.firstName || "unknown"}/${user.lastName || "unknown"}/${user.slug || ""}` : "";

  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    if (!portfolioURL) return;
    navigator.clipboard.writeText(portfolioURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwnPortfolio = user && portfolio && user.id === portfolio.userId;

  // ✅ Vérifier si le profil est incomplet pour l'utilisateur authentifié
  const isProfileIncomplete = isUserAuthenticated && (!user?.firstName || !user?.lastName);

  // ✅ Vérifier si le lien "Contacter" doit être affiché
  const canShowContactLink = isPublicView && !isOwnPortfolio;

  if (isProfileIncomplete) {
    return (
      <div className="portfolio-global-container">
        <h1 className="portfolio-title">Mon Portfolio</h1>
        <p>
          ⚠️ Veuillez compléter votre profil pour générer un portfolio.{" "}
          <Link to="/profile/edit-profile">Cliquez ici pour modifier votre profil</Link>.
        </p>
      </div>
    );
  }

  if (portfolioStatus === "loading") {
    return <p>⏳ Chargement du portfolio...</p>;
  }

  if (portfolioStatus === "failed") {
    return (
      <p>
        ❌ Impossible de charger le portfolio :{" "}
        {portfolioError || "Une erreur inattendue est survenue."}
      </p>
    );
  }

  if (!portfolio) {
    return <p>📜 Aucun portfolio trouvé.</p>;
  }

  return (
    <div className="portfolio-global-container">
      <h1 className="portfolio-title">
        {isPublicView ? `Portfolio de ${firstName} ${lastName}` : "Mon Portfolio"}
      </h1>

      {isUserAuthenticated && portfolioURL && (
        <div className="portfolio-link-container">
          <button className="portfolio-link-btn" onClick={copyToClipboard}>
            📎 Copier le lien du portfolio
          </button>
          {copied && <span className="copied-message">✅ Lien copié !</span>}
          <p className="portfolio-url">
            <a href={portfolioURL} target="_blank" rel="noopener noreferrer">
              {portfolioURL}
            </a>
          </p>
        </div>
      )}

      {canShowContactLink && (
        <div className="contact-link">
          <Link to={`/portfolio/${firstName}/${lastName}/${slug}/contact`}>
            📬 Contacter {`${firstName} ${lastName}`}
          </Link>
        </div>
      )}

      {portfolio.educations?.length > 0 && (
        <section className="cv-section">
          <h2>🎓 Éducation</h2>
          <ul>
            {portfolio.educations.map((edu) => (
              <li key={edu.id}>
                <strong>{edu.degree}</strong> - {edu.schoolName} ({edu.startDate})
              </li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.experiences?.length > 0 && (
        <section className="cv-section">
          <h2>💼 Expérience</h2>
          <ul>
            {portfolio.experiences.map((exp) => (
              <li key={exp.id}>
                <strong>{exp.jobTitle}</strong> - {exp.companyName} ({exp.startDate})
              </li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.skills?.length > 0 && (
        <section className="cv-section">
          <h2>🛠️ Compétences</h2>
          <ul className="skills-list">
            {portfolio.skills.map((skill) => (
              <li key={skill.id}>{skill.name}</li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.projects?.length > 0 && (
        <section className="cv-section">
          <h2>📂 Projets</h2>
          <ul>
            {portfolio.projects.map((project) => (
              <li key={project.id}>{project.title}</li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.certifications?.length > 0 && (
        <section className="cv-section">
          <h2>📜 Certifications</h2>
          <ul>
            {portfolio.certifications.map((cert) => (
              <li key={cert.id}>{cert.name}</li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.socialLinks?.length > 0 && (
        <section className="cv-section">
          <h2>🔗 Réseaux Sociaux</h2>
          <ul>
            {portfolio.socialLinks.map((link) => (
              <li key={link.id}>
                <a href={link.url}>{link.platform}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.languages?.length > 0 && (
        <section className="cv-section">
          <h2>🌍 Langues</h2>
          <ul>
            {portfolio.languages.map((lang) => (
              <li key={lang.id}>{lang.name}</li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.recommendations?.length > 0 && (
        <section className="cv-section">
          <h2>💬 Recommandations</h2>
          <ul>
            {portfolio.recommendations.map((rec) => (
              <li key={rec.id}>{rec.content}</li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.interests?.length > 0 && (
        <section className="cv-section">
          <h2>🎯 Centres d'intérêt</h2>
          <ul>
            {portfolio.interests.map((interest) => (
              <li key={interest.id}>{interest.name}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default PortfolioGlobal;