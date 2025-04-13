import AboutPage from "@/pages/about";
import ConfigPage from "@/pages/config";
import GhostsPage from "@/pages/ghosts";
import {
  IconGhost,
  IconInfoCircle,
  IconSettings,
  IconDeviceGamepad,
} from "@tabler/icons-react";

export const pagesConfig = {
  Ghosts: {
    title: "Fantasmas",
    url: "/ghosts",
    icon: IconGhost,
    component: () => <GhostsPage />,
  },
  Games: {
    title: "Jogos",
    url: "/games",
    icon: IconDeviceGamepad,
    component: () => <div className="p-4">Página de Jogos</div>,
  },
  Settings: {
    title: "Configurações",
    url: "/settings",
    icon: IconSettings,
    component: () => <ConfigPage />,
  },
  About: {
    title: "Sobre",
    url: "/about",
    icon: IconInfoCircle,
    component: () => <AboutPage />,
  },
};

export const navConfig = {
  navMain: [pagesConfig.Ghosts, pagesConfig.Games],
  navSecondary: [pagesConfig.Settings, pagesConfig.About],
};
