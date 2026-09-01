import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { useAppStore } from "./store/appStore";

// Jeu de données pour les captures du site (`site/README.md`). Restreint au
// mode développement : Vite élimine tout le bloc des builds de production, donc
// rien de tout ceci ne part dans l'application livrée.
const demo = import.meta.env.DEV ? new URLSearchParams(location.search).get("demo") : null;
if (demo) {
  const seed = () => useAppStore.setState({
    settingsLoaded: true,
    apiKey: "sk-ant-demo",
    activeTab: demo === "correct" ? "correct" : "translate",
    sourceLang: "auto",
    targetLang: "French",
    sourceText:
      "Could you send me the signed contract before Friday? The client is waiting on it to release the first payment, and I would rather not push the kickoff meeting again.",
    translatedText:
      "Pourriez-vous m'envoyer le contrat signé avant vendredi ? Le client l'attend pour débloquer le premier paiement, et je préférerais ne pas repousser la réunion de lancement une nouvelle fois.",
    correctionInput:
      "Bonjour, je vous envoie si joint le devis que vous m'avez demandez. N'hesitez pas a revenir vers moi si il y a des questions.",
    correctionMode: "grammar",
    correctionResult: {
      corrected:
        "Bonjour, je vous envoie ci-joint le devis que vous m'avez demandé. N'hésitez pas à revenir vers moi s'il y a des questions.",
      changes: [
        { original: "si joint", replacement: "ci-joint", reason: "orthographe" },
        { original: "demandez", replacement: "demandé", reason: "participe passé" },
        { original: "N'hesitez pas a", replacement: "N'hésitez pas à", reason: "accents" },
        { original: "si il y a", replacement: "s'il y a", reason: "élision" },
      ],
    },
  });
  seed();
  setTimeout(seed, 400);
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
