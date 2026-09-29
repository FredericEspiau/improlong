/**
Taille de police (en % de la largeur d'écran) d'un message affiché aux comédiens.
Un message court occupe un maximum de place, un long reste dans l'écran sans passer sous un seuil lisible de loin.
*/
export function messageFontSizeVw(text: string): number {
  const length = text.trim().length;
  if (length <= 15) {
    return 16;
  }
  if (length <= 40) {
    return 10;
  }
  if (length <= 80) {
    return 6.5;
  }
  return length <= 160 ? 5 : 3.5;
}
