import {Actor} from "./actor";

export interface Person extends Actor {
  type: "Person";
  liked: string;
}