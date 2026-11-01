migrate(
  (app) => {
    // Registration is open by default; accounts are created in the admin UI instead
    const users = app.findCollectionByNameOrId("users");
    users.createRule = null;
    app.save(users);

    const signedIn = "@request.auth.id != ''";
    app.save(
      new Collection({
        type: "base",
        name: "loops",
        listRule: signedIn,
        viewRule: signedIn,
        createRule: signedIn,
        updateRule: signedIn,
        deleteRule: signedIn,
        fields: [
          { type: "text", name: "videoId", required: true },
          { type: "text", name: "title" },
          { type: "number", name: "start" },
          { type: "number", name: "end" },
          { type: "number", name: "rate" },
          { type: "number", name: "updatedAt" },
          { type: "bool", name: "deleted" },
        ],
      }),
    );
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId("loops"));
  },
);
