export const getThumbnailUrl = (url: string) => {
  if (url.endsWith(".jpg")) {
    return url.replace(".jpg", "_tn.jpg");
  }
  if (url.endsWith(".png")) {
    return url.replace(".png", "_tn.png");
  }
  return url.replace(".gif", "_tn.gif");
};
