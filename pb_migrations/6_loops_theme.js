migrate(
  (app) => {
    const loops = app.findCollectionByNameOrId("loops");
    // Optional theme id (e.g. "ocean"). The list of themes lives in the client, so this is plain
    // text and the client ignores ids it doesn't know.
    loops.fields.add(new TextField({ name: "theme", max: 32 }));
    app.save(loops);
  },
  (app) => {
    const loops = app.findCollectionByNameOrId("loops");
    loops.fields.removeByName("theme");
    app.save(loops);
  },
);
