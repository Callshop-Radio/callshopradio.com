import { DashboardIcon } from "@sanity/icons";
import { defineType } from "sanity";

export const modules = defineType({
  title: "Modules",
  name: "modules",
  type: "array",
  icon: DashboardIcon,
  of: [
    { type: "module.contentReferenceGrid" },
    { type: "module.contentReferenceSlider" },
    { type: "module.heroEntry" },
    { type: "module.heroSlider" },
    { type: "module.text" },
  ],
});
