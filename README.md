# ImproLong

## Définitions

### C'est quoi le théâtre d'improvisation ?

Une forme de théâtre où les comédiens ne connaissent pas en amont tout ou une partie des informations nécessaires pour jouer concrètement la pièce.

Par exemple:

- on demande au public un mot et les comédiens doivent jouer une scène à partir de ce mot
- on choisit un objet sans que les comédiens en aient conscience, on leur révèle l'objet et ils doivent jouer une scène en utilisant cet objet
- les comédiens travaillent sur des personnages tout un week-end puis doivent réaliser une pièce entière le dimanche soir dans un lieu qui ne le sera révélé que juste avant le début du spectacle

Ce ne sont que des exemples, l'important est que les comédiens jouent en dépit du fait qu'ils n'ont pas toutes les informations en amont

### C'est quoi un concept de théâtre d'improvisation ?

Ce sont des règles ou contraintes ou structures de mise en scène que les comédiens doivent respecter tout le long du spectacle.

L'enchaînement des différentes scènes d'une impro longue s'appelle la trame.

Exemple:

- dans Toc Toc, il y a la scène où se joue la pièce et une porte. Derrière cette porte, il y a des joueurs qui n'entendent pas ce qui se passe sur scène mais doivent quand même entrer en scène et composer avec ce manque d'informations

### C'est quoi une impro longue ?

C'est une pièce de théâtre improvisée d'une durée supérieure à 30 minutes.

En fonction du concept, l'impro peut avoir une seule ou plusieurs scènes, un seul ou plusieurs lieux, ou plusieurs unités de temps, etc.

## Spécifications

Ce projet permet d'afficher des informations à des comédiens d'improvisation pendant le déroulement d'une pièce de théâtre improvisée longue.

Il permet aussi de contrôler l'affichage en temps réel pour que les informations soient correctes par rapport au déroulé du spectacle.

Il n'y aura qu'un client frontend qui fonctionnera sur une tablette Android.

## Modes

On aura trois modes:

- mode `préparation` pour faire démarrer le spectacle, on affiche un bouton `Démarrer`. Si la tablette a du réseau, on affiche aussi un rappel de passer en mode avion : avec du réseau, Android peut corriger l'heure en plein spectacle et fausser les timers. Le rappel disparaît dès que la tablette est hors-ligne
- mode `jeu` qui affiche les informations pour les comédiens
- mode `édition` pour contrôler ce qui est affiché à l'écran

### Mode `édition`

Pendant un spectacle, le metteur en scène peut agir activement sur ce qui est affiché quand on rebasculera en mode `jeu`.

Les timers continuent de tourner pendant qu'on est en mode `édition`.

Les contrôles sont:

- possibilité d'afficher un message pour les comédiens sur scène, ce message sera affiché jusqu'à ce que le metteur en scène décide de le cacher en appuyant sur un bouton
- des messages prédéfinis (ex. `Accélérez`, `Ralentissez`, `Dernière minute`, `Changez de lieu`) s'affichent en un seul appui, sans rien taper. Comme la trame, la liste est codée en dur dans `src/quickMessages.ts`
- passer en mode `jeu`

### Mode `jeu`

Dans ce mode on aura un bouton pour passer en mode `édition` et un autre pour passer à la scène suivante.

Le passage à la scène suivante n'est pas automatique, il faut appuyer sur le bouton pour le faire.

Quand on passe d'une scène à l'autre, si le temps réel de la scène en cours diffère du temps prévu (avance ou retard), on conserve le temps prévu pour la scène suivante mais on affiche le glissement de temps (ex. `+30 s` d'avance ou `-1 min 12 s` de retard).

Exemple:

"La scène 2 devait durer 5 minutes mais elle dure 4 minutes 30, et la scène 3 doit durer 10 minutes, alors on affiche qu'il reste 10 minutes quand on passe à la scène 3 mais on affichera aussi qu'on a 30 secondes d'avance sur le spectacle".

Ce mode affichera de manière très claire pour qu'on puisse voir de loin:

- quatre timers : le temps écoulé depuis le début du spectacle, le temps restant prévu pour le spectacle, le temps depuis le début de la scène et le temps prévu jusqu'à la fin de la scène, plus le glissement s'il y en a un
- le temps restant de la scène est le timer principal : il est bien plus grand que les trois autres
- une barre de progression sous ce timer montre l'avancement de la scène
- un encart pour indiquer le nom de la scène actuelle dans la trame
- un autre encart pour indiquer le nom de la scène suivante dans la trame

Si le metteur en scène a voulu afficher un message aux joueurs, alors on affiche juste le message. Le bouton pour passer en mode `édition` reste visible pour pouvoir cacher le message.

Le temps restant prévu pour le spectacle est la somme des durées prévues des scènes restantes (temps restant prévu de la scène en cours + durées des scènes suivantes). Il ne tient pas compte du glissement, qui est affiché à part.

Exemple: spectacle de 45 minutes, la scène 1 dure 5 minutes comme prévu, la scène 2 prévue pour 5 minutes se termine à 4 minutes 30. Au passage à la scène 3, on affiche 35:00 restant pour le spectacle et `+30 s` de glissement.

Dans la dernière minute d'une scène, le temps restant de la scène et la barre de progression passent en ambre.

Si la scène en cours dépasse son temps prévu, le temps prévu jusqu'à la fin de la scène devient négatif et s'affiche en rouge (ex. `-1:12`), la barre reste pleine et passe aussi en rouge. Les couleurs ne sont jamais seules : le texte (signe `-`, chiffres) porte toujours l'information.

À la dernière scène, il n'y a pas d'encart pour la scène suivante : l'encart de la scène actuelle prend toute la largeur.

Pour la fin du spectacle, on n'affiche pas de scène suivante à la dernière scène et le bouton pour passer à la scène suivante devient `Terminer`.

Quand on appuie sur `Terminer`, on affiche un écran de fin figé avec le temps total du spectacle et le glissement final.

## Trame

La trame sera hardcodée en JSON dans `src/trame.json` et ne sera donc pas éditable.

Les durées sont indiquées en ISO 8601.

La trame est constituée de plusieurs scènes qui ont une durée.

La durée totale du spectacle est la somme des durées des scènes.

Exemple:

```json
{
    "scenes": [
        {
            "name": "Introduction",
            "duration": "PT5M"
        },
        {
            "name": "Milieu",
            "duration": "PT35M"
        },
        {
            "name": "Fin",
            "duration": "PT5M"
        }
    ]
}
```

## Tech

On utilisera TypeScript, React, Tailwind.

En cas de rechargement accidentel, on doit conserver l'état.

Ce sera une PWA.
