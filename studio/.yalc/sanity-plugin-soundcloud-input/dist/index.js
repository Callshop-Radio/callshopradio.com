"use strict";
Object.defineProperty(exports, "__esModule", { value: !0 });
var sanity = require("sanity"), jsxRuntime = require("react/jsx-runtime"), react = require("react"), ui = require("@sanity/ui"), icons = require("@sanity/icons");
const DataFetcher = ({ clientId, clientSecret, userId, onSuccess }) => {
  const [mode, setMode] = react.useState("fetch"), [isFetching, setIsFetching] = react.useState(!1), [errorMsg, setErrorMsg] = react.useState(""), [tracks, setTracks] = react.useState([]), [selectedTrackIds, setSelectedTrackIds] = react.useState([]), [resolveQueries, setResolveQueries] = react.useState([""]), [mixedTracks, setMixedTracks] = react.useState([]), [uploadTracks, setUploadTracks] = react.useState([]), [showUploadSelect, setShowUploadSelect] = react.useState(!1), [selectedUploadTrack, setSelectedUploadTrack] = react.useState(void 0), [showUrlInput, setShowUrlInput] = react.useState(!1), [mixUrl, setMixUrl] = react.useState(""), fetchAccessToken = async () => {
    const tokenUrl = "https://api.soundcloud.com/oauth2/token", body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      userId,
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
      }), data = await response.json();
      return data.access_token ? data.access_token : (setErrorMsg(
        (data.error || "Failed to obtain access token.") + " Status: " + response.status
      ), null);
    } catch (error) {
      return console.error("Error fetching access token:", error), setErrorMsg("Error obtaining access token"), null;
    }
  }, fetchTracks = async () => {
    setIsFetching(!0), setErrorMsg("");
    const accessToken = await fetchAccessToken();
    if (!accessToken) {
      setIsFetching(!1);
      return;
    }
    const url = `https://api.soundcloud.com/users/${userId}/tracks?access=playable&limit=50`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
      }), data = await response.json();
      if (response.ok)
        if (data && data.length > 0) {
          const sortedTracks = data.sort((a, b) => {
            const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
            return (b.release_date ? new Date(b.release_date).getTime() : 0) - dateA;
          });
          setTracks(sortedTracks), setErrorMsg(""), setSelectedTrackIds([void 0]);
        } else
          setErrorMsg("No tracks found.");
      else
        data.errors && data.errors[0] && data.errors[0].error_message ? setErrorMsg(`API Error: ${data.errors[0].error_message}`) : setErrorMsg("Unknown error occurred while fetching tracks.");
    } catch (error) {
      console.error("Error fetching tracks:", error), setErrorMsg("There was an error fetching tracks.");
    } finally {
      setIsFetching(!1);
    }
  }, resolveAndConfirmTracks = async () => {
    setIsFetching(!0), setErrorMsg("");
    const accessToken = await fetchAccessToken();
    if (!accessToken) {
      setIsFetching(!1);
      return;
    }
    const queriesToResolve = resolveQueries.filter((q) => q.trim() !== "");
    let aggregatedTracks = [];
    try {
      for (const query of queriesToResolve) {
        const url = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(query)}`, response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json; charset=utf-8"
          }
        }), data = await response.json();
        if (response.ok) {
          let resolvedTracks = [];
          data.kind === "track" ? resolvedTracks = [data] : data.kind === "playlist" && data.tracks ? resolvedTracks = data.tracks : data.collection && Array.isArray(data.collection) ? resolvedTracks = data.collection : Array.isArray(data) && (resolvedTracks = data), aggregatedTracks = aggregatedTracks.concat(resolvedTracks);
        } else
          setErrorMsg(`Error fetching resolve results for URL: ${query}`);
      }
      aggregatedTracks.length > 0 ? onSuccess({ _type: "soundcloud", tracks: aggregatedTracks }) : setErrorMsg("No tracks found for the provided URLs.");
    } catch (error) {
      console.error("Error fetching resolve results:", error), setErrorMsg("Error fetching resolve results.");
    } finally {
      setIsFetching(!1);
    }
  }, fetchUploadTracksForMix = async () => {
    setIsFetching(!0), setErrorMsg("");
    const accessToken = await fetchAccessToken();
    if (!accessToken) {
      setIsFetching(!1);
      return;
    }
    const url = `https://api.soundcloud.com/users/${userId}/tracks?access=playable&limit=50`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
      }), data = await response.json();
      if (response.ok && data && data.length > 0) {
        const sortedTracks = data.sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          return (b.release_date ? new Date(b.release_date).getTime() : 0) - dateA;
        });
        setUploadTracks(sortedTracks), setErrorMsg("");
      } else
        setErrorMsg("No tracks found.");
    } catch (error) {
      console.error("Error fetching uploads for mix:", error), setErrorMsg("Error fetching uploads tracks.");
    } finally {
      setIsFetching(!1);
    }
  }, handleAddFromUploads = async () => {
    uploadTracks.length === 0 && await fetchUploadTracksForMix(), setShowUploadSelect(!0), setShowUrlInput(!1);
  }, addSelectedUploadTrack = () => {
    if (selectedUploadTrack) {
      const trackToAdd = uploadTracks.find((track) => track.id === selectedUploadTrack);
      trackToAdd && setMixedTracks((prev) => [...prev, trackToAdd]);
    }
    setShowUploadSelect(!1), setSelectedUploadTrack(void 0);
  }, handleAddFromUrl = () => {
    setShowUrlInput(!0), setShowUploadSelect(!1);
  }, addTrackFromUrl = async () => {
    if (!mixUrl.trim()) return;
    setIsFetching(!0), setErrorMsg("");
    const accessToken = await fetchAccessToken();
    if (!accessToken) {
      setIsFetching(!1);
      return;
    }
    const url = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(mixUrl)}`;
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json; charset=utf-8"
        }
      }), data = await response.json();
      if (response.ok) {
        let resolvedTracks = [];
        data.kind === "track" ? resolvedTracks = [data] : data.kind === "playlist" && data.tracks ? resolvedTracks = data.tracks : data.collection && Array.isArray(data.collection) ? resolvedTracks = data.collection : Array.isArray(data) && (resolvedTracks = data), resolvedTracks.length > 0 ? setMixedTracks((prev) => [...prev, ...resolvedTracks]) : setErrorMsg("No tracks found for the provided URL.");
      } else
        setErrorMsg(`Error fetching resolve results for URL: ${mixUrl}`);
    } catch (error) {
      console.error("Error adding track from URL in mix mode:", error), setErrorMsg("Error fetching resolve results.");
    } finally {
      setIsFetching(!1), setShowUrlInput(!1), setMixUrl("");
    }
  }, handleSelectChange = (index, event) => {
    const value = event.target.value, newSelectedTrackIds = [...selectedTrackIds];
    newSelectedTrackIds[index] = value ? Number(value) : void 0, setSelectedTrackIds(newSelectedTrackIds);
  }, confirmMixedSelection = () => {
    mixedTracks.length > 0 ? onSuccess({ _type: "soundcloud", tracks: mixedTracks }) : setErrorMsg("No tracks added to the mix.");
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 4, children: [
    (!clientId || !clientSecret || !userId) && /* @__PURE__ */ jsxRuntime.jsxs(ui.Inline, { space: [2], children: [
      /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 2, children: "Missing" }),
      /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 2, style: { fontWeight: "bold" }, children: "Client ID, Client Secret oder User ID" })
    ] }),
    clientId && clientSecret && userId && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 2, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 2, weight: "semibold", style: { marginBottom: "2px" }, children: "Choose Track Source" }),
        /* @__PURE__ */ jsxRuntime.jsxs("label", { style: { display: "block", fontSize: "14px" }, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "input",
            {
              type: "radio",
              name: "mode",
              value: "fetch",
              checked: mode === "fetch",
              onChange: () => setMode("fetch"),
              style: { marginRight: "8px" }
            }
          ),
          "Latest Uploads"
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("label", { style: { display: "block", fontSize: "14px" }, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "input",
            {
              type: "radio",
              name: "mode",
              value: "resolve",
              checked: mode === "resolve",
              onChange: () => setMode("resolve"),
              style: { marginRight: "8px" }
            }
          ),
          "URL"
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("label", { style: { display: "block", fontSize: "14px" }, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "input",
            {
              type: "radio",
              name: "mode",
              value: "mix",
              checked: mode === "mix",
              onChange: () => setMode("mix"),
              style: { marginRight: "8px" }
            }
          ),
          "Mixed"
        ] })
      ] }),
      mode === "fetch" && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Button,
          {
            text: "Load Tracks",
            onClick: fetchTracks,
            disabled: isFetching,
            tone: "primary"
          }
        ),
        tracks.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 3, children: [
          selectedTrackIds.map((selectedId, index) => /* @__PURE__ */ jsxRuntime.jsx(
            ui.Select,
            {
              onChange: (e) => handleSelectChange(index, e),
              value: selectedId ? selectedId.toString() : "",
              style: { padding: "8px", fontSize: "14px" },
              children: /* @__PURE__ */ jsxRuntime.jsxs("optgroup", { label: "Tracks", children: [
                /* @__PURE__ */ jsxRuntime.jsx("option", { value: "", children: "Bitte w\xE4hlen..." }),
                tracks.map((track) => /* @__PURE__ */ jsxRuntime.jsxs("option", { value: track.id.toString(), children: [
                  track.title,
                  " ",
                  track.release_date ? `(${track.release_date})` : ""
                ] }, track.id))
              ] })
            },
            index
          )),
          /* @__PURE__ */ jsxRuntime.jsx(
            ui.Button,
            {
              text: "Add more",
              onClick: () => setSelectedTrackIds([...selectedTrackIds, void 0]),
              disabled: isFetching,
              tone: "primary"
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ui.Button,
            {
              text: "Confirm Selection",
              onClick: () => {
                const selectedIds = selectedTrackIds.filter((id) => id !== void 0), selectedTracksData = tracks.filter(
                  (track) => selectedIds.includes(track.id)
                );
                onSuccess({ _type: "soundcloud", tracks: selectedTracksData });
              },
              disabled: selectedTrackIds.filter((id) => id !== void 0).length === 0,
              tone: "primary"
            }
          )
        ] })
      ] }),
      mode === "resolve" && /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 3, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 2, weight: "semibold", children: "Enter URL" }),
        resolveQueries.map((query, index) => /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            type: "text",
            placeholder: "https://soundcloud.com/\u2026",
            value: query,
            onChange: (e) => {
              const newQueries = [...resolveQueries];
              newQueries[index] = e.target.value, setResolveQueries(newQueries);
            },
            style: { padding: "8px", fontSize: "14px", width: "100%", marginBottom: "8px" }
          },
          index
        )),
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Button,
          {
            text: "Add more",
            onClick: () => setResolveQueries([...resolveQueries, ""]),
            disabled: isFetching,
            tone: "primary"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Button,
          {
            text: "Confirm Selection",
            onClick: resolveAndConfirmTracks,
            disabled: isFetching || resolveQueries.every((q) => q.trim() === ""),
            tone: "primary"
          }
        )
      ] }),
      mode === "mix" && /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 3, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 2, weight: "semibold", children: "Mixed Collection" }),
        mixedTracks.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
          /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", style: { marginBottom: "4px" }, children: "Selected Tracks" }),
          mixedTracks.map((track) => /* @__PURE__ */ jsxRuntime.jsxs(ui.Text, { size: 1, style: { marginBottom: "8px", marginTop: "4px" }, children: [
            track.title,
            " ",
            track.release_date ? `(${track.release_date})` : ""
          ] }, track.id))
        ] }),
        showUploadSelect && /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 2, children: [
          /* @__PURE__ */ jsxRuntime.jsxs(
            ui.Select,
            {
              onChange: (e) => setSelectedUploadTrack(
                e.target.value ? Number(e.target.value) : void 0
              ),
              value: selectedUploadTrack ? selectedUploadTrack.toString() : "",
              style: { padding: "8px", fontSize: "14px" },
              children: [
                /* @__PURE__ */ jsxRuntime.jsx("option", { value: "", children: "Bitte w\xE4hlen..." }),
                uploadTracks.map((track) => /* @__PURE__ */ jsxRuntime.jsxs("option", { value: track.id.toString(), children: [
                  track.title,
                  " ",
                  track.release_date ? `(${track.release_date})` : ""
                ] }, track.id))
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ui.Button,
            {
              text: "Select Track",
              onClick: addSelectedUploadTrack,
              disabled: !selectedUploadTrack,
              tone: "primary"
            }
          )
        ] }),
        showUrlInput && /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 2, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "input",
            {
              type: "text",
              placeholder: "SoundCloud URL eingeben",
              value: mixUrl,
              onChange: (e) => setMixUrl(e.target.value),
              style: { padding: "8px", fontSize: "14px", width: "100%" }
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ui.Button,
            {
              text: "Select Track",
              onClick: addTrackFromUrl,
              disabled: !mixUrl.trim(),
              tone: "primary"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs(ui.Inline, { space: 2, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            ui.Button,
            {
              text: "Add from latest Uploads",
              onClick: handleAddFromUploads,
              disabled: isFetching,
              tone: "primary"
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            ui.Button,
            {
              text: "Add from URL",
              onClick: handleAddFromUrl,
              disabled: isFetching,
              tone: "primary"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx(
          ui.Button,
          {
            text: "Confirm Selection",
            onClick: confirmMixedSelection,
            disabled: mixedTracks.length === 0,
            tone: "primary"
          }
        )
      ] }),
      isFetching && /* @__PURE__ */ jsxRuntime.jsx(ui.Spinner, { muted: !0 }),
      errorMsg && /* @__PURE__ */ jsxRuntime.jsxs(ui.Text, { style: { color: "red" }, children: [
        "Error: ",
        errorMsg
      ] })
    ] })
  ] });
}, TrackItem = ({ track }) => {
  const [showDetails, setShowDetails] = react.useState(!1), toggleDetails = () => setShowDetails((prev) => !prev);
  return /* @__PURE__ */ jsxRuntime.jsxs(ui.Box, { padding: 3, border: !0, style: { borderRadius: "4px", marginBottom: "1rem" }, children: [
    track.artwork_url && /* @__PURE__ */ jsxRuntime.jsx(ui.Box, { marginBottom: 3, children: /* @__PURE__ */ jsxRuntime.jsx(
      "img",
      {
        src: track.artwork_url.replace("-large", "-t200x200"),
        alt: "Artwork",
        style: { width: "auto", height: "200px", borderRadius: "2px" }
      }
    ) }),
    /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 2, marginBottom: 3, children: [
      /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Title" }),
      /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.title || "" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(
      ui.Button,
      {
        text: showDetails ? "Hide Details" : "Show Details",
        onClick: toggleDetails,
        tone: "primary"
      }
    ),
    showDetails && /* @__PURE__ */ jsxRuntime.jsxs(ui.Box, { marginTop: 3, children: [
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Track ID" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.id?.toString() || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Created At" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.created_at || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Duration" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.duration?.toString() || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Tag List" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.tag_list || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Streamable" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.streamable?.toString() || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Genre" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.genre || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Description" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.description || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "License" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.license || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "URI" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.uri || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Stream URL" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.stream_url || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Playback Count" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.playback_count?.toString() || "" })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 1, children: [
        /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { size: 1, weight: "semibold", children: "Favoritings Count" }),
        /* @__PURE__ */ jsxRuntime.jsx(ui.TextInput, { readOnly: !0, value: track.favoritings_count?.toString() || "" })
      ] })
    ] })
  ] });
}, SoundCloudInputField = ({ config, onChange, value }) => {
  const { clientId, clientSecret, userId } = config, handleReset = () => {
    onChange(sanity.unset());
  }, setTrackData = (data) => {
    onChange(data ? sanity.set(data) : sanity.unset());
  };
  return value ? /* @__PURE__ */ jsxRuntime.jsx(ui.Card, { padding: 4, children: /* @__PURE__ */ jsxRuntime.jsxs(ui.Stack, { space: 4, children: [
    value.tracks && value.tracks.length > 0 ? value.tracks.map((track, index) => /* @__PURE__ */ jsxRuntime.jsx(TrackItem, { track }, track.id || index)) : /* @__PURE__ */ jsxRuntime.jsx(ui.Text, { children: "No tracks available." }),
    /* @__PURE__ */ jsxRuntime.jsx(ui.Inline, { space: [2], children: /* @__PURE__ */ jsxRuntime.jsx(
      ui.Button,
      {
        text: "Reset",
        icon: icons.TrashIcon,
        mode: "ghost",
        onClick: handleReset,
        type: "reset",
        tone: "critical"
      }
    ) })
  ] }) }) : /* @__PURE__ */ jsxRuntime.jsx(ui.Card, { padding: 4, children: /* @__PURE__ */ jsxRuntime.jsx(
    DataFetcher,
    {
      clientId,
      clientSecret,
      userId,
      onSuccess: setTrackData
    }
  ) });
};
function soundcloudInputRendering(config) {
  return {
    input: (props) => /* @__PURE__ */ jsxRuntime.jsx(SoundCloudInputField, { config, ...props })
  };
}
const soundcloud = sanity.defineType({
  title: "SoundCloud Set",
  name: "soundcloud",
  // Type name used in schemas
  type: "object",
  fields: [
    { name: "id", title: "Track ID", type: "number" },
    { name: "created_at", title: "Created At", type: "datetime" },
    { name: "duration", title: "Duration", type: "number" },
    { name: "tag_list", title: "Tag List", type: "string" },
    { name: "streamable", title: "Streamable", type: "boolean" },
    { name: "purchase_url", title: "Purchase URL", type: "url" },
    { name: "genre", title: "Genre", type: "string" },
    { name: "title", title: "Title", type: "string" },
    { name: "description", title: "Description", type: "text" },
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
        { name: "permalink_url", title: "Permalink URL", type: "url" }
      ]
    },
    { name: "artwork_url", title: "Artwork URL", type: "url" },
    { name: "waveform_url", title: "Artwork URL", type: "url" },
    { name: "stream_url", title: "Stream URL", type: "url" },
    { name: "playback_count", title: "Playback Count", type: "number" },
    { name: "favoritings_count", title: "Favoritings Count", type: "number" }
  ]
}), defaultConfig = {
  clientId: "",
  clientSecret: "",
  userId: ""
}, soundcloudInput = sanity.definePlugin((userConfig) => {
  const config = { ...defaultConfig, ...userConfig };
  return (!config.clientId || !config.clientSecret || !config.userId) && console.warn(
    "SoundCloud Plugin: Missing clientId, clientSecret or userId. Please pass them in the configuration."
  ), {
    name: "sanity-plugin-soundcloud-input",
    schema: {
      types: [
        sanity.defineType({
          ...soundcloud,
          components: {
            input: soundcloudInputRendering(config).input
          }
        })
      ]
    }
  };
});
exports.soundcloudInput = soundcloudInput;
//# sourceMappingURL=index.js.map
