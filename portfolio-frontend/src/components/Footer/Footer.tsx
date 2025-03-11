import React from "react";
import "./Footer.css"; // On importera un fichier CSS pour le style

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear(); // Récupère l'année actuelle dynamiquement

  return (
    <footer className="footer">
      <p>Portfolio © {currentYear}</p>
    </footer>
  );
};

export default Footer;