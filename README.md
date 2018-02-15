# Rezepte

## Installation

Dazu muss erst mal ein firebase Account angelegt werden.
### Projekt hinzufuegen
- Name wählen
- Land/Region = Deutschland

## Firebase Optionen 
hier auf die entsprechenden Optionen klicken. Da kommen dann solch "Jetzt testen" Button.
Drauf klicken und weiter geht's...

### Firebase Authentication
- aktiviere unter Anmeldemethode Email/Passwort
- erstelle unter Nutzer zumindest einen Nutzer

### Firebase Database
- waehle "Cloud Firestore" (Firestore Beta testen)
    - im gesperrten Modus -> die Regeln werden entsprechend angelegt

### Firebase Storage
- auch hier einfach nur anklicken, die angelegten Sicherheitsregeln sind OK

### Firebase Hosting
- hier kommen Hinweise zum deployen des Source Codes
    - `npm install -g firebase-tools`
    - `firebase login`
    - `firebase init`
    - `firebase deploy`

## Source Code deployen

Repository klonen (oder Zip File)
`git clone git@github.com:MatthiasWiesner/meine-rezepte.git`

Wenn man noch nicht die Firebase Tools installiert hat:
- Um die Firebase zu installieren brauchts nodejs. 
    - Hier empfiehlt es sich die neueste nodejs Version zu installieren - nicht die vom System!
    - Das macht man am besten mit [nvm](https://github.com/creationix/nvm)
- Mit nodejs kommt auch `npm` mit. In dem Kommando hat's die `-g` Option.
    - die bewirkt eine globale Installation unteer `/usr/local/bin` (oder ähnlich)
    - Also unter Mac OSX kann das ztiemlich hässlich werden, also habe ich diese Option weggelassen

### Config Datei anpassen!
- Lege eine Datei an `./public/js/config.js`
```
var config = {
  apiKey: "...",
  authDomain: "<project-id>.firebaseapp.com",
  projectId: '<project-id>',
  storageBucket: 'gs://<project-id>.appspot.com'
};
```

Die Werte dazu bekommt man alle aus Firebase
- Den `apiKey` bekommt man aus den "Projekteinstellungen" (Bei "Project Overview" das Rad)
    - das ist der `Web-API-Schlüssel`
- Die `authDomain` steht unter Hosting, bei "Domain" sowas wie "<project-id>.firebaseapp.com"
- Die `projectId` bekommt man aus den "Projekteinstellungen": `Projekt-ID`
- Den `storageBucket` bekommt man unter "Storage" ziemlich weit oben, das ist dann sowas wie "gs://<project-id>.appspot.com"

Wenn das ferig ist:
- `firebase login`
- `firebase init`
- `firebase deploy`
