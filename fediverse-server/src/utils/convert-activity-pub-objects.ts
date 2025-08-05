import { User } from "../../../shared/types/user";
import { Person } from "../types/person";
import {Community} from "../../../shared/types/community";
import {Group} from "../types/group";

export function getPersonFromUser(user: User): Person {
  return {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    id: user.id,
    type: "Person",
    preferredUsername: user.username,
    name: user.displayName,
    summary: user.summary || '',
    inbox: `${user.id}/inbox`,
    outbox: `${user.id}/outbox`,
    followers: `${user.id}/followers`,
    following: `${user.id}/following`,
    liked: `${user.id}/liked`,
    icon: {
      type: "Image",
      mediaType: "image/jpeg",
      url: user.profilePicUrl
    },
    publicKey: {
      id: `${user.id}#main-key`,
      owner: user.id,
      publicKeyPem: user.publicKey
    }
  };
}

export function getGroupFromCommunity(community: Community): Group {

  return {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    id: community.id,
    type: "Group",
    preferredUsername: community.handle,
    name: community.displayName,
    summary: community.summary || '',
    inbox: `${community.id}/inbox`,
    outbox: `${community.id}/outbox`,
    followers: `${community.id}/followers`,
    following: `${community.id}/following`,
    icon: {
      type: "Image",
      mediaType: "image/jpeg",
      url: community.communityPicUrl
    },
    publicKey: {
      id: `${community.id}#main-key`,
      owner: community.id,
      publicKeyPem:  community.handle,
    },
    published: community.created,
    updated: community.updated,
  };
}

export function getUserFromPerson(person: Person): User {
  return {
    id: person.id,
    username: person.preferredUsername || '',
    displayName: person.name || '',
    summary: person.summary || '',
    profilePicUrl: person.icon?.url || '',
    publicKey: person.publicKey.publicKeyPem
  };
}