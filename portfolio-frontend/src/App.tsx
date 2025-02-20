import Navbar from "./components/Navbar/Navbar";

const App = () => {
  return (
    <div>
      <Navbar />
      <h1>Bienvenue sur MyApp</h1>
      <p>Votre application de gestion utilisateur</p>
      <img src="/logo.png" alt="Logo" className="logo" />
    </div>
  );
};

export default App;
