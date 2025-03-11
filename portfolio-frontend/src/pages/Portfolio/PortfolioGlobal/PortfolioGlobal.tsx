import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { fetchPortfolioByUser, fetchPortfolioByUsername } from "../../../redux/features/portfolioSlice";
import { useParams, Link } from "react-router-dom";
import { getImagesByIds, Image } from "../../../redux/features/imageSlice";
import "./PortfolioGlobal.css";

interface Education {
  id: string;
  degree: string;
  schoolName: string;
  startDate: string;
  endDate?: string;
  currentlyStudying: boolean;
  description?: string;
  isPublic?: boolean;
}

interface Experience {
  id: string;
  jobTitle: string;
  companyName: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  description?: string;
  isPublic?: boolean;
}

interface Skill {
  id: string;
  name: string;
  isPublic?: boolean;
}

interface Project {
  id: string;
  title: string;
  isPublic?: boolean;
}

interface Certification {
  id: string;
  name: string;
  isPublic?: boolean;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  isPublic?: boolean;
}

interface Language {
  id: string;
  name: string;
  isPublic?: boolean;
}

interface Recommendation {
  id: string;
  content: string;
  isPublic?: boolean;
}

interface Interest {
  id: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface PortfolioCard {
  section: string;
  position: number;
  size: string;
  shape: string;
}

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
  cards: PortfolioCard[];
  imageIds?: string[];
}

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
  imageIds?: string[];
  slug?: string;
  projectIds?: string[];
  certificationIds?: string[];
  socialLinkIds?: string[];
  languageIds?: string[];
  interestIds?: string[];
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

  const [publicUser, setPublicUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [hasFetchedImages, setHasFetchedImages] = useState(false);

  const fetchPortfolioData = useCallback(() => {
    if (isPublicView && firstName && lastName && slug) {
      dispatch(fetchPortfolioByUsername({ firstName, lastName, slug }))
        .unwrap()
        .then((response) => {
          console.log("Réponse du backend (public):", response);
          const userData = {
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
            imageIds: response.imageIds || [],
            slug,
            projectIds: [],
            certificationIds: [],
            socialLinkIds: [],
            languageIds: [],
            interestIds: [],
          };
          setPublicUser(userData);
          if (userData.imageIds && userData.imageIds.length > 0 && !hasFetchedImages) {
            dispatch(getImagesByIds(userData.imageIds))
              .unwrap()
              .then((fetchedImages: Image[]) => {
                setHasFetchedImages(true);
                const profileImg = fetchedImages.find((img) => img.isProfilePicture && !img.isNSFW);
                setProfileImage(profileImg ? `http://localhost:7000/${profileImg.path}` : null);
              })
              .catch((err) => console.error("❌ Erreur chargement images publiques:", err));
          } else if (images.length > 0) {
            const profileImg = images.find((img) => img.isProfilePicture && !img.isNSFW);
            setProfileImage(profileImg ? `http://localhost:7000/${profileImg.path}` : null);
          }
        })
        .catch((err) => console.error("❌ Erreur fetchPortfolioByUsername:", err));
    } else if (isUserAuthenticated) {
      const userId = user?.id;
      if (userId) {
        dispatch(fetchPortfolioByUser(userId))
          .unwrap()
          .then(() => {
            console.log("Portfolio dans le store:", portfolio);
            if (user.imageIds && user.imageIds.length > 0 && !hasFetchedImages) {
              dispatch(getImagesByIds(user.imageIds))
                .unwrap()
                .then((fetchedImages: Image[]) => {
                  setHasFetchedImages(true);
                  const profileImg = fetchedImages.find((img) => img.isProfilePicture && !img.isNSFW);
                  setProfileImage(profileImg ? `http://localhost:7000/${profileImg.path}` : user.profilePictureUrl || null);
                })
                .catch((err) => console.error("❌ Erreur chargement images authentifiées:", err));
            } else if (user.imageIds && user.imageIds.length > 0 && images.length > 0) {
              const profileImg = images.find((img) => img.isProfilePicture && !img.isNSFW);
              setProfileImage(profileImg ? `http://localhost:7000/${profileImg.path}` : user.profilePictureUrl || null);
            } else if (user.profilePictureUrl) {
              setProfileImage(user.profilePictureUrl);
            }
          })
          .catch((err) => console.error("❌ Erreur fetchPortfolioByUser:", err));
      }
    }
  }, [dispatch, firstName, lastName, slug, isPublicView, isUserAuthenticated, user, images, hasFetchedImages]);

  useEffect(() => {
    if (portfolioStatus === "idle") {
      fetchPortfolioData();
    }
  }, [fetchPortfolioData, portfolioStatus]);

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

  const isOwnPortfolio = user && portfolio && user.id === portfolio.userId;
  const isProfileIncomplete = isUserAuthenticated && (!user?.firstName || !user?.lastName);
  const canShowContactLink = isPublicView && !isOwnPortfolio;
  const displayUser = isPublicView ? publicUser : user;

  const isPortfolioEmpty = (portfolio: Portfolio): boolean => {
    return (
      portfolio.educations.length === 0 &&
      portfolio.experiences.length === 0 &&
      portfolio.skills.length === 0 &&
      portfolio.projects.length === 0 &&
      portfolio.certifications.length === 0 &&
      portfolio.socialLinks.length === 0 &&
      portfolio.languages.length === 0 &&
      portfolio.recommendations.length === 0 &&
      portfolio.interests.length === 0
    );
  };

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
    return <p>⏳ Chargement du portfolio et des données utilisateur...</p>;
  }

  if (portfolioStatus === "failed") {
    if (portfolioError === "Portfolio non trouvé pour cet utilisateur.") {
      return (
        <div className="portfolio-global-container">
          <h1 className="portfolio-title">Mon Portfolio</h1>
          <p>
            📜 Votre portfolio est vide. Veuillez ajouter des données pour le compléter :
          </p>
          <ul className="portfolio-empty-links">
            <li>
              <Link to="/portfolio/education">➕ Ajouter une éducation</Link>
            </li>
            <li>
              <Link to="/portfolio/experience">➕ Ajouter une expérience</Link>
            </li>
            <li>
              <Link to="/portfolio/skills">➕ Ajouter des compétences</Link>
            </li>
            <li>
              <Link to="/portfolio/projects">➕ Ajouter des projets</Link>
            </li>
            <li>
              <Link to="/portfolio/certifications">➕ Ajouter des certifications</Link>
            </li>
            <li>
              <Link to="/portfolio/social">➕ Ajouter des réseaux sociaux</Link>
            </li>
            <li>
              <Link to="/portfolio/languages">➕ Ajouter des langues</Link>
            </li>
            <li>
              <Link to="/portfolio/recommendations">➕ Ajouter des recommandations</Link>
            </li>
            <li>
              <Link to="/portfolio/interests">➕ Ajouter des centres d'intérêt</Link>
            </li>
          </ul>
        </div>
      );
    }
    return <p>❌ Impossible de charger le portfolio : {portfolioError || "Une erreur inattendue est survenue."}</p>;
  }

  if (!portfolio) {
    return (
      <div className="portfolio-global-container">
        <h1 className="portfolio-title">Mon Portfolio</h1>
        <p>
          📜 Votre portfolio est vide. Veuillez ajouter des données pour le compléter :
        </p>
        <ul className="portfolio-empty-links">
          <li>
            <Link to="/portfolio/education">➕ Ajouter une éducation</Link>
          </li>
          <li>
            <Link to="/portfolio/experience">➕ Ajouter une expérience</Link>
          </li>
          <li>
            <Link to="/portfolio/skills">➕ Ajouter des compétences</Link>
          </li>
          <li>
            <Link to="/portfolio/projects">➕ Ajouter des projets</Link>
          </li>
          <li>
            <Link to="/portfolio/certifications">➕ Ajouter des certifications</Link>
          </li>
          <li>
            <Link to="/portfolio/social">➕ Ajouter des réseaux sociaux</Link>
          </li>
          <li>
            <Link to="/portfolio/languages">➕ Ajouter des langues</Link>
          </li>
          <li>
            <Link to="/portfolio/recommendations">➕ Ajouter des recommandations</Link>
          </li>
          <li>
            <Link to="/portfolio/interests">➕ Ajouter des centres d'intérêt</Link>
          </li>
        </ul>
      </div>
    );
  }

  if (isPortfolioEmpty(portfolio)) {
    return (
      <div className="portfolio-global-container">
        <h1 className="portfolio-title">Mon Portfolio</h1>
        <p>
          📜 Votre portfolio est vide. Veuillez ajouter des données pour le compléter :
        </p>
        <ul className="portfolio-empty-links">
          <li>
            <Link to="/portfolio/education">➕ Ajouter une éducation</Link>
          </li>
          <li>
            <Link to="/portfolio/experience">➕ Ajouter une expérience</Link>
          </li>
          <li>
            <Link to="/portfolio/skills">➕ Ajouter des compétences</Link>
          </li>
          <li>
            <Link to="/portfolio/projects">➕ Ajouter des projets</Link>
          </li>
          <li>
            <Link to="/portfolio/certifications">➕ Ajouter des certifications</Link>
          </li>
          <li>
            <Link to="/portfolio/social">➕ Ajouter des réseaux sociaux</Link>
          </li>
          <li>
            <Link to="/portfolio/languages">➕ Ajouter des langues</Link>
          </li>
          <li>
            <Link to="/portfolio/recommendations">➕ Ajouter des recommandations</Link>
          </li>
          <li>
            <Link to="/portfolio/interests">➕ Ajouter des centres d'intérêt</Link>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="portfolio-global-container">
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
                  target.src = "https://via.placeholder.com/100";
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
                  📍 {displayUser.city || ""}
                  {displayUser.city && displayUser.country ? ", " : ""}
                  {displayUser.country || ""}
                </p>
              )}
              {displayUser.email && <p className="portfolio-user-email">📧 {displayUser.email}</p>}
              {displayUser.phone && <p className="portfolio-user-phone">📞 {displayUser.phone}</p>}
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

      {/* Affichage direct des données de chaque section */}
      <div className="portfolio-sections">
        {portfolio.educations.length > 0 && (
          <div className="portfolio-section">
            <h2>🎓 Éducation</h2>
            <ul>
              {portfolio.educations.map((edu) => (
                <li key={edu.id}>
                  <strong>{edu.degree}</strong> - {edu.schoolName} ({edu.startDate} -{" "}
                  {edu.endDate || (edu.currentlyStudying ? "En cours" : "")})
                  {edu.description && <p>{edu.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {portfolio.experiences.length > 0 && (
          <div className="portfolio-section">
            <h2>💼 Expérience</h2>
            <ul>
              {portfolio.experiences.map((exp) => (
                <li key={exp.id}>
                  <strong>{exp.jobTitle}</strong> - {exp.companyName} ({exp.startDate} -{" "}
                  {exp.endDate || (exp.currentlyWorking ? "Actuellement" : "")})
                  {exp.description && <p>{exp.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {portfolio.skills.length > 0 && (
          <div className="portfolio-section">
            <h2>🛠️ Compétences</h2>
            <ul className="skills-list">
              {portfolio.skills.map((skill) => (
                <li key={skill.id}>{skill.name}</li>
              ))}
            </ul>
          </div>
        )}

        {portfolio.projects.length > 0 && (
          <div className="portfolio-section">
            <h2>📂 Projets</h2>
            <ul>
              {portfolio.projects.map((project) => (
                <li key={project.id}>{project.title}</li>
              ))}
            </ul>
          </div>
        )}

        {portfolio.certifications.length > 0 && (
          <div className="portfolio-section">
            <h2>📜 Certifications</h2>
            <ul>
              {portfolio.certifications.map((cert) => (
                <li key={cert.id}>{cert.name}</li>
              ))}
            </ul>
          </div>
        )}

        {portfolio.socialLinks.length > 0 && (
          <div className="portfolio-section">
            <h2>🔗 Réseaux Sociaux</h2>
            <ul>
              {portfolio.socialLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {portfolio.languages.length > 0 && (
          <div className="portfolio-section">
            <h2>🌍 Langues</h2>
            <ul>
              {portfolio.languages.map((lang) => (
                <li key={lang.id}>{lang.name}</li>
              ))}
            </ul>
          </div>
        )}

        {portfolio.recommendations.length > 0 && (
          <div className="portfolio-section">
            <h2>💬 Recommandations</h2>
            <ul>
              {portfolio.recommendations.map((rec) => (
                <li key={rec.id}>{rec.content}</li>
              ))}
            </ul>
          </div>
        )}

        {portfolio.interests.length > 0 && (
          <div className="portfolio-section">
            <h2>🎯 Centres d'intérêt</h2>
            <ul>
              {portfolio.interests.map((interest) => (
                <li key={interest.id}>{interest.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioGlobal;