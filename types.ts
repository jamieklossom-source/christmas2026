export type ParticleData = {
  // Target position in the Tree shape
  treePos: [number, number, number];
  treeRot: [number, number, number];
  // Target position in the Scattered shape
  scatterPos: [number, number, number];
  scatterRot: [number, number, number];
  // Random scale variation
  scale: number;
  // Speed factor for individual variation during animation
  speed: number;
};

export enum TreeState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}