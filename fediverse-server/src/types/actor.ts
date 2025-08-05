export interface Actor {
  "@context": (string | Record<string, unknown>)[];
  id: string;
  type: string;
  preferredUsername: string;
  name: string;
  summary?: string;
  inbox: string;
  outbox: string;
  followers: string;
  following: string;
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