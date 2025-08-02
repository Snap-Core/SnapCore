export interface Person {
  "@context": (string | Record<string, unknown>)[];
  id: string;
  type: "Person";
  preferredUsername: string;
  name: string;
  summary?: string;
  inbox: string;
  outbox: string;
  followers: string;
  following: string;
  liked: string;
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
  icon: {
    type: string,
    mediaType: string,
    url: string
  }
}