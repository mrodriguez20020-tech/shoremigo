import type { MigoExpression, MigoMode } from "./machine";
import type { FootSurface } from "./gait";
import type { PoseId } from "./poses";

/** Available capabilities, not an assertion that eight whole-body images form an articulated rig. */
export const MIGO_RENDERER_CONTRACT = {
  version: 1,
  identity: "ShoreMigo original Migo — The Little Tidekeeper",
  renderer: "sprite-2.5d",
  sourceCanvas: { width:440,height:440 },
  capabilities: { wholePoseSwap:true,rootTranslation:true,controllerContactMarkers:true,articulatedLimbs:false,continuousTurns:false,blink:false,lipsync:false },
  rights: "Original Migo art remains separately licensed; ASSETS.md is the rights authority.",
  successAuthority: ["booking:verified","rescue:resolved"],
} as const;
export interface CharacterRenderState {
  mode: MigoMode;
  expression: MigoExpression;
  pose: PoseId;
  facing: 1|-1;
  size: number;
  contact: number;
  motionPaused: boolean;
  surface: FootSurface;
}
/** A future renderer consumes this state; it never owns booking/payment decisions. */
export interface ProductionCharacterDelivery {
  contractVersion: 1;
  editableSource: { path:string; sha256:string; rightsRecord:string };
  runtimeAsset: { path:string; sha256:string; byteSize:number };
  expressionClips: Record<MigoExpression,string>;
  footMarkers: { clip:string; timeSeconds:number; foot:"left"|"right"; phase:"plant"|"lift" }[];
  approvals: { originalIdentity:boolean; appearance:boolean; contactSheet:boolean };
}
