import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchPortfolioByUser, fetchPortfolioByUsername } from "../../../redux/features/portfolioSlice";
import { useParams, Link } from "react-router-dom";
import { getImagesByIds, Image } from "../../../redux/features/imageSlice"; // Importer getImagesByIds
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
  imageIds?: string[]; // Ajout pour inclure les imageIds si disponibles dans le portfolio
}

// ✅ Définir les types pour l'utilisateur avec email et phone
interface User {
  id?: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  bio?: string;
  profilePictureUrl?: string;
  showBirthdate: boolean;
  imageIds?: string[]; // Ajout pour inclure les imageIds
}

const PortfolioGlobal = () => {
  console.log("🔄 Rendering PortfolioGlobal");

  const dispatch = useDispatch<AppDispatch>();
  const { firstName, lastName, slug } = useParams<{ firstName?: string; lastName?: string; slug?: string }>();

  const { portfolio, status: portfolioStatus, error: portfolioError } = useSelector(
    (state: RootState) => state.portfolio
  );
  const user = useSelector((state: RootState) => state.user.user) as User | null;
  const { images, status: imageStatus } = useSelector((state: RootState) => state.image);

  const isPublicView = Boolean(firstName && lastName && slug);
  const isUserAuthenticated = Boolean(user && !isPublicView);

  // ✅ Récupérer les informations de l'utilisateur pour la vue publique
  const [publicUser, setPublicUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (isPublicView && firstName && lastName && slug) {
      dispatch(fetchPortfolioByUsername({ firstName, lastName, slug }))
        .unwrap()
        .then((response) => {
          const userData = response.user || {
            firstName,
            lastName,
            birthdate: "",
            city: "",
            country: "",
            email: "",
            phone: "",
            bio: "",
            profilePictureUrl: "",
            showBirthdate: false,
            imageIds: response.imageIds || [], // Utiliser imageIds du portfolio si disponible
          };
          setPublicUser(userData);
          if (userData.imageIds && userData.imageIds.length > 0) {
            dispatch(getImagesByIds(userData.imageIds))
              .unwrap()
              .then((images: Image[]) => {
                const profileImg = images.find((img) => img.isProfilePicture && !img.isNSFW);
                setProfileImage(profileImg ? `http://localhost:7000/${profileImg.path}` : null);
              })
              .catch((err) => console.error("❌ Erreur chargement images publiques:", err));
          }
        })
        .catch((err) => console.error("❌ Erreur fetchPortfolioByUsername:", err));
    } else if (isUserAuthenticated) {
      const userId = localStorage.getItem("userId");
      if (userId) {
        dispatch(fetchPortfolioByUser(userId))
          .unwrap()
          .then(() => {
            if (user?.imageIds && user.imageIds.length > 0) {
              dispatch(getImagesByIds(user.imageIds))
                .unwrap()
                .then((images: Image[]) => {
                  const profileImg = images.find((img) => img.isProfilePicture && !img.isNSFW);
                  setProfileImage(profileImg ? `http://localhost:7000/${profileImg.path}` : user.profilePictureUrl || null);
                })
                .catch((err) => console.error("❌ Erreur chargement images authentifiées:", err));
            } else if (user?.profilePictureUrl) {
              setProfileImage(user.profilePictureUrl);
            }
          })
          .catch((err) => console.error("❌ Erreur fetchPortfolioByUser:", err));
      }
    }
  }, [dispatch, firstName, lastName, slug, isPublicView, isUserAuthenticated]);

  // ✅ Calculer l'âge à partir de la date de naissance
  const calculateAge = (birthdate: string): number => {
    if (!birthdate) return 0;
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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

  // ✅ Déterminer l'utilisateur à afficher (authentifié ou public)
  const displayUser = isPublicView ? publicUser : user;

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

  if (portfolioStatus === "loading" || imageStatus === "loading") {
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
      {/* ✅ Section du lien en premier */}
      {isUserAuthenticated && portfolioURL && (
        <div className="portfolio-link-section">
          <p>
            📎 Copier le lien du portfolio{" "}
            <span className="portfolio-url-text">{portfolioURL}</span>
          </p>
          <button className="portfolio-link-btn" onClick={copyToClipboard}>
            Copier
          </button>
          {copied && <span className="copied-message">✅ Lien copié !</span>}
        </div>
      )}

      {/* ✅ Section d'informations de l'utilisateur avec carte large */}
      {displayUser && (
        <div className="portfolio-card large-card portfolio-user-info">
          <div className="portfolio-user-header">
            {(profileImage || displayUser.profilePictureUrl) && (
              <img
                src={profileImage || displayUser.profilePictureUrl}
                alt={`${displayUser.firstName} ${displayUser.lastName}`}
                className="portfolio-profile-picture"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/100"; // Image par défaut en cas d'erreur
                }}
              />
            )}
            <div className="portfolio-user-details">
              <h1 className="portfolio-user-name">
                {displayUser.firstName} {displayUser.lastName}
              </h1>
              {(displayUser.showBirthdate || isUserAuthenticated) && displayUser.birthdate && (
                <p className="portfolio-user-age">{calculateAge(displayUser.birthdate)} ans</p>
              )}
              {(displayUser.city || displayUser.country) && (
                <p className="portfolio-user-location">
                  📍 {displayUser.city || ""}{displayUser.city && displayUser.country ? ", " : ""}
                  {displayUser.country || ""}
                </p>
              )}
              {displayUser.email && (
                <p className="portfolio-user-email">📧 {displayUser.email}</p>
              )}
              {displayUser.phone && (
                <p className="portfolio-user-phone">📞 {displayUser.phone}</p>
              )}
              {displayUser.bio && <p className="portfolio-user-bio">{displayUser.bio}</p>}
            </div>
          </div>
        </div>
      )}

      {canShowContactLink && (
        <div className="portfolio-card small-card contact-link">
          <Link to={`/portfolio/${firstName}/${lastName}/${slug}/contact`}>
            📬 Contacter {`${firstName} ${lastName}`}
          </Link>
        </div>
      )}

      {portfolio.educations?.length > 0 && (
        <div className="portfolio-card medium-card cv-section">
          <h2>🎓 Éducation</h2>
          <ul>
            {portfolio.educations.map((edu) => (
              <li key={edu.id}>
                <strong>{edu.degree}</strong> - {edu.schoolName} ({edu.startDate})
              </li>
            ))}
          </ul>
        </div>
      )}

      {portfolio.experiences?.length > 0 && (
        <div className="portfolio-card medium-card cv-section">
          <h2>💼 Expérience</h2>
          <ul>
            {portfolio.experiences.map((exp) => (
              <li key={exp.id}>
                <strong>{exp.jobTitle}</strong> - {exp.companyName} ({exp.startDate})
              </li>
            ))}
          </ul>
        </div>
      )}

      {portfolio.skills?.length > 0 && (
        <div className="portfolio-card medium-card cv-section">
          <h2>🛠️ Compétences</h2>
          <ul className="skills-list">
            {portfolio.skills.map((skill) => (
              <li key={skill.id}>{skill.name}</li>
            ))}
          </ul>
        </div>
      )}

      {portfolio.projects?.length > 0 && (
        <div className="portfolio-card medium-card cv-section">
          <h2>📂 Projets</h2>
          <ul>
            {portfolio.projects.map((project) => (
              <li key={project.id}>{project.title}</li>
            ))}
          </ul>
        </div>
      )}

      {portfolio.certifications?.length > 0 && (
        <div className="portfolio-card medium-card cv-section">
          <h2>📜 Certifications</h2>
          <ul>
            {portfolio.certifications.map((cert) => (
              <li key={cert.id}>{cert.name}</li>
            ))}
          </ul>
        </div>
      )}

      {portfolio.socialLinks?.length > 0 && (
        <div className="portfolio-card medium-card cv-section">
          <h2>🔗 Réseaux Sociaux</h2>
          <ul>
            {portfolio.socialLinks.map((link) => (
              <li key={link.id}>
                <a href={link.url}>{link.platform}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {portfolio.languages?.length > 0 && (
        <div className="portfolio-card medium-card cv-section">
          <h2>🌍 Langues</h2>
          <ul>
            {portfolio.languages.map((lang) => (
              <li key={lang.id}>{lang.name}</li>
            ))}
          </ul>
        </div>
      )}

      {portfolio.recommendations?.length > 0 && (
        <div className="portfolio-card small-card cv-section">
          <h2>💬 Recommandations</h2>
          <ul>
            {portfolio.recommendations.map((rec) => (
              <li key={rec.id}>{rec.content}</li>
            ))}
          </ul>
        </div>
      )}

      {portfolio.interests?.length > 0 && (
        <div className="portfolio-card small-card cv-section">
          <h2>🎯 Centres d'intérêt</h2>
          <ul>
            {portfolio.interests.map((interest) => (
              <li key={interest.id}>{interest.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PortfolioGlobal;