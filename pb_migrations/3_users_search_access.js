migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.fields.add(new BoolField({ name: "canSearch" }));
    // Accounts are managed in the admin UI only: users can't edit or delete themselves via the API
    users.updateRule = null;
    users.deleteRule = null;
    app.save(users);

    // With a single account, turn search on for it; otherwise tick canSearch by hand
    const accounts = app.findAllRecords("users");
    if (accounts.length === 1) {
      accounts[0].set("canSearch", true);
      app.save(accounts[0]);
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.fields.removeByName("canSearch");
    users.updateRule = "id = @request.auth.id";
    users.deleteRule = "id = @request.auth.id";
    app.save(users);
  },
);
