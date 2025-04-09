import {
  IconGhost,
  IconInfoCircle,
  IconSettings,
  IconDeviceGamepad,
} from "@tabler/icons-react";

export const pagesConfig = {
  Ghosts: {
    title: "Ghosts",
    url: "/ghosts",
    icon: IconGhost,
    component: () => <div className="p-4">Página de Fantasmas</div>,
  },
  Games: {
    title: "Games",
    url: "/games",
    icon: IconDeviceGamepad,
    component: () => <div className="p-4">Página de Jogos</div>,
  },
  Settings: {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
    component: () => <div className="p-4">Página de Configurações</div>,
  },
  About: {
    title: "About",
    url: "/about",
    icon: IconInfoCircle,
    component: () => <div className="p-4">Página de Sobre</div>,
  },
};

export const navConfig = {
  navMain: [pagesConfig.Ghosts, pagesConfig.Games],
  navSecondary: [pagesConfig.Settings, pagesConfig.About],
};
