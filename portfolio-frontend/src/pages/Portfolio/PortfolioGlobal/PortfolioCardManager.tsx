import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styled from "styled-components";
import { customizePortfolioCards } from "../../../redux/features/portfolioCardSlice";

interface PortfolioCard {
  section: string;
  position: number;
  size: string;
  shape: string;
}

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
}

interface User {
  id?: string;
  projectIds?: string[];
  certificationIds?: string[];
  socialLinkIds?: string[];
  languageIds?: string[];
  interestIds?: string[];
}

interface PortfolioCardManagerProps {
  cards: PortfolioCard[];
  portfolio: Portfolio;
  isUserAuthenticated: boolean;
  userId?: string;
}

const sectionIdToNameMap = (sectionId: string): string => {
  const validSections = [
    "educations",
    "experiences",
    "skills",
    "projects",
    "certifications",
    "socialLinks",
    "languages",
    "recommendations",
    "interests",
  ];
  return validSections.includes(sectionId) ? sectionId : `unknown-${sectionId}`;
};

const Card = styled.div<{ size: string; shape: string }>`
  background: white;
  border-radius: ${(props) => (props.shape === "square" ? "10px" : "15px 5px 15px 5px")};
  padding: 20px;
  margin: 10px 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  ${(props) =>
    props.size === "large"
      ? "min-height: 300px; grid-column: span 2;"
      : props.size === "medium"
      ? "min-height: 250px; grid-column: span 1;"
      : "min-height: 200px; grid-column: span 1;"}

  &:hover {
    transform: translateY(-5px);
  }
`;

const CardControls = styled.div`
  margin-top: 15px;
  display: flex;
  gap: 10px;

  @media (max-width: 768px) {
    flex-direction: column;
  }

  select {
    padding: 5px;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    background: white;
    cursor: pointer;

    &:hover {
      border-color: #3498db;
    }

    @media (max-width: 768px) {
      width: 100%;
    }
  }
`;

