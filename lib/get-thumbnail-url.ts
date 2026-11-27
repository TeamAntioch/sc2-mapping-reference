export const getThumbnailUrl = (url: string) => {
  if (url.endsWith(".jpg")) {
    return url.replace(".jpg", "_tn.jpg");
  }
  if (url.endsWith(".png")) {
    return url.replace(".png", "_tn.png");
  }
  return url.replace(".gif", "_tn.gif");
};

/** The middle-sized thumbnail (512 px wide, or the picture's own width if narrower), always a JPEG. */
export const getMediumUrl = (url: string) => url.replace(/\.(jpg|png|gif)$/, "_md.jpg");
