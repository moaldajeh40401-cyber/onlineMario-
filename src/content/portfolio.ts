export const PROFILE = {
  name: "Mohammad Mahmoud Aldajeh",
  title: "Full Stack Mobile Developer",
};

export const ABOUT_TEXT =
  "Full-stack mobile developer with 1 year of freelance experience in Flutter, Kotlin, and React Native, " +
  "plus solid backend experience with Flask (Python). Technical Team Leader at JU Aqaba IEEE Student Branch, " +
  "where I led 2 beginner Flutter workshops.";

export interface Project {
  name: string;
  description: string;
}

export const PROJECTS: Project[] = [
  {
    name: "Seig",
    description:
      "A CV builder app that generates ATS-standard resumes. A fine-tuned Qwen AI agent rewrites your experience " +
      "and details to match ATS standards, then exports a polished PDF.",
  },
  {
    name: "Hustler",
    description:
      "A finance app built for students living far from home, helping them organize and monitor their expenses. " +
      "Built with Kotlin and Flutter.",
  },
  {
    name: "Ride-Hailing App",
    description:
      "A custom, cloud-based ride-hailing app built for a client — focused on delivering the best experience " +
      "for both drivers and passengers.",
  },
];

export const CONTACT = {
  phone: "0791220430",
  whatsapp: "0791220430",
  whatsappLink: "https://wa.me/962791220430",
  linkedin: "https://www.linkedin.com/in/m0hmad-aldajah",
  instagram: "seigleon",
  instagramLink: "https://www.instagram.com/seigleon",
};
