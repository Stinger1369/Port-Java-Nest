import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchPortfolioByUser } from "../../../redux/features/portfolioSlice";
import "./PortfolioGlobal.css"; // Styles pour le CV

const PortfolioGlobal = () => {
  console.log("🔄 Rendering PortfolioGlobal");

  const dispatch = useDispatch<AppDispatch>();
  const userId = localStorage.getItem("userId");

  // Récupération des données Redux
  const { portfolio, status: portfolioStatus, error: portfolioError } = useSelector(
    (state: RootState) => state.portfolio
  );

  console.log("📜 Portfolio Status:", portfolioStatus);
  console.log("📜 Portfolio Data:", portfolio);
  console.log("❌ Portfolio Error:", portfolioError);

  // ✅ **Récupérer le portfolio détaillé**
  useEffect(() => {
    if (userId) {
      dispatch(fetchPortfolioByUser(userId));
    }
  }, [dispatch, userId]);

  if (portfolioStatus === "loading") {
    return <p>⏳ Chargement du portfolio...</p>;
  }

  if (portfolioStatus === "failed") {
    return <p>❌ Impossible de charger le portfolio : {portfolioError}</p>;
  }

  if (!portfolio) {
    return <p>📜 En attente de création du portfolio...</p>;
  }

  return (
    <div className="portfolio-global-container">
      <h1 className="portfolio-title">Mon Portfolio</h1>

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