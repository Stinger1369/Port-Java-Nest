import { useTranslation } from "react-i18next";
import "./Notifications.css"; // À créer si nécessaire

const Notifications = () => {
  const { t } = useTranslation();

  return (
    <div className="notifications-page">
      <h1>{t("notifications.title")}</h1>
      <p>{t("notifications.noNotifications")}</p>
    </div>
  );
};

export default Notifications;