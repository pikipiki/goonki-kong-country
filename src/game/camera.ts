/** Frame both the landing area and the player; UI safe areas live outside this viewport. */
export function cameraLayout(width: number, height: number, title = false) {
  const portrait = width / height < 0.9;
  const worldWidth = title
    ? width / (height / 12.8)
    : Math.max(portrait ? 12.8 : 15.5, (width / height) * 9.7);
  const zoom = title ? height / 12.8 : width / worldWidth;
  const worldHeight = height / zoom;
  return {
    portrait,
    zoom,
    worldWidth,
    worldHeight,
    ahead: Math.min(3.7, worldWidth * 0.2),
    lookY: title ? 2.7 : Math.max(1.9, worldHeight * 0.19),
  };
}
