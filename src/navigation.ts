export type NavigationChild = {
  name: string;
  href: string;
};

export type NavigationItem = {
  name: string;
  href: string;
  children?: NavigationChild[];
};

export const navigation: NavigationItem[] = [
  { name: "Home", href: "/" },
  { name: "Messenger", href: "/messenger" },
  {
    name: "Team",
    href: "/team",
    children: [
      { name: "Team", href: "/team" },
      { name: "HR & Documents", href: "/hr-documents" },
      { name: "To-Do's", href: "/todos" }
    ]
  },
  {
    name: "People",
    href: "/people",
    children: [
      { name: "Service Users", href: "/people" },
      { name: "Housing", href: "/housing" },
      { name: "Logs", href: "/logs" }
    ]
  },
  {
    name: "Clinical",
    href: "/clinical",
    children: [
      { name: "Clinical", href: "/clinical" },
      { name: "eMar", href: "/emar" },
      { name: "Occupational Therapy", href: "/occupational-therapy" }
    ]
  },
  { name: "Rota", href: "/rota" },
  { name: "Reports", href: "/reports" },
  { name: "Settings", href: "/settings" }
];
