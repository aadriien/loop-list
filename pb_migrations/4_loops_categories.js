migrate(
  (app) => {
    const loops = app.findCollectionByNameOrId("loops");
    // A plain list of category names per loop, e.g. ["Guitar", "Birds"]
    loops.fields.add(new JSONField({ name: "categories", maxSize: 4096 }));
    app.save(loops);
  },
  (app) => {
    const loops = app.findCollectionByNameOrId("loops");
    loops.fields.removeByName("categories");
    app.save(loops);
  },
);
