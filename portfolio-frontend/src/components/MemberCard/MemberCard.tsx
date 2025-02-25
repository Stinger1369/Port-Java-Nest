import React from "react";
import { User } from "../../redux/features/userSlice";
import "./MemberCard.css";

interface MemberCardProps {
  member: User;
  onClick: () => void; // ✅ Ajout de la prop onClick
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  return (
    <div className="member-card" onClick={onClick}>
      <div className="member-header">
        <h3>{member.firstName} {member.lastName}</h3>
        <p className="email">{member.email}</p>
      </div>
      <div className="member-details">
        {member.phone && <p><i className="fas fa-phone"></i> {member.phone}</p>}
        {member.slug && (
          <p>
            <i className="fas fa-link"></i>
            <a href={`/portfolio/${member.firstName}/${member.lastName}/${member.slug}`} target="_blank" rel="noopener noreferrer">
              Voir le portfolio
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default MemberCard;