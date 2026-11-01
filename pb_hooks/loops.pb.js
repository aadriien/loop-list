// Owner is always the signed-in user, whatever the client sends
onRecordCreateRequest((e) => {
  if (e.auth && e.auth.collection().name === "users") {
    e.record.set("user", e.auth.id);
  }
  e.next();
}, "loops");
