export interface FollowResponse {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "OrderedCollection";
  totalItems: number;
  first: string;
}