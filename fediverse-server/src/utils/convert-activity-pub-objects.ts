import { User } from "../../../shared/types/user";
import { Person } from "../types/person";

export function getPersonFromUser(user: User): Person {
  const baseUrl = `http://localhost:4000`; // todo: find better way to retrieve base url
  const actorId = `${baseUrl}/users/${user.username}`;

  return {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    id: actorId,
    type: "Person",
    preferredUsername: user.username,
    name: user.displayName,
    summary: user.summary || '',
    inbox: `${actorId}/inbox`,
    outbox: `${actorId}/outbox`,
    followers: `${actorId}/followers`,
    following: `${actorId}/following`,
    liked: `${actorId}/liked`,
    icon: {
      type: "Image",
      mediaType: "image/jpeg",
      url: user.profilePicUrl
    },
    publicKey: {
      id: `${actorId}#main-key`,
      owner: actorId,
      publicKeyPem: user.publicKey
    }
  };
}

export function getUserFromPerson(person: Person): User {
  return {
    username: person.preferredUsername || '',
    displayName: person.name || '',
    summary: person.summary || '',
    publicKey: person.publicKey?.publicKeyPem || '',
    profilePicUrl: person.icon?.url || ''
  };
}