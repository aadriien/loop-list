migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.fields.add(new BoolField({ name: "isOwner" }));
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.fields.removeByName("isOwner");
    app.save(users);
  },
);
