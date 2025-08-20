export default function isMobile() {
  const userAgent = navigator.userAgent;
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
}
