// PocketBase record ids must be 15 characters of [a-z0-9]
export const ID_PATTERN = /^[a-z0-9]{15}$/;

export const newId = () => crypto.randomUUID().replaceAll("-", "").slice(0, 15);
