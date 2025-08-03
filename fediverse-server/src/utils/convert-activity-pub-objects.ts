import { User } from "../../../shared/types/user";
import { Person } from "../types/person";
import dotenv from 'dotenv';
import {Community} from "../../../shared/types/community";
import {Group} from "../types/group";

dotenv.config();

const fediverseServerUrl = new URL(process.env.FEDIVERSE_SERVER_URL as string);

export function getPersonFromUser(user: User): Person {
  const actorId = `${fediverseServerUrl}users/${user.username}`;

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
      publicKeyPem:  "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----" // todo: find way to generate programmatically
    }
  };
}

export function getGroupFromCommunity(community: Community): Group {
  const actorId = `${fediverseServerUrl}groups/${community.handle}`;

  return {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    id: actorId,
    type: "Group",
    preferredUsername: community.handle,
    name: community.displayName,
    summary: community.summary || '',
    inbox: `${actorId}/inbox`,
    outbox: `${actorId}/outbox`,
    followers: `${actorId}/followers`,
    following: `${actorId}/following`,
    icon: {
      type: "Image",
      mediaType: "image/jpeg",
      url: community.communityPicUrl
    },
    publicKey: {
      id: `${actorId}#main-key`,
      owner: actorId,
      publicKeyPem:  "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----" // todo: find way to generate programmatically
    },
    published: community.created,
    updated: community.updated,
  };
}

export function getUserFromPerson(person: Person): User {
  return {
    username: person.preferredUsername || '',
    displayName: person.name || '',
    summary: person.summary || '',
    profilePicUrl: person.icon?.url || ''
  };
}