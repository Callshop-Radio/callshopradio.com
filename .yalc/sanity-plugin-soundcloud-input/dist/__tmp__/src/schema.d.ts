export declare const soundcloud: {
    type: "object";
    name: "soundcloud";
} & Omit<import("sanity").ObjectDefinition, "preview"> & {
    preview?: import("sanity").PreviewConfig<Record<string, string>, Record<never, any>> | undefined;
};
