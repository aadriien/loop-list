// Keeps the YouTube Data API key on the server; only signed-in users can spend the quota
routerAdd(
  "GET",
  "/api/yt/search",
  (e) => {
    const key = $os.getenv("YT_API_KEY");
    if (!key) throw new InternalServerError("YT_API_KEY is not set");

    const query = e.request.url.query();
    const q = (query.get("q") || "").trim();
    if (!q) throw new BadRequestError("Missing search text");

    // videoEmbeddable and videoSyndicated keep results to videos that can play on other sites
    let url =
      "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video" +
      "&videoEmbeddable=true&videoSyndicated=true&maxResults=12" +
      "&q=" +
      encodeURIComponent(q) +
      "&key=" +
      encodeURIComponent(key);
    const pageToken = query.get("pageToken");
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

    const res = $http.send({ url: url, method: "GET", timeout: 10 });
    if (res.statusCode !== 200) {
      const reason = res.json?.error?.errors?.[0]?.reason;
      if (reason === "quotaExceeded") {
        throw new ApiError(429, "Daily YouTube search limit reached", {});
      }
      throw new ApiError(
        502,
        `YouTube search failed (${reason || res.statusCode})`,
        {},
      );
    }

    // Search results come HTML-escaped (&amp;, &#39;)
    const decode = (s) =>
      s
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");

    return e.json(200, {
      items: res.json.items.map((item) => ({
        videoId: item.id.videoId,
        title: decode(item.snippet.title),
        channel: decode(item.snippet.channelTitle),
      })),
      nextPageToken: res.json.nextPageToken || "",
    });
  },
  $apis.requireAuth(),
);
