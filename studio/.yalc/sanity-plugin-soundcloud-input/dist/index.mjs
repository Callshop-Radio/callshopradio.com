import { unset, set, definePlugin, defineType } from "sanity";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Stack, Inline, Text, Button, Spinner, Select, Card, TextInput } from "@sanity/ui";
import { useState } from "react";
import { TrashIcon } from "@sanity/icons";
const DataFetcher = (props) => {
  const { clientId, clientSecret, onSuccess } = props, [isFetching, setIsFetching] = useState(!1), [errorMsg, setErrorMsg] = useState(""), [tracks, setTracks] = useState([]), [selectedTracks, setSelectedTracks] = useState([]), [cachedAccessToken, setCachedAccessToken] = useState(null), fetchAccessToken = async () => {
    if (cachedAccessToken)
      return cachedAccessToken;
    const tokenUrl = "https://api.soundcloud.com/oauth2/token", body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials"
    });
    try {
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json; charset=utf-8"
        },
        body
      });
      if (console.log("Token Response Status:", response.status), !response.ok) {
        const errorText = await response.text();
        return console.error("Failed to fetch access token. Error response:", errorText), setErrorMsg(`Failed to fetch access token. Status: ${response.status}`), null;
      }
      const data = await response.json();
      return console.log("Token Response Data:", data), data.access_token ? (setCachedAccessToken(data.access_token), data.access_token) : (setErrorMsg(data.error || "Failed to obtain access token"), null);
    } catch (error) {
      return console.error("Error fetching access token:", error), setErrorMsg("Error obtaining access token"), null;
    }
  }, fetchUserId = async (username) => {
    const accessToken = await fetchAccessToken();
    if (!accessToken) {
      setErrorMsg("Failed to obtain access token");
      return;
    }
    try {
      const response = await fetch(`https://api.soundcloud.com/resolve?url=https://soundcloud.com/${username}`, {
        method: "GET",
        headers: {
          Authorization: `OAuth ${accessToken}`
          // Zugriffstoken hinzufügen
        }
      });
      if (!response.ok) {
        console.error("Failed to resolve username. Status:", response.status), setErrorMsg(`Failed to resolve username. Status: ${response.status}`);
        return;
      }
      const data = await response.json();
      if (console.log("User Data:", data), data && data.id)
        return data.id;
      console.error("User ID not found in response data"), setErrorMsg("User ID not found in response data");
      return;
    } catch (error) {
      console.error("Error fetching user ID:", error), setErrorMsg("Failed to fetch user ID.");
      return;
    }
  }, fetchTracks = async () => {
    setIsFetching(!0), setErrorMsg("");
    const accessToken = await fetchAccessToken();
    if (!accessToken) {
      setIsFetching(!1);
      return;
    }
    const userId = await fetchUserId("callshopradio");
    if (!userId) {
      setErrorMsg("User not found"), setIsFetching(!1);
      return;
    }
    try {
      const response = await fetch(
        `https://api.soundcloud.com/users/${userId}/tracks?client_id=${clientId}`,
        {
          method: "GET",
          headers: {
            Authorization: `OAuth ${accessToken}`
          }
        }
      );
      if (console.log("Response Status:", response.status), !response.ok)
        throw new Error("Failed to fetch user tracks");
      const transformedTracks = (await response.json()).map((track) => ({
        id: track.id.toString(),
        title: track.title,
        duration: track.duration,
        artwork_url: track.artwork_url,
        permalink_url: track.permalink_url
      }));
      setTracks(transformedTracks);
    } catch (error) {
      console.error("Error fetching user tracks:", error), setErrorMsg("Error fetching user tracks.");
    } finally {
      setIsFetching(!1);
    }
  }, handleSelectChange = (event) => {
    const selectedOptions = Array.from(
      event.target.selectedOptions,
      (option) => Number(option.value)
    );
    setSelectedTracks(selectedOptions);
    const selectedTracksData = tracks.filter((track) => selectedOptions.includes(track.id));
    onSuccess(selectedTracksData);
  };
  return /* @__PURE__ */ jsxs(Stack, { space: 4, children: [
    (!clientId || !clientSecret) && /* @__PURE__ */ jsxs(Inline, { space: [2], children: [
      /* @__PURE__ */ jsx(Text, { size: 2, children: "Missing" }),
      /* @__PURE__ */ jsx(Text, { size: 2, style: { fontWeight: "bold" }, children: "Client ID or Client Secret" })
    ] }),
    clientId && clientSecret && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Button, { text: "Fetch Tracks", onClick: fetchTracks, disabled: isFetching, tone: "primary" }),
      isFetching && /* @__PURE__ */ jsx(Spinner, { muted: !0 }),
      tracks.length > 0 && /* @__PURE__ */ jsx(Select, { onChange: handleSelectChange, value: selectedTracks.map(String), multiple: !0, children: tracks.map((track) => /* @__PURE__ */ jsx("option", { value: track.id.toString(), children: track.title }, track.id)) }),
      errorMsg && /* @__PURE__ */ jsxs(Text, { style: { color: "red" }, children: [
        "Error: ",
        errorMsg
      ] })
    ] })
  ] });
}, SoundCloudInputField = ({ config, onChange, value }) => {
  const { clientId, clientSecret } = config, handleReset = () => {
    onChange(unset());
  }, setTrackData = (data) => {
    onChange(data ? set(data) : unset());
  }, imgStyle = {
    width: "auto",
    height: "100px",
    borderRadius: "2px"
  };
  return /* @__PURE__ */ jsxs(Card, { children: [
    !value && /* @__PURE__ */ jsx(DataFetcher, { clientId, clientSecret, onSuccess: setTrackData }),
    value && /* @__PURE__ */ jsxs(Stack, { space: 4, children: [
      /* @__PURE__ */ jsxs(Stack, { space: 3, children: [
        /* @__PURE__ */ jsx(Text, { size: 1, weight: "semibold", children: "Track ID" }),
        /* @__PURE__ */ jsx(TextInput, { fontSize: 2, padding: 3, readOnly: !0, value: value?.id })
      ] }),
      /* @__PURE__ */ jsxs(Stack, { space: 3, children: [
        /* @__PURE__ */ jsx(Text, { size: 1, weight: "semibold", children: "Title" }),
        /* @__PURE__ */ jsx(TextInput, { fontSize: 2, padding: 3, readOnly: !0, value: value?.title })
      ] }),
      /* @__PURE__ */ jsxs(Stack, { space: 3, children: [
        /* @__PURE__ */ jsx(Text, { size: 1, weight: "semibold", children: "Artwork" }),
        value?.artwork_url && /* @__PURE__ */ jsx(
          "img",
          {
            src: value.artwork_url,
            alt: "SoundCloud Track Artwork",
            style: imgStyle
          }
        )
      ] }),
      /* @__PURE__ */ jsx(Inline, { space: [2], children: /* @__PURE__ */ jsx(
        Button,
        {
          text: "Reset",
          icon: TrashIcon,
          mode: "ghost",
          onClick: handleReset,
          type: "reset",
          tone: "critical"
        }
      ) })
    ] })
  ] });
};
function soundcloudInputRendering(config) {
  return {
    input: (props) => /* @__PURE__ */ jsx(SoundCloudInputField, { config, ...props })
  };
}
const defaultConfig = {
  clientId: "",
  clientSecret: ""
}, soundcloudInput = definePlugin((userConfig) => {
  const config = { ...defaultConfig, ...userConfig };
  return (!config.clientId || !config.clientSecret) && console.warn(
    "SoundCloud Plugin: Missing clientId or clientSecret. Make sure to pass them in the configuration."
  ), {
    name: "sanity-plugin-soundcloud-input",
    schema: {
      types: [
        // Define the custom "soundcloud" schema type
        defineType({
          title: "SoundCloud Set",
          name: "soundcloud",
          // Type name used in schemas
          type: "object",
          components: soundcloudInputRendering(config),
          // Use the custom input rendering function
          fields: [
            {
              title: "Selected Tracks",
              name: "tracks",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "id", title: "Track ID", type: "number" },
                    { name: "created_at", title: "Created At", type: "datetime" },
                    { name: "duration", title: "Duration", type: "number" },
                    { name: "commentable", title: "Commentable", type: "boolean" },
                    { name: "comment_count", title: "Comment Count", type: "number" },
                    { name: "sharing", title: "Sharing", type: "string" },
                    { name: "tag_list", title: "Tag List", type: "string" },
                    { name: "streamable", title: "Streamable", type: "boolean" },
                    { name: "embeddable_by", title: "Embeddable By", type: "string" },
                    { name: "purchase_url", title: "Purchase URL", type: "url" },
                    { name: "genre", title: "Genre", type: "string" },
                    { name: "title", title: "Title", type: "string" },
                    { name: "description", title: "Description", type: "text" },
                    { name: "label_name", title: "Label Name", type: "string" },
                    { name: "release_year", title: "Release Year", type: "number" },
                    { name: "release_month", title: "Release Month", type: "number" },
                    { name: "release_day", title: "Release Day", type: "number" },
                    { name: "license", title: "License", type: "string" },
                    { name: "uri", title: "URI", type: "url" },
                    {
                      name: "user",
                      title: "User",
                      type: "object",
                      fields: [
                        { name: "id", title: "User ID", type: "number" },
                        { name: "username", title: "Username", type: "string" },
                        { name: "permalink_url", title: "Permalink URL", type: "url" },
                        { name: "avatar_url", title: "Avatar URL", type: "url" },
                        { name: "created_at", title: "Created At", type: "datetime" },
                        { name: "track_count", title: "Track Count", type: "number" },
                        { name: "followers_count", title: "Followers Count", type: "number" },
                        { name: "followings_count", title: "Followings Count", type: "number" },
                        { name: "plan", title: "Plan", type: "string" }
                      ]
                    },
                    { name: "artwork_url", title: "Artwork URL", type: "url" },
                    { name: "stream_url", title: "Stream URL", type: "url" },
                    { name: "playback_count", title: "Playback Count", type: "number" },
                    { name: "favoritings_count", title: "Favoritings Count", type: "number" },
                    { name: "reposts_count", title: "Reposts Count", type: "number" },
                    { name: "downloadable", title: "Downloadable", type: "boolean" }
                  ]
                }
              ]
            }
          ]
        })
      ]
    }
  };
});
export {
  soundcloudInput
};
//# sourceMappingURL=index.mjs.map
