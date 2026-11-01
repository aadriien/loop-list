migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const loops = app.findCollectionByNameOrId("loops");

    const owner = "user = @request.auth.id";
    loops.fields.add(
      new RelationField({
        name: "user",
        collectionId: users.id,
        cascadeDelete: true,
        maxSelect: 1,
      }),
    );
    loops.listRule = owner;
    loops.viewRule = owner;
    loops.deleteRule = owner;
    // Ownership is stamped by pb_hooks/loops.pb.js and can't be reassigned
    loops.updateRule = `${owner} && @request.body.user:isset = false`;
    loops.createRule = "@request.auth.id != ''";
    app.save(loops);

    // Existing loops belong to the only account that's currently active
    const accounts = app.findAllRecords("users");
    if (accounts.length === 1) {
      for (const loop of app.findAllRecords("loops")) {
        loop.set("user", accounts[0].id);
        app.save(loop);
      }
    }

    loops.fields.getByName("user").required = true;
    app.save(loops);
  },
  (app) => {
    const loops = app.findCollectionByNameOrId("loops");
    const signedIn = "@request.auth.id != ''";
    loops.fields.removeByName("user");
    loops.listRule = signedIn;
    loops.viewRule = signedIn;
    loops.createRule = signedIn;
    loops.updateRule = signedIn;
    loops.deleteRule = signedIn;
    app.save(loops);
  },
);