const PortfolioCardManager: React.FC<PortfolioCardManagerProps> = ({
  cards,
  portfolio,
  isUserAuthenticated,
  userId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [localCards, setLocalCards] = useState<PortfolioCard[]>([]);
  const isDragging = useRef(false);

  // Normalisation des cartes avec useMemo pour éviter des re-rendus inutiles
  const normalizedCards = useMemo(() => {
    if (!cards || !Array.isArray(cards)) return [];
    return cards.map((card) => ({
      ...card,
      shape: card.shape || "square",
      section: sectionIdToNameMap(card.section),
    }));
  }, [cards]);

  useEffect(() => {
    if (!isDragging.current) {
      setLocalCards(normalizedCards);
      console.log("Normalized cards:", normalizedCards.map((c) => ({ section: c.section, position: c.position })));
    }
  }, [normalizedCards]);

  const sortedCards = useMemo(() => {
    return [...localCards].sort((a, b) => a.position - b.position);
  }, [localCards]);

  const isDropDisabled = !isUserAuthenticated;

  const onDragStart = useCallback(() => {
    isDragging.current = true;
    console.log("Drag started, current localCards:", localCards.map((c) => ({ section: c.section, position: c.position })));
  }, [localCards]);

  const onDragEnd = useCallback(
    (result: any) => {
      isDragging.current = false;
      console.log("Drag ended, result:", result);
      if (!result.destination || isDropDisabled) return;

      const items = Array.from(sortedCards);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      const updatedCards = items.map((card, index) => ({ ...card, position: index }));
      setLocalCards(updatedCards);
      console.log("Updated cards after drag:", updatedCards.map((c) => ({ section: c.section, position: c.position })));

      if (isUserAuthenticated && userId) {
        dispatch(customizePortfolioCards({ userId, preferences: updatedCards }))
          .unwrap()
          .then(() => console.log("✅ Cartes mises à jour avec succès"))
          .catch((err) => console.error("❌ Erreur lors de la mise à jour des cartes :", err));
      }
    },
    [sortedCards, isDropDisabled, isUserAuthenticated, userId, dispatch]
  );

  const updateCardConfig = useCallback(
    (index: number, field: string, value: string) => {
      const updatedCards = sortedCards.map((card, i) =>
        i === index ? { ...card, [field]: value } : card
      );
      setLocalCards(updatedCards);

      if (isUserAuthenticated && userId) {
        dispatch(customizePortfolioCards({ userId, preferences: updatedCards }))
          .unwrap()
          .then(() => console.log("✅ Cartes mises à jour avec succès"))
          .catch((err) => console.error("❌ Erreur lors de la mise à jour des cartes :", err));
      }
    },
    [sortedCards, isUserAuthenticated, userId, dispatch]
  );

  if (!cards || !Array.isArray(cards)) {
    return <p>⏳ Chargement des données...</p>;
  }

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <Droppable
        droppableId="portfolio-droppable"
        isDropDisabled={isDropDisabled}
        isCombineEnabled={false}
        ignoreContainerClipping={false}
      >
        {(provided) => (
          <div className="portfolio-grid" {...provided.droppableProps} ref={provided.innerRef}>
            {sortedCards.map((card, index) => {
              const sectionContent = () => {
                switch (card.section) {
                  case "educations":
                    return portfolio.educations.length > 0 && (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>🎓 Éducation</h2>
                        <ul>
                          {portfolio.educations.map((edu) => (
                            <li key={edu.id}>
                              <strong>{edu.degree}</strong> - {edu.schoolName} ({edu.startDate} - {edu.endDate || (edu.currentlyStudying ? "En cours" : "")})
                              {edu.description && <p>{edu.description}</p>}
                            </li>
                          ))}
                        </ul>
                        {isUserAuthenticated && (
                          <CardControls>
                            <select value={card.size} onChange={(e) => updateCardConfig(index, "size", e.target.value)}>
                              <option value="small">Petit</option>
                              <option value="medium">Moyen</option>
                              <option value="large">Grand</option>
                            </select>
                            <select value={card.shape} onChange={(e) => updateCardConfig(index, "shape", e.target.value)}>
                              <option value="square">Carré</option>
                              <option value="rectangle">Rectangle</option>
                            </select>
                          </CardControls>
                        )}
                      </Card>
                    );
                  case "experiences":
                    return portfolio.experiences.length > 0 && (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>💼 Expérience</h2>
                        <ul>
                          {portfolio.experiences.map((exp) => (
                            <li key={exp.id}>
                              <strong>{exp.jobTitle}</strong> - {exp.companyName} ({exp.startDate} - {exp.endDate || (exp.currentlyWorking ? "Actuellement" : "")})
                              {exp.description && <p>{exp.description}</p>}
                            </li>
                          ))}
                        </ul>
                        {isUserAuthenticated && (
                          <CardControls>
                            <select value={card.size} onChange={(e) => updateCardConfig(index, "size", e.target.value)}>
                              <option value="small">Petit</option>
                              <option value="medium">Moyen</option>
                              <option value="large">Grand</option>
                            </select>
                            <select value={card.shape} onChange={(e) => updateCardConfig(index, "shape", e.target.value)}>
                              <option value="square">Carré</option>
                              <option value="rectangle">Rectangle</option>
                            </select>
                          </CardControls>
                        )}
                      </Card>
                    );
                  case "skills":
                    return portfolio.skills.length > 0 && (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>🛠️ Compétences</h2>
                        <ul className="skills-list">
                          {portfolio.skills.map((skill) => (
                            <li key={skill.id}>{skill.name}</li>
                          ))}
                        </ul>
                        {isUserAuthenticated && (
                          <CardControls>
                            <select value={card.size} onChange={(e) => updateCardConfig(index, "size", e.target.value)}>
                              <option value="small">Petit</option>
                              <option value="medium">Moyen</option>
                              <option value="large">Grand</option>
                            </select>
                            <select value={card.shape} onChange={(e) => updateCardConfig(index, "shape", e.target.value)}>
                              <option value="square">Carré</option>
                              <option value="rectangle">Rectangle</option>
                            </select>
                          </CardControls>
                        )}
                      </Card>
                    );
                  case "projects":
                    return portfolio.projects.length > 0 && (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>📂 Projets</h2>
                        <ul>
                          {portfolio.projects.map((project) => (
                            <li key={project.id}>{project.title}</li>
                          ))}
                        </ul>
                        {isUserAuthenticated && (
                          <CardControls>
                            <select value={card.size} onChange={(e) => updateCardConfig(index, "size", e.target.value)}>
                              <option value="small">Petit</option>
                              <option value="medium">Moyen</option>
                              <option value="large">Grand</option>
                            </select>
                            <select value={card.shape} onChange={(e) => updateCardConfig(index, "shape", e.target.value)}>
                              <option value="square">Carré</option>
                              <option value="rectangle">Rectangle</option>
                            </select>
                          </CardControls>
                        )}
                      </Card>
                    );
                  case "certifications":
                    return portfolio.certifications.length > 0 && (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>📜 Certifications</h2>
                        <ul>
                          {portfolio.certifications.map((cert) => (
                            <li key={cert.id}>{cert.name}</li>
                          ))}
                        </ul>
                        {isUserAuthenticated && (
                          <CardControls>
                            <select value={card.size} onChange={(e) => updateCardConfig(index, "size", e.target.value)}>
                              <option value="small">Petit</option>
                              <option value="medium">Moyen</option>
                              <option value="large">Grand</option>
                            </select>
                            <select value={card.shape} onChange={(e) => updateCardConfig(index, "shape", e.target.value)}>
                              <option value="square">Carré</option>
                              <option value="rectangle">Rectangle</option>
                            </select>
                          </CardControls>
                        )}
                      </Card>
                    );
                  case "socialLinks":
                    return portfolio.socialLinks.length > 0 && (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>🔗 Réseaux Sociaux</h2>
                        <ul>
                          {portfolio.socialLinks.map((link) => (
                            <li key={link.id}>
                              <a href={link.url}>{link.platform}</a>
                            </li>
                          ))}
                        </ul>
                        {isUserAuthenticated && (
                          <CardControls>
                            <select value={card.size} onChange={(e) => updateCardConfig(index, "size", e.target.value)}>
                              <option value="small">Petit</option>
                              <option value="medium">Moyen</option>
                              <option value="large">Grand</option>
                            </select>
                            <select value={card.shape} onChange={(e) => updateCardConfig(index, "shape", e.target.value)}>
                              <option value="square">Carré</option>
                              <option value="rectangle">Rectangle</option>
                            </select>
                          </CardControls>
                        )}
                      </Card>
                    );
                  case "languages":
                    return portfolio.languages.length > 0 && (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>🌍 Langues</h2>
                        <ul>
                          {portfolio.languages.map((lang) => (
                            <li key={lang.id}>{lang.name}</li>
                          ))}
                        </ul>
                        {isUserAuthenticated && (
                          <CardControls>
                            <select value={card.size} onChange={(e) => updateCardConfig(index, "size", e.target.value)}>
                              <option value="small">Petit</option>
                              <option value="medium">Moyen</option>
                              <option value="large">Grand</option>
                            </select>
                            <select value={card.shape} onChange={(e) => updateCardConfig(index, "shape", e.target.value)}>
                              <option value="square">Carré</option>
                              <option value="rectangle">Rectangle</option>
                            </select>
                          </CardControls>
                        )}
                      </Card>
                    );
                  case "recommendations":
                    return portfolio.recommendations.length > 0 && (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>💬 Recommandations</h2>
                        <ul>
                          {portfolio.recommendations.map((rec) => (
                            <li key={rec.id}>{rec.content}</li>
                          ))}
                        </ul>
                        {isUserAuthenticated && (
                          <CardControls>
                            <select value={card.size} onChange={(e) => updateCardConfig(index, "size", e.target.value)}>
                              <option value="small">Petit</option>
                              <option value="medium">Moyen</option>
                              <option value="large">Grand</option>
                            </select>
                            <select value={card.shape} onChange={(e) => updateCardConfig(index, "shape", e.target.value)}>
                              <option value="square">Carré</option>
                              <option value="rectangle">Rectangle</option>
                            </select>
                          </CardControls>
                        )}
                      </Card>
                    );
                  case "interests":
                    return portfolio.interests.length > 0 && (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>🎯 Centres d'intérêt</h2>
                        <ul>
                          {portfolio.interests.map((interest) => (
                            <li key={interest.id}>{interest.name}</li>
                          ))}
                        </ul>
                        {isUserAuthenticated && (
                          <CardControls>
                            <select value={card.size} onChange={(e) => updateCardConfig(index, "size", e.target.value)}>
                              <option value="small">Petit</option>
                              <option value="medium">Moyen</option>
                              <option value="large">Grand</option>
                            </select>
                            <select value={card.shape} onChange={(e) => updateCardConfig(index, "shape", e.target.value)}>
                              <option value="square">Carré</option>
                              <option value="rectangle">Rectangle</option>
                            </select>
                          </CardControls>
                        )}
                      </Card>
                    );
                  default:
                    return (
                      <Card size={card.size} shape={card.shape} className="cv-section">
                        <h2>Section inconnue: {card.section}</h2>
                      </Card>
                    );
                }
              };

              const draggableId = `${card.section}-${card.position}`; // Identifiant unique basé sur section et position initiale
              return (
                <Draggable key={draggableId} draggableId={draggableId} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      {sectionContent()}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default PortfolioCardManager;