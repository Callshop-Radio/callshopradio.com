import { documents } from "./documents";
import { objects } from "./objects";
import { settings } from "./settings";
import { singletons } from "./singletons";

export const schemaTypes = [
  ...documents,
  ...singletons,
  ...settings,
  ...objects,
];
