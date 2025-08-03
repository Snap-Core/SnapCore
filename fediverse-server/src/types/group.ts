import {Actor} from "./actor";

export interface Group extends Actor {
  type: "Group";
  published: Date;
  updated: Date;
}